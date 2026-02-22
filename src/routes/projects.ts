/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { supabase } from '../services/supabase';

const router = express.Router();

// Middleware to check for authenticated user
router.use((req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
});

// GET /api/projects - List user's projects
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('userId', req.session.user!.id)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    res.status(500).json({ message: 'Failed to fetch projects' });
  }
});

// POST /api/projects - Create a new project
router.post('/', async (req, res) => {
  const { name, genre, mood, tempo, idea } = req.body;
  const userId = (req as any).user.id;

  if (!name) {
    return res.status(400).json({ message: 'Project name is required.' });
  }

  try {
    const { data, error } = await supabase
      .from('projects')
      .insert([{ userId, name, genre, mood, tempo, idea }])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Failed to create project:', error);
    res.status(500).json({ message: 'Failed to create project' });
  }
});

export default router;
