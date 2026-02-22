/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TierStatusInfo } from '../types';

interface TierStatusProps {
  tierStatus: TierStatusInfo;
}

export default function TierStatus({ tierStatus }: TierStatusProps) {
  const { tier, completedVideos, discount } = tierStatus;

  return (
    <div className="mt-6 p-8 bg-black/20 rounded-xl border border-white/10">
      <h3 className="text-md font-semibold text-gray-300 mb-2">Your Rewards Status</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-indigo-400">Tier {tier}</p>
          <p className="text-xs text-gray-500">Current Tier</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-indigo-400">{completedVideos}</p>
          <p className="text-xs text-gray-500">Videos Completed</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-indigo-400">{discount.percentage}%</p>
          <p className="text-xs text-gray-500">{discount.isLifetime ? 'Lifetime Discount' : 'Next Purchase'}</p>
        </div>
      </div>
    </div>
  );
}
