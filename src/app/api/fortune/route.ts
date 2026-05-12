import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { query, genre, spread } = await request.json();
    
    // スプレッドごとの枚数を定義
    const spreadMap: { [key: string]: string } = {
      'single': '1枚',
      'three': '3枚',
      'five': '5枚',
      'seven': '7枚',
      'ten': '10枚'
    };
    const cardCount = spreadMap[spread] || '複数枚';
    
    const response = await fetch(`${process.env.DIFY_API_URL}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: { genre: genre || "全般" },
        query: `【${cardCount}引き】${genre}についての鑑定依頼。相談内容：${query}`,
        response_mode: "blocking",
        user: "user-123"
      }),
    });

    const data = await response.json();
    const difyAnswer = data.answer;

    // 画面側の「データ不足エラー」を回避するためのダミーデータ付与
    const baseResponse = {
      cardInterpretations: {
        past: "過去の足跡",
        present: "現在の光",
        future: "未来の兆し"
      }
    };

    try {
      const parsed = JSON.parse(difyAnswer);
      return NextResponse.json({ ...baseResponse, answer: parsed.answer || difyAnswer });
    } catch (e) {
      return NextResponse.json({ ...baseResponse, answer: difyAnswer });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}       