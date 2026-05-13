// 1. Vercelの実行時間を最大（5分）まで延ばす設定（これでタイムアウトを防ぎます）
export const maxDuration = 300; 
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, genre, spread, birthday } = body || {};

    // 2. 生年月日が空っぽ、または文字でない場合のエラーを完全に防ぐ
    const safeBirthday = (typeof birthday === 'string') ? birthday.trim() : "未入力";

    const spreadMap: { [key: string]: string } = {
      'single': '1枚', 'three': '3枚', 'five': '5枚', 'seven': '7枚', 'ten': '10枚'
    };
    const cardCount = spreadMap[spread as string] || '複数枚';

    // 3. Difyへのリクエスト実行
    const response = await fetch(`${process.env.DIFY_API_URL}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      // タイムアウトを防ぐため、fetchのタイムアウト設定を考慮（Vercel側で対応済み）
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

    // 4. Dify側のエラー（HTMLが返ってくる問題等）をここで遮断
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Dify API Error:', errorText);
      return NextResponse.json(
        { error: 'AIが回答を生成中にエラーが発生しました。時間を置いてお試しください。' }, 
        { status: response.status }
      );
    }

    const data = await response.json();
    const difyAnswer = data.answer || "鑑定結果を取得できませんでした。";

    // 5. フロントエンドが期待する形式に整えて返す
    const baseResponse = {
      cardInterpretations: { past: "過去", present: "現在", future: "未来" }
    };

    try {
      // DifyがJSON形式で回答を返してきた場合の処理
      const parsed = JSON.parse(difyAnswer);
      return NextResponse.json({ ...baseResponse, answer: parsed.answer || difyAnswer });
    } catch (e) {
      // Difyが通常のテキストで回答を返してきた場合の処理
      return NextResponse.json({ ...baseResponse, answer: difyAnswer });
    }

  } catch (error: any) {
    console.error('Server Error details:', error);
    return NextResponse.json(
      { error: 'サーバーで予期せぬエラーが発生しました。' }, 
      { status: 500 }
    );
  }
}
