/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import db from '../services/db';
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
router.get('/status', (req, res) => {
  const userId = req.session.user!.id;
  const tierStatus = db.prepare('SELECT tier, completedVideos FROM tier_status WHERE userId = ?').get(userId);
  const bestDiscount = getBestDiscount(userId);

  res.json({
    tier: tierStatus?.tier || 0,
    completedVideos: tierStatus?.completedVideos || 0,
    discount: bestDiscount,
  });
});

export default router;
