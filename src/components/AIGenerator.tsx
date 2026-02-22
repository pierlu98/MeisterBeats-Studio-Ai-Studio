/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';

interface AIGeneratorProps {
  onGenerate: (prompt: string) => void;
  isLoading: boolean;
}

export default function AIGenerator({ onGenerate, isLoading }: AIGeneratorProps) {
  const [genre, setGenre] = useState('Lo-fi Hip Hop');
  const [mood, setMood] = useState('Chill');
  const [tempo, setTempo] = useState('90');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const prompt = `Genre: ${genre}, Mood: ${mood}, Tempo: ${tempo} BPM`;
    onGenerate(prompt);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="genre" className="block text-sm font-medium text-gray-400 mb-1">Genre</label>
          <input
            id="genre"
            type="text"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="w-full bg-black/30 border border-white/20 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="mood" className="block text-sm font-medium text-gray-400 mb-1">Mood</label>
          <input
            id="mood"
            type="text"
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            className="w-full bg-black/30 border border-white/20 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="tempo" className="block text-sm font-medium text-gray-400 mb-1">Tempo (BPM)</label>
          <input
            id="tempo"
            type="number"
            value={tempo}
            onChange={(e) => setTempo(e.target.value)}
            className="w-full bg-black/30 border border-white/20 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded-md transition-colors disabled:bg-gray-700 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Generating...' : 'Generate Beat Idea'}
      </button>
    </form>
  );
}
