import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10' as any,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const planId = body.planId; // 送信側が { planId: plan } であることを前提

    const PRICE_IDS: Record<string, string> = {
      standard: "price_1TW71jBaBEaG1KW6bWlkNeB0",
      premium: "price_1TW73PBaBEaG1KW6Vpzo1IJ7",
      extreme: "price_1TW6zeBaBEaG1KW6WORVK1Bh",
    };

    const priceId = PRICE_IDS[planId];
    if (!priceId) {
      return NextResponse.json({ error: `無効なプランIDです: ${planId}` }, { status: 400 });
    }

    // 環境変数のチェック
    const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'payment',
      success_url: `${baseUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Session Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
