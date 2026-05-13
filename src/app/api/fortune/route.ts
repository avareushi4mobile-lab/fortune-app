import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // 1. 画面から送られてきたデータ（birthdayを追加）を受け取る
    const body = await request.json();
    const { query, genre, spread, birthday } = body;
    
    // 2. 生年月日が空っぽの場合の「お守り」処理
    // 空（undefined）なら空文字に、データがあれば余白を消す
    const safeBirthday = birthday ? birthday.trim() : "未入力";
    
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
        // Difyの「変数(inputs)」に生年月日を渡す
        inputs: { 
          genre: genre || "全般",
          birthday: safeBirthday 
        },
        // AIへの命令文に生年月日を組み込む
        query: `【${cardCount}引き】${genre}についての鑑定依頼。生年月日：${safeBirthday}。相談内容：${query}`,
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
    console.error('Error details:', error); // エラー内容をログに出すように追加
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
