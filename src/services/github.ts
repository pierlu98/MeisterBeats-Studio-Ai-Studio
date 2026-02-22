/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import axios from 'axios';
import { User } from '../types';

const GITHUB_API_URL = 'https://api.github.com';

export async function getAccessToken(code: string): Promise<string> {
  const response = await axios.post(
    'https://github.com/login/oauth/access_token',
    {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    },
    { headers: { Accept: 'application/json' } }
  );
  return response.data.access_token;
}

export async function getGithubUser(accessToken: string): Promise<User> {
  const response = await axios.get(`${GITHUB_API_URL}/user`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const { id, login, avatar_url } = response.data;
  return {
    id: id.toString(),
    displayName: login,
    avatarUrl: avatar_url,
  };
}

