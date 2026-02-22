/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import db from './db';

const TIER_THRESHOLDS = {
  1: 10,
  2: 25,
  3: 100,
  4: 500,
};

const TIER_REWARDS = {
  1: { limitedDiscount: { percentage: 75, uses: 10 } },
  2: { limitedDiscount: { percentage: 90, uses: 10 }, lifetimeDiscount: 75 },
  3: { limitedDiscount: { percentage: 95, uses: 10 }, nextLimitedDiscount: { percentage: 90, uses: 25 } },
  4: { lifetimeDiscount: 95 },
};

export function calculateTier(completedVideos: number): number {
  if (completedVideos >= TIER_THRESHOLDS[4]) return 4;
  if (completedVideos >= TIER_THRESHOLDS[3]) return 3;
  if (completedVideos >= TIER_THRESHOLDS[2]) return 2;
  if (completedVideos >= TIER_THRESHOLDS[1]) return 1;
  return 0;
}

export function updateUserTier(userId: string) {
  const { count } = db.prepare('SELECT COUNT(*) as count FROM video_completions WHERE userId = ?').get(userId);
  const newTier = calculateTier(count);

  const currentTierStatus = db.prepare('SELECT tier FROM tier_status WHERE userId = ?').get(userId);
  const currentTier = currentTierStatus?.tier || 0;

  if (newTier > currentTier) {
    // Tier up!
    db.transaction(() => {
      const upsertTier = db.prepare(
        'INSERT INTO tier_status (userId, tier, completedVideos, lastCalculated) VALUES (?, ?, ?, ?) ON CONFLICT(userId) DO UPDATE SET tier = excluded.tier, completedVideos = excluded.completedVideos, lastCalculated = excluded.lastCalculated'
      );
      upsertTier.run(userId, newTier, count, new Date().toISOString());

      // Reset/grant limited discounts for the new tier
      const rewards = TIER_REWARDS[newTier];
      if (rewards.limitedDiscount) {
        const upsertDiscount = db.prepare(
          'INSERT INTO discount_usage (userId, tier, usesLeft) VALUES (?, ?, ?) ON CONFLICT(userId, tier) DO UPDATE SET usesLeft = excluded.usesLeft'
        );
        upsertDiscount.run(userId, newTier, rewards.limitedDiscount.uses);
      }
      if (rewards.nextLimitedDiscount) {
        // This is a special case for Tier 3
        const upsertDiscount = db.prepare(
          'INSERT INTO discount_usage (userId, tier, usesLeft) VALUES (?, ?, ?) ON CONFLICT(userId, tier) DO UPDATE SET usesLeft = excluded.usesLeft'
        );
        upsertDiscount.run(userId, 3.1, rewards.nextLimitedDiscount.uses); // Using a float to distinguish
      }
    })();
  } else {
    // Just update the video count
    const upsertTier = db.prepare(
      'INSERT INTO tier_status (userId, completedVideos, lastCalculated) VALUES (?, ?, ?) ON CONFLICT(userId) DO UPDATE SET completedVideos = excluded.completedVideos, lastCalculated = excluded.lastCalculated'
    );
    upsertTier.run(userId, count, new Date().toISOString());
  }
}

export function getBestDiscount(userId: string): { percentage: number, isLifetime: boolean } {
  const tierStatus = db.prepare('SELECT tier FROM tier_status WHERE userId = ?').get(userId);
  const currentTier = tierStatus?.tier || 0;

  let bestDiscount = { percentage: 0, isLifetime: false };

  // Check for lifetime discounts first, as they override
  if (currentTier >= 4 && TIER_REWARDS[4].lifetimeDiscount > bestDiscount.percentage) {
    bestDiscount = { percentage: TIER_REWARDS[4].lifetimeDiscount, isLifetime: true };
  }
  if (currentTier >= 2 && TIER_REWARDS[2].lifetimeDiscount > bestDiscount.percentage) {
    bestDiscount = { percentage: TIER_REWARDS[2].lifetimeDiscount, isLifetime: true };
  }

  // Check for limited-time offers
  const discounts = db.prepare('SELECT tier, usesLeft FROM discount_usage WHERE userId = ? AND usesLeft > 0').all(userId);
  for (const discount of discounts) {
    const reward = TIER_REWARDS[Math.floor(discount.tier)];
    let discountConfig;
    if (discount.tier === 3.1) {
        discountConfig = reward.nextLimitedDiscount;
    } else {
        discountConfig = reward.limitedDiscount;
    }

    if (discountConfig && discountConfig.percentage > bestDiscount.percentage) {
      bestDiscount = { percentage: discountConfig.percentage, isLifetime: false };
    }
  }

  return bestDiscount;
}
