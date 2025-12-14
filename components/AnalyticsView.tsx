import React from 'react';
import { PortfolioSummary } from '../types';
import { TrendingUp } from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

interface Props {
  portfolio: PortfolioSummary;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#6366f1'];

export const AnalyticsView: React.FC<Props> = ({ portfolio }) => {
  // Aggregate data by Sector
  const sectorDataMap = portfolio.holdings.reduce((acc, stock) => {
    const value = stock.currentPrice * stock.quantity;
    acc[stock.sector] = (acc[stock.sector] || 0) + value;
    return acc;
  }, {} as Record<string, number>);

  const sectorData = Object.entries(sectorDataMap).map(([name, value]) => ({ name, value }));
  
  // Top Performers Data
  const performanceData = portfolio.holdings
    .map(s => ({
        name: s.symbol,
        pnl: ((s.currentPrice - s.averagePrice) / s.averagePrice) * 100
    }))
    .sort((a, b) => b.pnl - a.pnl)
    .slice(0, 10);

  return (
    <div className="space-y-6">
       <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Portfolio Analytics</h2>
        <p className="text-gray-400 text-sm">Deep dive into your portfolio distribution and performance.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sector Allocation */}
        <div className="bg-brand-900 rounded-xl border border-brand-800 p-6 shadow-xl">
          <h3 className="text-lg font-semibold text-white mb-6">Sector Allocation</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sectorData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {sectorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                    formatter={(value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)}
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance Chart */}
        <div className="bg-brand-900 rounded-xl border border-brand-800 p-6 shadow-xl">
           <h3 className="text-lg font-semibold text-white mb-6">Top Movers (P&L %)</h3>
           <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={80} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
                        cursor={{fill: '#334155', opacity: 0.2}}
                    />
                    <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
                        {performanceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
           </div>
        </div>
      </div>
      
      {/* AI Insight Box */}
      <div className="p-6 bg-gradient-to-r from-brand-900 to-brand-800 rounded-xl border border-brand-800 flex gap-4 items-start">
            <div className="p-3 bg-brand-500/20 text-brand-500 rounded-lg">
                <TrendingUp size={24} />
            </div>
            <div>
                <h4 className="text-white font-bold text-lg mb-1">AI Strategy Insight</h4>
                <p className="text-gray-300 text-sm leading-relaxed">
                    Based on your sector allocation, your portfolio is heavily weighted towards <span className="text-white font-bold">{sectorData.sort((a,b)=>b.value - a.value)[0]?.name || 'a single sector'}</span>. 
                    Consider diversifying into defensive sectors like FMCG or Pharma to reduce volatility risk. 
                    Use the Chat Assistant to ask "How can I diversify my portfolio?" for specific trade recommendations.
                </p>
            </div>
      </div>
    </div>
  );
};