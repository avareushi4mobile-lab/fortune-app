import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { query, genre, spread } = await request.json();
    
    const spreadMap: { [key: string]: string } = {
      'single': '1枚', 'three': '3枚', 'five': '5枚', 'seven': '7枚', 'ten': '10枚'
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

    const baseResponse = {
      cardInterpretations: { past: "過去", present: "現在", future: "未来" }
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
