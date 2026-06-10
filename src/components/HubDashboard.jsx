import React, { useState } from 'react';
import projectsData from '../projects.json';
import { Search, Github, Play, ArrowRight, ExternalLink } from 'lucide-react';

export default function HubDashboard({ onSelectProject }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTech, setSelectedTech] = useState('All');

  // Gather all unique technologies
  const allTechs = ['All', ...new Set(projectsData.flatMap(p => p.techStack))];

  const filteredProjects = projectsData.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTech = selectedTech === 'All' || project.techStack.includes(selectedTech);
    return matchesSearch && matchesTech;
  });

  return (
    <div>
      {/* Hero Section */}
      <div className="text-center py-10 md:py-16">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
          Project <span className="text-indigo-400 glow-text-violet">Demo Portal</span>
        </h1>
        <p className="max-w-2xl mx-auto text-lg text-slate-400 mb-8 font-light">
          Explore interactive browser-run simulations and client-side demos of my backend architectures, full-stack applications, and AI integrations.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass p-5 mb-10 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96 flex items-center">
          <Search className="absolute left-3 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
          <span className="text-slate-400 text-sm mr-2 font-medium">Filter Tech:</span>
          <select 
            value={selectedTech} 
            onChange={(e) => setSelectedTech(e.target.value)}
            className="py-2 px-4 cursor-pointer"
          >
            {allTechs.map(tech => (
              <option key={tech} value={tech}>{tech}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <div key={project.id} className="glass-card p-6 flex flex-col justify-between h-full">
            <div>
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  project.status === 'Production-Ready' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  project.status === 'Active' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                  project.status === 'Staging' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                  'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  <span className={`status-dot ${
                    project.status === 'Production-Ready' ? 'active' :
                    project.status === 'Active' ? 'active animate-pulse-glow-emerald' :
                    project.status === 'Staging' ? 'staging' :
                    'testing'
                  }`}></span>
                  {project.status}
                </span>

                <a
                  href={`https://github.com/meena-ramachandran/${project.githubRepo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-white transition-colors"
                  title="View GitHub Repository"
                >
                  <Github className="w-5 h-5" />
                </a>
              </div>

              {/* Title & Description */}
              <h3 className="text-2xl font-bold text-white mb-2 tracking-tight group-hover:text-indigo-400 transition-colors">
                {project.name}
              </h3>
              <p className="text-slate-400 text-sm font-light mb-6 leading-relaxed">
                {project.description}
              </p>

              {/* Details Expand */}
              <p className="text-slate-500 text-xs italic mb-6 leading-relaxed bg-black/20 p-3 rounded-lg border border-white/5">
                {project.details}
              </p>
            </div>

            {/* Tech Stack & Action Button */}
            <div>
              <div className="flex flex-wrap gap-1.5 mb-6">
                {project.techStack.map(tech => (
                  <span
                    key={tech}
                    className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-slate-300 text-xs font-mono"
                  >
                    {tech}
                  </span>
                ))}
              </div>

              {project.demoAvailable ? (
                <button
                  onClick={() => {
                    if (project.demoUrl === 'internal') {
                      onSelectProject(project.id);
                    } else {
                      window.open(project.demoUrl, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  className="w-full btn-primary flex justify-center items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  {project.demoUrl === 'internal' ? 'Launch Interactive Demo' : 'Open Live Application'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  disabled
                  className="w-full btn-secondary flex justify-center items-center gap-2 cursor-not-allowed opacity-50"
                >
                  Demo Unavailable
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {filteredProjects.length === 0 && (
        <div className="text-center py-20 glass">
          <p className="text-slate-400">No projects match your search criteria.</p>
        </div>
      )}
    </div>
  );
}
