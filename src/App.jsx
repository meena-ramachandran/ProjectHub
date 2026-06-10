import React, { useState } from 'react';
import HubDashboard from './components/HubDashboard';
import DemoPatientManagement from './components/DemoPatientManagement';
import DemoFinSight from './components/DemoFinSight';
import DemoRAGChatbot from './components/DemoRAGChatbot';
import DemoStockVibe from './components/DemoStockVibe';
import DemoStudyBuddy from './components/DemoStudyBuddy';
import { Layers, Github, Linkedin, FileText } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState('hub'); // 'hub', 'patient-management', 'finsight', etc.

  const renderActiveView = () => {
    switch (currentView) {
      case 'hub':
        return <HubDashboard onSelectProject={setCurrentView} />;
      case 'patient-management':
        return <DemoPatientManagement onBack={() => setCurrentView('hub')} />;
      case 'finsight':
        return <DemoFinSight onBack={() => setCurrentView('hub')} />;
      case 'rag-chatbot':
        return <DemoRAGChatbot onBack={() => setCurrentView('hub')} />;
      case 'stockvibe':
        return <DemoStockVibe onBack={() => setCurrentView('hub')} />;
      case 'studybuddy':
        return <DemoStudyBuddy onBack={() => setCurrentView('hub')} />;
      default:
        return <HubDashboard onSelectProject={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between relative">
      <div className="bg-blob blob-1"></div>
      <div className="bg-blob blob-2"></div>
      <div>
        {/* Navigation Header */}
        <header className="border-b border-white/5 bg-slate-950/20 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            {/* Logo */}
            <div 
              onClick={() => setCurrentView('hub')} 
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 shadow-md group-hover:shadow-indigo-500/25 transition-all">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <span className="font-extrabold text-lg tracking-tight text-white">
                Meena<span className="text-indigo-400 font-medium">.Dev</span>
              </span>
            </div>

            {/* Social profiles and CV */}
            <div className="flex items-center gap-4 text-slate-400 text-sm">
              <a
                href="https://github.com/meena-ramachandran"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors flex items-center gap-1.5"
              >
                <Github className="w-4 h-4" />
                <span className="hidden sm:inline">GitHub</span>
              </a>
              
              <a
                href="https://linkedin.com/in/meena-ramachandran"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors flex items-center gap-1.5"
              >
                <Linkedin className="w-4 h-4" />
                <span className="hidden sm:inline">LinkedIn</span>
              </a>

              <a
                href="file:///Users/meena/.gemini/antigravity/scratch/Resume.md"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-indigo-600/25 border border-indigo-500/40 text-indigo-300 font-semibold hover:bg-indigo-600/45 hover:text-white transition-all flex items-center gap-1.5 text-xs"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Resume.md</span>
              </a>
            </div>
          </div>
        </header>

        {/* Main Workspace Page */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          {renderActiveView()}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-slate-500 text-xs font-mono">
        <p>© 2026 Meena Ramachandran. Portfolio Demo Portal.</p>
        <p className="mt-1 text-[10px] text-slate-600">Built using Vite, React, & Tailwind-free Vanilla CSS.</p>
      </footer>
    </div>
  );
}
