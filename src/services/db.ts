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

  console.log('Database initialized successfully.');
}

export default db;
