import React from 'react';
import { CheckCircle2, GitBranch, Settings, Github, RefreshCw } from 'lucide-react';
import type { RepoHealth } from '../types/task';

interface HeaderProps {
  health: RepoHealth | null;
  isLoading: boolean;
  isSaving: boolean;
  onRefresh: () => void;
  onOpenConfig: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  health,
  isLoading,
  isSaving,
  onRefresh,
  onOpenConfig,
}) => {
  return (
    <header className="border-b border-[#30363d] bg-[#161b22]/70 backdrop-blur sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#238636]/20 border border-[#238636]/40 flex items-center justify-center text-[#3fb950] shadow-sm">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-[#f0f6fc] tracking-tight flex items-center gap-2">
              Daily Task Tracker
              <span className="hidden sm:inline-block text-[11px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#30363d] text-[#8b949e]">
                GitHub Store
              </span>
            </h1>
            <p className="text-xs text-[#8b949e]">
              Persistent daily work logs committed directly to your repository
            </p>
          </div>
        </div>

        {/* Status Badges & Actions */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto sm:ml-0">
          {/* GitHub Connection Badge */}
          {health?.configured && health.connected ? (
            <a
              href={`https://github.com/${health.owner}/${health.repo}`}
              target="_blank"
              rel="noreferrer"
              title={`Connected to ${health.owner}/${health.repo} (${health.branch})`}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#1f6feb]/10 text-[#58a6ff] border border-[#1f6feb]/30 hover:bg-[#1f6feb]/20 transition-colors"
            >
              <Github className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{health.owner}/</span>
              <span>{health.repo}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950] animate-pulse" />
            </a>
          ) : (
            <button
              onClick={onOpenConfig}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#d29922]/10 text-[#d29922] border border-[#d29922]/30 hover:bg-[#d29922]/20 transition-colors"
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Configure GitHub</span>
            </button>
          )}

          {/* Sync / Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading || isSaving}
            title="Refresh tasks from GitHub"
            className="p-1.5 rounded-md text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d] border border-transparent hover:border-[#30363d] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#58a6ff]' : ''}`} />
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenConfig}
            title="Settings & Setup"
            className="p-1.5 rounded-md text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d] border border-transparent hover:border-[#30363d] transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
