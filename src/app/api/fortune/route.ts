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

    // 【Dify完全連動仕様】Difyのプロンプトが求める「cards」変数をinputsに正しく配置する
    const difyRequestBody = {
      inputs: { 
        genre: genre || "全般",
        birthday: safeBirthday,
        cards: safeCards // Difyが指示文の中で探している「cards」変数をここに確実に格納
      },
      
      // Difyの「ナレッジ」やメイン処理を正常に通過させるため、 query に綺麗に要約して流し込む
      query: `【鑑定依頼】
適用プラン：${safePlan}
ジャンル：${genre || "全般"}
タロットカード番号：【${safeCards}】
相談者の生年月日：${safeBirthday}
相手の生年月日（または会社設立日）：${safePartnerBirthday}

相談内容：
${question}`,
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

    // 400や500エラーが出た場合に、原因のログをVercelのコンソールにハッキリ残す設定
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Dify API Error Rejected:', errorText);
      return NextResponse.json(
        { error: `Dify側から拒否されました(Status: ${response.status})。入力データの噛み合わせを確認してください。` }, 
        { status: response.status }
      );
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
