/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from './supabase';

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

export async function updateUserTier(userId: string) {
  const { count, error: countError } = await supabase
    .from('video_completions')
    .select('*', { count: 'exact', head: true })
    .eq('userId', userId);
  const newTier = calculateTier(count);

  const { data: currentTierStatus, error: tierError } = await supabase
    .from('tier_status')
    .select('tier')
    .eq('userId', userId)
    .single();
  const currentTier = currentTierStatus?.tier || 0;

  if (newTier > currentTier) {
    // Tier up!
    const { error: upsertTierError } = await supabase.from('tier_status').upsert({
      userId,
      tier: newTier,
      completedVideos: count,
      lastCalculated: new Date().toISOString(),
    });

    const rewards = TIER_REWARDS[newTier];
    if (rewards.limitedDiscount) {
      await supabase.from('discount_usage').upsert({
        userId,
        tier: newTier,
        usesLeft: rewards.limitedDiscount.uses,
      });
    }
    if (rewards.nextLimitedDiscount) {
      await supabase.from('discount_usage').upsert({
        userId,
        tier: 3.1,
        usesLeft: rewards.nextLimitedDiscount.uses,
      });
    }
  } else {
    // Just update the video count
    await supabase.from('tier_status').upsert({
      userId,
      completedVideos: count,
      lastCalculated: new Date().toISOString(),
    });
  }
}

export async function getBestDiscount(userId: string): Promise<{ percentage: number, isLifetime: boolean }> {
  const { data: tierStatus, error: tierError } = await supabase
    .from('tier_status')
    .select('tier')
    .eq('userId', userId)
    .single();
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
  const { data: discounts, error: discountError } = await supabase
    .from('discount_usage')
    .select('tier, usesLeft')
    .eq('userId', userId)
    .gt('usesLeft', 0);
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
