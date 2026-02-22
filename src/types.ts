/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Project {
  id: number;
  userId: string;
  name: string;
  genre?: string;
  mood?: string;
  tempo?: number;
  idea?: string;
  createdAt: string;
}

export interface User {
  id: string;
  displayName: string;
  avatarUrl?: string;
}
