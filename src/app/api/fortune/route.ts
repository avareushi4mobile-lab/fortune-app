import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, genre, spread, birthday } = body;
    
    const safeBirthday = (typeof birthday === 'string') ? birthday.trim() : "未入力";
    
    const spreadMap: { [key: string]: string } = {
      'single': '1枚', 'three': '3枚', 'five': '5枚', 'seven': '7枚', 'ten': '10枚'
    };
    const cardCount = spreadMap[spread as string] || '複数枚';
    
    const response = await fetch(`${process.env.DIFY_API_URL}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: { 
          genre: genre || "全般",
          birthday: safeBirthday 
        },
        query: `【${cardCount}引き】${genre}についての鑑定依頼。生年月日：${safeBirthday}。相談内容：${query}`,
        response_mode: "blocking",
        user: "user-123"
      }),
    });

    // --- ここからがエラー回避の重要ポイント ---
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Dify API Error:', errorText);
      return NextResponse.json({ error: 'Dify側でエラーが発生しました' }, { status: response.status });
    }

    const data = await response.json();
    const difyAnswer = data.answer || "鑑定結果を取得できませんでした。";

    const baseResponse = {
      cardInterpretations: { past: "過去", present: "現在", future: "未来" }
    };

    try {
      const parsed = JSON.parse(difyAnswer);
      return NextResponse.json({ ...baseResponse, answer: parsed.answer || difyAnswer });
    } catch (e) {
      return NextResponse.json({ ...baseResponse, answer: difyAnswer });
    }
    // --- ここまで ---

  } catch (error: any) {
    console.error('Server Error details:', error);
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}
