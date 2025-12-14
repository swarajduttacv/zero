import React from 'react';
import { PortfolioSummary } from '../types';
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp } from 'lucide-react';

interface Props {
  portfolio: PortfolioSummary;
}

const StatCard: React.FC<{ 
  label: string; 
  value: string; 
  subValue?: string;
  isPositive?: boolean; 
  icon: React.ElementType 
}> = ({ label, value, subValue, isPositive, icon: Icon }) => (
  <div className="bg-brand-800 rounded-xl p-5 border border-brand-800 hover:border-brand-500 transition-colors shadow-lg">
    <div className="flex justify-between items-start mb-2">
      <span className="text-gray-400 text-sm font-medium">{label}</span>
      <div className={`p-2 rounded-lg ${isPositive === undefined ? 'bg-brand-900 text-brand-500' : isPositive ? 'bg-green-900/30 text-profit' : 'bg-red-900/30 text-loss'}`}>
        <Icon size={20} />
      </div>
    </div>
    <div className="text-2xl font-bold text-white tracking-tight">{value}</div>
    {subValue && (
      <div className={`text-sm mt-1 font-medium ${isPositive ? 'text-profit' : 'text-loss'} flex items-center gap-1`}>
        {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {subValue}
      </div>
    )}
  </div>
);

export const DashboardStats: React.FC<Props> = ({ portfolio }) => {
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard 
        label="Total Portfolio Value" 
        value={formatCurrency(portfolio.totalValue)} 
        icon={Wallet}
      />
      
      <StatCard 
        label="Day's P&L" 
        value={formatCurrency(portfolio.dayChange)} 
        subValue={`${portfolio.dayChangePercentage.toFixed(2)}%`}
        isPositive={portfolio.dayChange >= 0}
        icon={TrendingUp}
      />

      <StatCard 
        label="Total P&L" 
        value={formatCurrency(portfolio.totalPnl)} 
        subValue={`${portfolio.totalPnlPercentage.toFixed(2)}%`}
        isPositive={portfolio.totalPnl >= 0}
        icon={TrendingUp}
      />

       <StatCard 
        label="Available Cash" 
        value={formatCurrency(portfolio.cashBalance)} 
        icon={Wallet}
        isPositive={undefined}
      />
    </div>
  );
};