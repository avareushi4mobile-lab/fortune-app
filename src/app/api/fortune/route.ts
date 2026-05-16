export const maxDuration = 300; 
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { question, plan, genre, birthday, partnerBirthday, cards } = body || {};

    const safeBirthday = (typeof birthday === 'string') ? birthday.trim() : "未入力";
    const safePartnerBirthday = (typeof partnerBirthday === 'string') ? partnerBirthday.trim() : "未入力";
    const safeCards = (typeof cards === 'string') ? cards.trim() : "未設定";
    const safePlan = (typeof plan === 'string') ? plan.trim() : "通常プラン";

    // 【超重要】Difyが「400エラー」を出さないよう、inputs変数を最小限の安全な形にする
    const difyRequestBody = {
      inputs: { 
        genre: genre || "全般",
        birthday: safeBirthday
      },
      // すべての命令、カード情報、プラン情報を一つの文章(query)にまとめてDifyのメイン入力に流し込む
      query: `【鑑定指示】
適用プラン：${safePlan}
導かれたカード：【${safeCards}】
相談者の生年月日：${safeBirthday}
お相手の生年月日（または会社設立日）：${safePartnerBirthday}

【相談内容】
${question}

上記内容について、システムプロンプトにある指示と、指定されたプラン別ルールを【死守】し、誠実に鑑定レポート（JSON形式のみ）を出力してください。`,
      response_mode: "blocking",
      user: "user-kiyoko"
    };

    const response = await fetch(`${process.env.DIFY_API_URL}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(difyRequestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Dify Error:', errorText);
      return NextResponse.json({ error: "Dify通信エラー" }, { status: response.status });
    }

    const data = await response.json();
    const difyAnswer = data.answer || "鑑定結果を取得できませんでした。";
    const baseResponse = { cardInterpretations: { past: "過去", present: "現在", future: "未来" } };

    try {
      const parsed = JSON.parse(difyAnswer);
      return NextResponse.json({ ...baseResponse, answer: parsed.answer || difyAnswer });
    } catch (e) {
      return NextResponse.json({ ...baseResponse, answer: difyAnswer });
    }

  } catch (error: any) {
    return NextResponse.json({ error: 'サーバー内でエラーが発生しました。' }, { status: 500 });
  }
}
