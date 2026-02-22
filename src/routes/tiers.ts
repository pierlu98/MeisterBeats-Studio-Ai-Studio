/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { supabase } from '../services/supabase';
import { getBestDiscount } from '../services/tierService';

const router = express.Router();

// Middleware to check for authenticated user
router.use((req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
});

// GET /api/tiers/status
router.get('/status', async (req, res) => {
  const userId = (req as any).user.id;
  const { data: tierStatus, error } = await supabase
    .from('tier_status')
    .select('tier, completedVideos')
    .eq('userId', userId)
    .single();
  const bestDiscount = getBestDiscount(userId);

  res.json({
    tier: tierStatus?.tier || 0,
    completedVideos: tierStatus?.completedVideos || 0,
    discount: bestDiscount,
  });
});

export default router;
