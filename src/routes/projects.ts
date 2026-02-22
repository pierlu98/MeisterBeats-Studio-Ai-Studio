/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import db from '../services/db';

const router = express.Router();

// Middleware to check for authenticated user
router.use((req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
});

// GET /api/projects - List user's projects
router.get('/', (req, res) => {
  const getProjects = db.prepare('SELECT * FROM projects WHERE userId = ? ORDER BY createdAt DESC');
  const projects = getProjects.all(req.session.user!.id);
  res.json(projects);
});

// POST /api/projects - Create a new project
router.post('/', (req, res) => {
  const { name, genre, mood, tempo, idea } = req.body;
  const userId = req.session.user!.id;

  if (!name) {
    return res.status(400).json({ message: 'Project name is required.' });
  }

  const createProject = db.prepare(
    'INSERT INTO projects (userId, name, genre, mood, tempo, idea) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const result = createProject.run(userId, name, genre, mood, tempo, idea);

  res.status(201).json({ id: result.lastInsertRowid });
});

export default router;
