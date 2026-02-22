/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Stripe from 'stripe';
import { supabase } from './supabase';
import { getBestDiscount } from './tierService';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-01-28.clover',
});

const BEAT_PRICE_CENTS = 1000; // $10.00

export async function createCheckoutSession(userId: string, beatId: string, successUrl: string, cancelUrl: string) {
  const discount = await getBestDiscount(userId);
  let couponId: string | undefined = undefined;

  if (discount.percentage > 0) {
    const coupon = await stripe.coupons.create({
      percent_off: discount.percentage,
      duration: 'once',
      name: `${discount.percentage}% off - ${userId}`,
    });
    couponId = coupon.id;
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Beat: ${beatId}`,
          },
          unit_amount: BEAT_PRICE_CENTS,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    discounts: couponId ? [{ coupon: couponId }] : [],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
      beatId,
      appliedDiscount: discount.percentage,
      isLifetime: discount.isLifetime.toString(),
    },
  });

  return session;
}

export async function handleWebhook(payload: Buffer, sig: string): Promise<boolean> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
  } catch (err) {
    console.error(`Webhook Error: ${(err as Error).message}`);
    return false;
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const { userId, beatId, appliedDiscount, isLifetime } = session.metadata!;

    const { data: existingPurchase, error: fetchError } = await supabase
      .from('purchases')
      .select('status')
      .eq('id', session.id)
      .single();

    if (existingPurchase) {
      console.log(`Duplicate webhook received for session: ${session.id}`);
      return; // Idempotency: already processed
    }

    await supabase.from('purchases').insert({
      id: session.id,
      userId,
      beatId,
      amount: session.amount_total!,
      currency: session.currency!,
      status: 'completed',
    });

    if (Number(appliedDiscount) > 0 && isLifetime === 'false') {
      const { data: tierStatus } = await supabase
        .from('tier_status')
        .select('tier')
        .eq('userId', userId)
        .single();
      
      const currentTier = tierStatus?.tier || 0;

      const { data: discount } = await supabase
        .from('discount_usage')
        .select('usesLeft')
        .eq('userId', userId)
        .eq('tier', currentTier)
        .single();

      if (discount && discount.usesLeft > 0) {
        await supabase
          .from('discount_usage')
          .update({ usesLeft: discount.usesLeft - 1 })
          .eq('userId', userId)
          .eq('tier', currentTier);
      }
    }
    
    console.log(`Purchase fulfilled for user ${userId}, beat ${beatId}`);
  }

  return true;
}
