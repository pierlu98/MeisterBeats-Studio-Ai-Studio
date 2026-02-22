/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import rateLimit from 'express-rate-limit';
import db from '../services/db';
import { updateUserTier } from '../services/tierService';

const router = express.Router();

// Middleware to check for authenticated user
router.use((req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
});

const progressLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/videos/:videoId/progress
router.post('/:videoId/progress', progressLimiter, (req, res) => {
  const { videoId } = req.params;
  const { reportedWatchTime } = req.body;
  const userId = req.session.user!.id;

  if (typeof reportedWatchTime !== 'number' || reportedWatchTime < 0) {
    return res.status(400).json({ message: 'Invalid watch time provided.' });
  }

  const video = db.prepare('SELECT durationSeconds FROM videos WHERE id = ?').get(videoId);
  if (!video) {
    return res.status(404).json({ message: 'Video not found.' });
  }

  const completionRecord = db.prepare('SELECT 1 FROM video_completions WHERE userId = ? AND videoId = ?').get(userId, videoId);
  if (completionRecord) {
    return res.status(200).json({ message: 'Video already completed.' });
  }

  const now = new Date();
  const history = db.prepare('SELECT watchTimeSeconds, lastUpdated FROM watch_history WHERE userId = ? AND videoId = ?').get(userId, videoId);

  let currentWatchTime = 0;
  let lastUpdated = now;

  if (history) {
    const elapsedSeconds = (now.getTime() - new Date(history.lastUpdated).getTime()) / 1000;
    const maxCreditableTime = elapsedSeconds * 1.05; // Allow 5% clock drift
    const clientReportedProgress = reportedWatchTime - history.watchTimeSeconds;

    if (clientReportedProgress > maxCreditableTime) {
      // This is suspicious. The client is reporting more progress than is reasonably possible.
      // We will only credit them for the time that could have passed.
      currentWatchTime = history.watchTimeSeconds + maxCreditableTime;
    } else {
      currentWatchTime = reportedWatchTime;
    }
    lastUpdated = new Date(history.lastUpdated);
  }
  
  const upsertHistory = db.prepare(
    'INSERT INTO watch_history (userId, videoId, watchTimeSeconds, lastUpdated) VALUES (?, ?, ?, ?) ON CONFLICT(userId, videoId) DO UPDATE SET watchTimeSeconds = excluded.watchTimeSeconds, lastUpdated = excluded.lastUpdated'
  );
  upsertHistory.run(userId, videoId, currentWatchTime, now.toISOString());

  const completionThreshold = video.durationSeconds * 0.8;
  if (currentWatchTime >= completionThreshold) {
    const insertCompletion = db.prepare('INSERT OR IGNORE INTO video_completions (userId, videoId) VALUES (?, ?)');
    const result = insertCompletion.run(userId, videoId);

    if (result.changes > 0) {
      // This is a new completion, so update the tier
      updateUserTier(userId);
    }

    return res.status(200).json({ message: 'Video completed!', completed: true });
  }

  res.status(200).json({ message: 'Progress updated.', watchTime: currentWatchTime });
});

export default router;
