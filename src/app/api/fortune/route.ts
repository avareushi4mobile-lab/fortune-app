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

    // どのDifyアプリタイプ（チャット/ワークフロー）でも門前払いされない共通データ構造
    const difyRequestBody = {
      inputs: { 
        genre: genre || "全般",
        birthday: safeBirthday,
        cards: safeCards 
      },
      query: `【鑑定指示】
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

    // Difyが400エラー等で拒否した場合、エラー内容を画面にフリーズさせず、原因を文字でフロントへ突き返す
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Dify Rejected Error:', errorText);
      return NextResponse.json(
        { answer: `【システム通信エラー】Dify側が通信を拒否しました(Status: ${response.status})。\n\nお手数ですが、Vercelの環境変数「DIFY_API_URL」のURL末尾が正しくアプリのタイプと一致しているか（チャット型なら /chat-messages、ワークフロー型なら /workflow/run）を今一度ご確認ください。\n\n詳細ログ: ${errorText.slice(0, 100)}` },
        { status: 200 } // ➔ 400で返すと画面が壊れるため、あえて200で文字として流し込む防衛策
      );
    }

    const data = await response.json();
    
    // 【万能パースロジック】Difyのアプリタイプ（Chatflow / Workflow）の返却形式の違いを完全自動吸収
    let difyAnswer = "";
    if (data.answer) {
      difyAnswer = data.answer; // チャット型の場合
    } else if (data.data && data.data.outputs && data.data.outputs.text) {
      difyAnswer = data.data.outputs.text; // ワークフロー型でtext出力の場合
    } else if (data.data && data.data.outputs) {
      difyAnswer = typeof data.data.outputs === 'string' ? data.data.outputs : JSON.stringify(data.data.outputs);
    } else {
      difyAnswer = JSON.stringify(data); // 最終バックアップ
    }

    const baseResponse = { cardInterpretations: { past: "過去", present: "現在", future: "未来" } };

    try {
      // AIが指示通りJSONの文字列で返してきた場合、中身を綺麗にパース
      const parsed = JSON.parse(difyAnswer);
      return NextResponse.json({ ...baseResponse, answer: parsed.answer || difyAnswer });
    } catch (e) {
      // 通常テキストや壊れたJSONの場合も、画面を壊さずそのまま文字を表示させる
      return NextResponse.json({ ...baseResponse, answer: difyAnswer });
    }

  } catch (error: any) {
    console.error('Server Fatal Error:', error);
    return NextResponse.json(
      { answer: `サーバー内部で深刻なエラーが発生しました。\n詳細: ${error.message}` },
      { status: 200 }
    );
  }
}
