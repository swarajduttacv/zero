
import React from 'react';
import { LayoutDashboard, PieChart, TrendingUp, Settings, LogOut, Briefcase } from 'lucide-react';

interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<Props> = ({ activeTab, onTabChange, onLogout }) => {
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard' },
    { icon: Briefcase, label: 'Holdings' },
    { icon: TrendingUp, label: 'Analytics' },
    { icon: PieChart, label: 'Reports' },
    { icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="hidden md:flex flex-col w-64 bg-brand-900 border-r border-brand-800 h-screen p-6 sticky top-0">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-8 h-8 bg-brand-accent rounded flex items-center justify-center">
            <span className="font-bold text-white text-lg">Z</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">
          Zerodha<span className="text-brand-500">.ai</span>
        </h1>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => onTabChange(item.label)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === item.label
                ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                : 'text-gray-400 hover:bg-brand-800 hover:text-white'
            }`}
          >
            <item.icon size={20} />
            <span className="font-medium text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="pt-6 border-t border-brand-800">
        <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-400 transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </div>
  );
};
