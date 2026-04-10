import React from 'react';
import { ViewMode } from '../types';
import { Icons as IconSet } from '../constants';

interface SidebarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  tokenUsage: number;
  onInstall: () => void;
  canInstall: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, tokenUsage, onInstall, canInstall }) => {
  const navItems: { id: ViewMode; label: string; icon: React.FC }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: IconSet.Gavel },
    { id: 'assistant', label: 'AI Assistant', icon: IconSet.Chat },
    { id: 'research', label: 'Deep Research', icon: IconSet.Search },
    { id: 'drafting', label: 'Draft Motion', icon: IconSet.Scale },
    { id: 'files', label: 'Case Files', icon: IconSet.Document },
    { id: 'profile', label: 'Settings', icon: IconSet.Settings },
  ];

  const formatTokens = (num: number) => {
    return num > 1000 ? `${(num / 1000).toFixed(1)}k` : num;
  };

  return (
    <div className="w-full md:w-20 lg:w-64 bg-legal-900 text-legal-50 flex flex-row md:flex-col justify-between h-16 md:h-screen shrink-0 border-t md:border-t-0 md:border-r border-legal-800 z-50 pb-safe md:pb-0">
      <div className="flex-1 md:flex-none flex flex-row md:flex-col w-full h-full md:h-auto overflow-hidden">
        <div className="hidden md:flex p-6 flex-col items-center lg:items-start gap-3 border-b border-legal-800">
          <div className="flex items-center gap-3">
            <div className="bg-legal-800 p-2 rounded-lg border border-legal-700">
               <IconSet.Users className="w-5 h-5 text-legal-200" />
            </div>
            <span className="text-2xl font-serif font-bold hidden lg:block tracking-wide text-legal-50">Family First</span>
          </div>
          <span className="hidden lg:block text-[10px] text-legal-400 uppercase tracking-widest font-medium">AI Partner in Family Court</span>
        </div>

        <nav className="flex flex-row md:flex-col w-full h-full md:h-auto items-center justify-center md:justify-start px-1 md:mt-8 md:px-2 lg:px-4 md:space-y-1 overflow-x-auto md:overflow-visible hide-scrollbar gap-1 md:gap-0">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              aria-label={item.label}
              className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-0 md:gap-4 p-2 md:px-4 md:py-3 rounded-lg transition-all duration-200 min-w-[48px] min-h-[44px] md:min-w-0 md:w-full ${
                isActive
                  ? 'text-legal-50 md:bg-legal-800 md:shadow-sm md:border md:border-legal-700 bg-legal-800/50'
                  : 'text-legal-400 hover:text-legal-100 md:hover:bg-legal-800/50'
              }`}
            >
              <div className={`rounded-full transition-colors flex items-center justify-center ${isActive ? 'md:bg-transparent' : ''}`}>
                 <item.icon className="w-5 h-5 md:w-5 md:h-5 shrink-0" />
              </div>
              <span className={`text-[8px] md:text-xs uppercase tracking-wider font-medium leading-tight md:hidden lg:block text-center md:text-left ${isActive ? 'text-legal-50' : 'text-legal-400'} mt-0.5 md:mt-0`}>
                {item.label}
              </span>
            </button>
          )})}
        </nav>
      </div>

      <div className="hidden md:block p-2 md:p-4 border-t border-legal-800 space-y-2 md:space-y-4">
        {/* Token Tracker */}
        <div className="bg-legal-800/50 rounded-lg p-2 lg:p-3 hidden lg:block border border-legal-800">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold text-legal-400 uppercase tracking-wider">Session Usage</span>
                <span className="text-xs font-mono text-legal-200">{formatTokens(tokenUsage)} toks</span>
            </div>
            <div className="h-1 bg-legal-900 rounded-full w-full overflow-hidden">
                <div
                    className="h-full bg-legal-400 transition-all duration-500"
                    style={{ width: `${Math.min((tokenUsage / 100000) * 100, 100)}%` }}
                ></div>
            </div>
        </div>

        {canInstall && (
            <button
                onClick={onInstall}
                className="w-full flex items-center justify-center md:justify-start gap-2 md:gap-4 px-2 md:px-4 py-2 md:py-3 rounded-lg text-legal-300 hover:bg-legal-800 transition-all duration-200 border border-legal-700"
            >
                <IconSet.Download className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
                <span className="hidden lg:block font-medium text-xs uppercase tracking-widest">Install App</span>
            </button>
        )}

        <div className="mt-2 md:mt-4 text-center lg:text-left">
           <p className="text-[8px] md:text-[10px] text-legal-600 uppercase tracking-widest">v1.3.0 • PWA</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;