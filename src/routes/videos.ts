/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import rateLimit from 'express-rate-limit';
import { supabase } from '../services/supabase';
import { updateUserTier } from '../services/tierService';

const router = express.Router();



const progressLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/videos/:videoId/progress
router.post('/:videoId/progress', progressLimiter, async (req, res) => {
  const { videoId } = req.params;
  const { reportedWatchTime } = req.body;
  const userId = (req as any).user.id;

  if (typeof reportedWatchTime !== 'number' || reportedWatchTime < 0) {
    return res.status(400).json({ message: 'Invalid watch time provided.' });
  }

  const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('durationSeconds')
      .eq('id', videoId)
      .single();
  if (!video) {
    return res.status(404).json({ message: 'Video not found.' });
  }

  const { data: completionRecord, error: completionError } = await supabase
      .from('video_completions')
      .select('userId')
      .eq('userId', userId)
      .eq('videoId', videoId)
      .single();
  if (completionRecord) {
    return res.status(200).json({ message: 'Video already completed.' });
  }

  const now = new Date();
  const { data: history, error: historyError } = await supabase
      .from('watch_history')
      .select('watchTimeSeconds, lastUpdated')
      .eq('userId', userId)
      .eq('videoId', videoId)
      .single();

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
  
  const { error: upsertError } = await supabase.from('watch_history').upsert({
      userId,
      videoId,
      watchTimeSeconds: currentWatchTime,
      lastUpdated: now.toISOString(),
    });

  const completionThreshold = video.durationSeconds * 0.8;
  if (currentWatchTime >= completionThreshold) {
    const { data, error } = await supabase.from('video_completions').insert([{ userId, videoId }]);

    if (data && (data as any[]).length > 0) {
      // This is a new completion, so update the tier
      updateUserTier(userId);
    }

    return res.status(200).json({ message: 'Video completed!', completed: true });
  }

  res.status(200).json({ message: 'Progress updated.', watchTime: currentWatchTime });
});

export default router;
