import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10' as any,
});

export async function POST(request: Request) {
  try {
    const { planId } = await request.json();

    // 清子さんの本番用ID（price_...）の対応表
    const PRICE_IDS: { [key: string]: string } = {
      standard: "price_1TW71jBaBEaGlKW6bWlkNeB0", // 通常
      premium: "price_1TW73PBaBEaGlKW6VpzolIJ7",  // 豪華
      extreme: "price_1TW6zeBaBEaGlKW6WORVKlBh",  // 極
    };

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: PRICE_IDS[planId],
          quantity: 1,
        },
      ],
      mode: 'payment',
      // 決済成功後の戻り先
      success_url: `${process.env.NEXT_PUBLIC_URL}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
