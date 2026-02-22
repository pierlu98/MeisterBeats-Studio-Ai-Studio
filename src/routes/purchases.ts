/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { createCheckoutSession, handleWebhook } from '../services/stripeService';

const router = express.Router();

// This route requires authentication
router.post('/create-checkout-session', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { beatId } = req.body;
  if (!beatId) {
    return res.status(400).json({ message: 'beatId is required' });
  }

  const successUrl = `${process.env.APP_URL}?payment=success`;
  const cancelUrl = `${process.env.APP_URL}?payment=cancel`;

  try {
    const session = await createCheckoutSession(req.session.user.id, beatId, successUrl, cancelUrl);
    res.json({ url: session.url });
  } catch (error) {
    console.error('Failed to create checkout session:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// This route is public for Stripe webhooks
router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const success = handleWebhook(req.body, sig);

  if (success) {
    res.json({ received: true });
  } else {
    res.status(400).send('Webhook Error');
  }
});

export default router;
