/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Database from 'better-sqlite3';

const db = new Database('meisterbeats.db');

export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      displayName TEXT NOT NULL,
      avatarUrl TEXT
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      name TEXT NOT NULL,
      genre TEXT,
      mood TEXT,
      tempo INTEGER,
      idea TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users (id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS videos (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      durationSeconds INTEGER NOT NULL
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS watch_history (
      userId TEXT NOT NULL,
      videoId TEXT NOT NULL,
      watchTimeSeconds INTEGER NOT NULL DEFAULT 0,
      lastUpdated DATETIME NOT NULL,
      PRIMARY KEY (userId, videoId),
      FOREIGN KEY (userId) REFERENCES users (id),
      FOREIGN KEY (videoId) REFERENCES videos (id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS video_completions (
      userId TEXT NOT NULL,
      videoId TEXT NOT NULL,
      completedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (userId, videoId),
      FOREIGN KEY (userId) REFERENCES users (id),
      FOREIGN KEY (videoId) REFERENCES videos (id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS tier_status (
      userId TEXT PRIMARY KEY,
      tier INTEGER NOT NULL DEFAULT 0,
      completedVideos INTEGER NOT NULL DEFAULT 0,
      lastCalculated DATETIME NOT NULL,
      FOREIGN KEY (userId) REFERENCES users (id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS discount_usage (
      userId TEXT NOT NULL,
      tier INTEGER NOT NULL,
      usesLeft INTEGER NOT NULL,
      PRIMARY KEY (userId, tier),
      FOREIGN KEY (userId) REFERENCES users (id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS purchases (
      id TEXT PRIMARY KEY, -- Stripe Checkout Session ID
      userId TEXT NOT NULL,
      beatId TEXT NOT NULL,
      amount INTEGER NOT NULL,
      currency TEXT NOT NULL,
      status TEXT NOT NULL, -- e.g., 'completed', 'pending'
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users (id)
    );
  `);

  // Seed a sample video for testing
  const checkVideo = db.prepare('SELECT id FROM videos WHERE id = ?').get('sample-video-1');
  if (!checkVideo) {
    db.prepare('INSERT INTO videos (id, title, durationSeconds) VALUES (?, ?, ?)')
      .run('sample-video-1', 'Tutorial: Crafting the Perfect Lofi Beat', 300);
  }

  console.log('Database initialized successfully.');
}

export default db;
