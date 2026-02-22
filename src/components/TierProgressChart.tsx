/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TierStatusInfo } from '../types';

interface TierProgressChartProps {
  tierStatus: TierStatusInfo;
}

const TIER_COLORS = ['#9333ea', '#f59e0b', '#10b981', '#3b82f6'];

export default function TierProgressChart({ tierStatus }: TierProgressChartProps) {
  const { completedVideos, videosForNextTier, tier } = tierStatus;

  const data = [
    {
      name: 'Progress',
      completed: completedVideos,
      remaining: videosForNextTier > 0 ? videosForNextTier - completedVideos : 0,
    },
  ];

  const isMaxTier = videosForNextTier === 0;

  return (
    <div className="mt-6 p-8 bg-black/20 rounded-xl border border-white/10 h-64">
      <h3 className="text-md font-semibold text-gray-300 mb-4">Next Tier Progress</h3>
      {isMaxTier ? (
        <div className="flex items-center justify-center h-full text-gray-400">
            <p>You have reached the maximum tier!</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" hide />
            <Tooltip 
                cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                contentStyle={{ 
                    background: '#1f2937',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '0.5rem'
                }}
                labelStyle={{ color: '#d1d5db' }}
            />
            <Bar dataKey="completed" stackId="a" fill={TIER_COLORS[tier] || '#8884d8'} radius={[4, 0, 0, 4]}>
                <Cell />
            </Bar>
            <Bar dataKey="remaining" stackId="a" fill="#4b5563" radius={[0, 4, 4, 0]}>
                <Cell />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
