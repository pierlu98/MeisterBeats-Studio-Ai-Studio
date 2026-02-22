import { useState, useEffect } from 'react';
import { generateMusicalIdea } from '../services/geminiService';
import AIGenerator from './AIGenerator';
import ProjectList from './ProjectList';
import VideoPlayer from './VideoPlayer';
import TierStatus from './TierStatus';
import PurchaseButton from './PurchaseButton';
import { User, Project } from '../types';

interface DashboardProps {
  user: User | null;
}

export default function Dashboard({ user }: DashboardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedIdea, setGeneratedIdea] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [lastPrompt, setLastPrompt] = useState({ genre: '', mood: '', tempo: '' });

  const fetchProjects = async () => {
    if (!user) return;
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [user]);

  const handleGenerate = async (prompt: string) => {
    setIsLoading(true);
    setGeneratedIdea('');
    // simple parsing of prompt string
    const parts = prompt.split(', ').reduce((acc, part) => {
        const [key, value] = part.split(': ');
        acc[key.toLowerCase()] = value.replace(' BPM', '');
        return acc;
    }, {} as any);
    setLastPrompt(parts);

    const result = await generateMusicalIdea(prompt);
    setGeneratedIdea(result);
    setIsLoading(false);
  };

  const handleSaveProject = async () => {
    if (!generatedIdea || !user) return;

    const projectName = `Project - ${new Date().toLocaleString()}`;

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName,
          idea: generatedIdea,
          ...lastPrompt,
        }),
      });

      if (response.ok) {
        setGeneratedIdea(''); // Clear idea after saving
        fetchProjects(); // Refresh project list
      }
    } catch (error) {
      console.error('Failed to save project:', error);
    }
  };

  return (
    <main className="mt-8">
      {user ? (
        <>
          <div className="p-8 bg-black/20 rounded-xl border border-white/10">
            <AIGenerator onGenerate={handleGenerate} isLoading={isLoading} />
          </div>

          {(isLoading || generatedIdea) && (
            <div className="mt-6 p-8 bg-black/20 rounded-xl border border-white/10">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-md font-semibold text-gray-300">Generated Idea</h3>
                {!isLoading && generatedIdea && (
                  <button 
                    onClick={handleSaveProject}
                    className="bg-green-600 hover:bg-green-500 text-white font-semibold py-1 px-3 rounded-md text-sm transition-colors"
                  >
                    Save Project
                  </button>
                )}
              </div>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400"></div>
                </div>
              ) : (
                <pre className="whitespace-pre-wrap font-mono text-sm text-gray-300">{generatedIdea}</pre>
              )}
            </div>
          )}

          <TierStatus user={user} />
          <VideoPlayer user={user} videoId="sample-video-1" videoTitle="Tutorial: Crafting the Perfect Lofi Beat" durationSeconds={300} />
          <PurchaseButton beatId="sample-beat-01" />
          <ProjectList projects={projects} />
        </>
      ) : (
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold mb-2">Welcome to Meister Beats Studio</h2>
          <p className="text-gray-400">Please connect your GitHub account to start creating.</p>
        </div>
      )}
    </main>
  );
}
