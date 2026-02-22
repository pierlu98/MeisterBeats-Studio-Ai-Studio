/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { User } from '../types';

interface TierStatusProps {
  user: User;
}

interface TierData {
  tier: number;
  completedVideos: number;
  discount: {
    percentage: number;
    isLifetime: boolean;
  };
}

export default function TierStatus({ user }: TierStatusProps) {
  const [status, setStatus] = useState<TierData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTierStatus = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/tiers/status');
        if (response.ok) {
          const data = await response.json();
          setStatus(data);
        }
      } catch (error) {
        console.error('Failed to fetch tier status:', error);
      }
      setLoading(false);
    };

    if (user) {
      fetchTierStatus();
    }
  }, [user]);

  if (loading) {
    return (
        <div className="mt-6 p-8 bg-black/20 rounded-xl border border-white/10">
            <div className="h-8 bg-gray-700 rounded w-1/3 animate-pulse"></div>
        </div>
    );
  }

  if (!status) {
    return null; // Don't show anything if status isn't available
  }

  return (
    <div className="mt-6 p-8 bg-black/20 rounded-xl border border-white/10">
      <h3 className="text-md font-semibold text-gray-300 mb-2">Your Rewards Status</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-indigo-400">Tier {status.tier}</p>
          <p className="text-xs text-gray-500">Current Tier</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-indigo-400">{status.completedVideos}</p>
          <p className="text-xs text-gray-500">Videos Completed</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-indigo-400">{status.discount.percentage}%</p>
          <p className="text-xs text-gray-500">{status.discount.isLifetime ? 'Lifetime Discount' : 'Next Purchase'}</p>
        </div>
      </div>
    </div>
  );
}
