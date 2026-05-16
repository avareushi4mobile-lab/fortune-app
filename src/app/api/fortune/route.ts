// 1. Vercelの実行時間を最大（5分）まで延ばす設定
export const maxDuration = 300; 
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 【修正】フロント（page.tsx）の最新の送信データ名と100%一致させる
    const { 
      question,        // 相談内容
      plan,            // プラン名テキスト
      genre,           // 占いのジャンル
      birthday,        // 自分の生年月日
      partnerBirthday, // 相手の生年月日（極プラン用）
      cards           // タロットカード番号（カンマ区切り）
    } = body || {};

    // データの安全な初期化処理
    const safeBirthday = (typeof birthday === 'string') ? birthday.trim() : "未入力";
    const safePartnerBirthday = (typeof partnerBirthday === 'string') ? partnerBirthday.trim() : "未入力";
    const safeCards = (typeof cards === 'string') ? cards.trim() : "未設定";
    const safePlan = (typeof plan === 'string') ? plan.trim() : "通常プラン";

    // 【修正】Difyの「Orchestrate（プロンプト）」へ、AIが処理しやすい綺麗な構造でデータを流し込む
    const difyRequestBody = {
      inputs: { 
        genre: genre || "全般",
        birthday: safeBirthday,
        partner_birthday: safePartnerBirthday,
        plan_rules: safePlan, // AIに死守させるプラン別ルールテキスト
        cards: safeCards      // AIが読み解くためのカード番号リスト
      },
      // query部分には、AIへのメインの命令文をロジック通りに組み立てて配置
      query: `相談内容：${question}\n\n上記内容について、指定されたプラン別ルールと、送られたタロットカード番号【${safeCards}】の象徴を元に、誠実に鑑定レポート（JSON形式）を出力してください。`,
      response_mode: "blocking",
      user: "user-kiyoko"
    };

    // Dify APIへのFetch実行
    const response = await fetch(`${process.env.DIFY_API_URL}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(difyRequestBody),
    });

    // Dify側でのエラー（400や500等）を検知してログに残す
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Dify API Error Details:', errorText);
      return NextResponse.json(
        { error: `Dify側でエラーが起きました(Dify-Status: ${response.status})。プロンプトの記述内容、またはAPIキーの設定を確認してください。` }, 
        { status: response.status }
      );
    }

    const data = await response.json();
    const difyAnswer = data.answer || "鑑定結果を取得できませんでした。";

    // フロントエンド（page.tsx）が受け取れる共通の箱を作成
    const baseResponse = {
      cardInterpretations: { past: "過去", present: "現在", future: "未来" }
    };

    try {
      // Difyの返答（difyAnswer）が正しいJSON文字列だった場合、パースして中のanswerだけを抽出
      const parsed = JSON.parse(difyAnswer);
      return NextResponse.json({ ...baseResponse, answer: parsed.answer || difyAnswer });
    } catch (e) {
      // 万が一Difyが通常のテキストで返してきた場合も、ハングアップさせずにそのまま文字を表示させる防衛処理
      return NextResponse.json({ ...baseResponse, answer: difyAnswer });
    }

  } catch (error: any) {
    console.error('Server Error details:', error);
    return NextResponse.json(
      { error: 'バックエンドサーバーで予期せぬエラーが発生しました。' }, 
      { status: 500 }
    );
  }
}
