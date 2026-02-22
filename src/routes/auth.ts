/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { getAccessToken, getGithubUser } from '../services/github';
import db from '../services/db';

const router = express.Router();

router.get('/url', (req, res) => {
  const redirectUri = `${process.env.APP_URL}/api/auth/callback`;
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID!,
    redirect_uri: redirectUri,
    scope: 'read:user',
  });
  const url = `https://github.com/login/oauth/authorize?${params}`;
  res.json({ url });
});

router.get('/callback', async (req, res) => {
  const { code } = req.query;
  if (typeof code !== 'string') {
    return res.status(400).send('Invalid authorization code.');
  }

  try {
    const accessToken = await getAccessToken(code);
    const user = await getGithubUser(accessToken);

    // Save or update user in the database
    const upsertUser = db.prepare(
      'INSERT INTO users (id, displayName, avatarUrl) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET displayName = excluded.displayName, avatarUrl = excluded.avatarUrl'
    );
    upsertUser.run(user.id, user.displayName, user.avatarUrl);

    req.session.user = user;

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_SUCCESS' }, '*');
            }
            window.close();
          </script>
          <p>Authentication successful. You can close this window.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('GitHub OAuth callback error:', error);
    res.status(500).send('Authentication failed.');
  }
});

router.get('/user', (req, res) => {
  res.json(req.session.user ?? null);
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Could not log out.');
    }
    res.clearCookie('connect.sid'); // The default session cookie name
    res.status(200).send();
  });
});

export default router;
