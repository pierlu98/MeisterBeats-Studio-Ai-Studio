/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Project } from '../types';

interface ProjectListProps {
  projects: Project[];
}

export default function ProjectList({ projects }: ProjectListProps) {
  return (
    <div className="mt-6">
      <h3 className="text-md font-semibold text-gray-300 mb-4">Your Projects</h3>
      {projects.length === 0 ? (
        <p className="text-sm text-gray-500">You haven't saved any projects yet.</p>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => (
            <div key={project.id} className="p-4 bg-black/20 rounded-lg border border-white/10">
              <h4 className="font-semibold text-gray-200">{project.name}</h4>
              <p className="text-sm text-gray-400 mt-1">
                {project.genre} - {project.mood} - {project.tempo} BPM
              </p>
              <p className="text-sm font-mono mt-2 text-gray-300 whitespace-pre-wrap">{project.idea}</p>
              <p className="text-xs text-gray-500 mt-3">{new Date(project.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
