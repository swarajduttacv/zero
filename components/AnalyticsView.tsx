
import React, { useMemo } from 'react';
import { PortfolioSummary } from '../types';
import { TrendingUp, PieChart as PieIcon, BarChart3 } from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

interface Props {
  portfolio: PortfolioSummary;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#6366f1'];

export const AnalyticsView: React.FC<Props> = ({ portfolio }) => {
  // Memoize sector distribution data
  const sectorData = useMemo(() => {
    const sectorDataMap = (portfolio.holdings || []).reduce((acc, stock) => {
      const value = stock.currentPrice * stock.quantity;
      acc[stock.sector] = (acc[stock.sector] || 0) + value;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(sectorDataMap)
      .map(([name, value]) => ({ 
        name, 
        value: Number(value) 
      }))
      .sort((a, b) => b.value - a.value);
  }, [portfolio.holdings]);

  // Memoize top performers data
  const performanceData = useMemo(() => {
    return (portfolio.holdings || [])
      .map(s => ({
          name: s.symbol,
          pnl: ((s.currentPrice - s.averagePrice) / s.averagePrice) * 100
      }))
      .sort((a, b) => b.pnl - a.pnl)
      .slice(0, 10);
  }, [portfolio.holdings]);

  const topSectorName = sectorData[0]?.name || 'a single sector';

  if (!portfolio.holdings || portfolio.holdings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <BarChart3 size={48} className="text-brand-800" />
        <div>
          <h2 className="text-xl font-bold text-white">No Data for Analytics</h2>
          <p className="text-gray-500 max-w-xs mx-auto">Add some stocks to your portfolio to view deep performance and allocation analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Portfolio Analytics</h2>
        <p className="text-gray-400 text-sm">Deep dive into your portfolio distribution and performance.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sector Allocation */}
        <div className="bg-brand-900 rounded-xl border border-brand-800 p-6 shadow-xl flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <PieIcon size={20} className="text-brand-500" />
            <h3 className="text-lg font-semibold text-white">Sector Allocation</h3>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sectorData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {sectorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity outline-none" />
                  ))}
                </Pie>
                <Tooltip 
                    formatter={(value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', border: '1px solid #334155' }}
                    itemStyle={{ color: '#f1f5f9', fontSize: '12px' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle" 
                  wrapperStyle={{ paddingTop: '20px', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance Chart */}
        <div className="bg-brand-900 rounded-xl border border-brand-800 p-6 shadow-xl flex flex-col">
           <div className="flex items-center gap-2 mb-6">
             <BarChart3 size={20} className="text-brand-500" />
             <h3 className="text-lg font-semibold text-white">Top Movers (P&L %)</h3>
           </div>
           <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData} layout="vertical" margin={{ left: 10, right: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} opacity={0.3} />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={80} 
                      tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 'bold'}} 
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                        formatter={(value: number) => `${value.toFixed(2)}%`}
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', border: '1px solid #334155' }}
                        itemStyle={{ color: '#f1f5f9', fontSize: '12px' }}
                        cursor={{fill: '#334155', opacity: 0.1}}
                    />
                    <Bar dataKey="pnl" radius={[0, 4, 4, 0]} animationDuration={1000}>
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
      <div className="p-6 bg-gradient-to-br from-brand-900 via-brand-900 to-brand-800 rounded-2xl border border-brand-800 flex gap-4 items-start shadow-inner">
            <div className="p-3 bg-brand-500/10 text-brand-500 rounded-xl border border-brand-500/20">
                <TrendingUp size={24} />
            </div>
            <div>
                <h4 className="text-white font-bold text-lg mb-1 tracking-tight">AI Strategy Insight</h4>
                <p className="text-gray-400 text-sm leading-relaxed max-w-3xl">
                    Based on your sector allocation, your portfolio is heavily weighted towards <span className="text-white font-bold">{topSectorName}</span>. 
                    This concentrated exposure increases sector-specific risk. Consider diversifying into defensive sectors like FMCG or Pharma to dampen volatility. 
                    Use the <span className="text-brand-500 font-bold">ZeroGPT Assistant</span> to ask for specific hedging strategies tailored to your current holdings.
                </p>
            </div>
      </div>
    </div>
  );
};
