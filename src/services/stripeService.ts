/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Stripe from 'stripe';
import db from './db';
import { getBestDiscount } from './tierService';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-01-28.clover',
});

const BEAT_PRICE_CENTS = 1000; // $10.00

export async function createCheckoutSession(userId: string, beatId: string, successUrl: string, cancelUrl: string) {
  const discount = getBestDiscount(userId);
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

export function handleWebhook(payload: Buffer, sig: string): boolean {
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

    db.transaction(() => {
      const existingPurchase = db.prepare('SELECT status FROM purchases WHERE id = ?').get(session.id);
      if (existingPurchase) {
        console.log(`Duplicate webhook received for session: ${session.id}`);
        return; // Idempotency: already processed
      }

      const insertPurchase = db.prepare(
        'INSERT INTO purchases (id, userId, beatId, amount, currency, status) VALUES (?, ?, ?, ?, ?, ?)'
      );
      insertPurchase.run(session.id, userId, beatId, session.amount_total!, session.currency!, 'completed');

      if (Number(appliedDiscount) > 0 && isLifetime === 'false') {
        // Decrement the limited-use discount
        const tierStatus = db.prepare('SELECT tier FROM tier_status WHERE userId = ?').get(userId);
        const currentTier = tierStatus?.tier || 0;
        db.prepare('UPDATE discount_usage SET usesLeft = usesLeft - 1 WHERE userId = ? AND tier = ? AND usesLeft > 0').run(userId, currentTier);
      }
      
      console.log(`Purchase fulfilled for user ${userId}, beat ${beatId}`);
    })();
  }

  return true;
}
