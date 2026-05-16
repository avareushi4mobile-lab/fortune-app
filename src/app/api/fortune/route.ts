export const maxDuration = 300; 
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { question, plan, genre, birthday, partnerBirthday, cards } = body || {};

    const safeBirthday = (typeof birthday === 'string') ? birthday.trim() : "未入力";
    const safePartnerBirthday = (typeof partnerBirthday === 'string') ? partnerBirthday.trim() : "未入力";
    const safeCardsStr = (typeof cards === 'string') ? cards.trim() : "0";
    const safePlan = (typeof plan === 'string') ? plan.trim() : "通常プラン";

    // 🚨 Difyプラグインのクラッシュ（args:{}）を消滅させるため、文字列配列と数値配列の両方を用意
    const cardArrayStr = safeCardsStr.split(",").map(v => v.trim());
    const cardArrayNum = cardArrayStr.map(v => parseInt(v, 10)).filter(v => !isNaN(v));

    // Dify側のツールやプラグインが求める可能性のあるすべての変数バリエーションを網羅して送信
    const difyRequestBody = {
      inputs: { 
        genre: genre || "全般",
        birthday: safeBirthday,
        cards: safeCardsStr,           // カンマ区切り文字列（"1,2,3"）
        Cards: safeCardsStr,           // 頭文字大文字パターン
        cards_array: cardArrayStr,     // 文字列配列（["1","2","3"]）
        selected_cards: cardArrayNum,  // 数値配列（[1,2,3]）
        partner_birthday: safePartnerBirthday
      },
      query: `【鑑定指示】
適用プラン：${safePlan}
ジャンル：${genre || "全般"}
タロットカード番号：【${safeCardsStr}】
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Dify Plugin Error:', errorText);
      return NextResponse.json(
        { error: `Dify側から拒否されました(Status: ${response.status})。\n詳細ログ: ${errorText.slice(0, 150)}` }, 
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // アプリタイプ別のデータ自動抽出
    let difyAnswer = "";
    if (data.answer) {
      difyAnswer = data.answer;
    } else if (data.data && data.data.outputs && data.data.outputs.text) {
      difyAnswer = data.data.outputs.text;
    } else if (data.data && data.data.outputs) {
      difyAnswer = typeof data.data.outputs === 'string' ? data.data.outputs : JSON.stringify(data.data.outputs);
    } else {
      difyAnswer = JSON.stringify(data);
    }

    const baseResponse = { cardInterpretations: { past: "過去", present: "現在", future: "未来" } };

    try {
      const parsed = JSON.parse(difyAnswer);
      return NextResponse.json({ ...baseResponse, answer: parsed.answer || difyAnswer });
    } catch (e) {
      return NextResponse.json({ ...baseResponse, answer: difyAnswer });
    }

  } catch (error: any) {
    console.error('Fatal Server Error:', error);
    return NextResponse.json({ error: `サーバー内でエラーが発生しました。詳細: ${error.message}` }, { status: 500 });
  }
}
