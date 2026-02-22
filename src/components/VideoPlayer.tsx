/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { User } from '../types';

interface VideoPlayerProps {
  user: User;
  videoId: string;
  videoTitle: string;
  durationSeconds: number;
}

export default function VideoPlayer({ user, videoId, videoTitle, durationSeconds }: VideoPlayerProps) {
  const [watchTime, setWatchTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [status, setStatus] = useState('Ready to play.');
  const [isCompleted, setIsCompleted] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const sendProgress = async (time: number) => {
    try {
      const response = await fetch(`/api/videos/${videoId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportedWatchTime: time }),
      });
      const data = await response.json();
      setStatus(`Server: ${data.message}`);
      if (data.completed) {
        setIsCompleted(true);
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('Failed to send progress:', error);
      setStatus('Error: Could not update progress.');
    }
  };

  useEffect(() => {
    if (isPlaying && !isCompleted) {
      intervalRef.current = window.setInterval(() => {
        setWatchTime((prev) => {
          const newTime = prev + 1;
          if (newTime >= durationSeconds) {
            setIsPlaying(false);
            sendProgress(durationSeconds);
            return durationSeconds;
          }
          if (newTime % 5 === 0) { // Send update every 5 seconds
            sendProgress(newTime);
          }
          return newTime;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, isCompleted, durationSeconds]);

  const progressPercent = (watchTime / durationSeconds) * 100;

  return (
    <div className="mt-6 p-8 bg-black/20 rounded-xl border border-white/10">
      <h3 className="text-md font-semibold text-gray-300 mb-4">Video Tutorial</h3>
      <p className="text-sm text-gray-400 mb-2">{videoTitle}</p>
      <div className="w-full bg-black/40 rounded-full h-2.5 mb-4">
        <div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: `${progressPercent}%` }}></div>
      </div>
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          disabled={isCompleted}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded-md text-sm transition-colors disabled:bg-gray-700 disabled:cursor-not-allowed"
        >
          {isCompleted ? 'Completed' : isPlaying ? 'Pause' : 'Play'}
        </button>
        <div className="text-sm font-mono text-gray-400">
          {Math.floor(watchTime / 60)}:{(watchTime % 60).toString().padStart(2, '0')} / {Math.floor(durationSeconds / 60)}:{(durationSeconds % 60).toString().padStart(2, '0')}
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-4 text-right">{status}</p>
    </div>
  );
}
