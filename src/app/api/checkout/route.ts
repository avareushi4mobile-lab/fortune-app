import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10' as any,
});

export async function POST(request: Request) {
  try {
    const { planId } = await request.json();

    // 全ての「l」を「1」に修正した正しいID対応表
    const PRICE_IDS: { [key: string]: string } = {
      standard: "price_1TW71jBaBEaG1KW6bWlkNeB0", // 通常プラン
      premium: "price_1TW73PBaBEaG1KW6Vpzo1IJ7",  // 豪華プラン
      extreme: "price_1TW6zeBaBEaG1KW6WORVK1Bh",  // 極プラン
    };

    // 選択されたプランの価格IDを取得
    const priceId = PRICE_IDS[planId as keyof typeof PRICE_IDS];

    if (!priceId) {
      throw new Error(`Invalid planId: ${planId}`);
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      // 決済成功後の戻り先（環境変数の設定が必要です）
      success_url: `${process.env.NEXT_PUBLIC_URL}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
