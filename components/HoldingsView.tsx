
import React from 'react';
import { PortfolioSummary } from '../types';
import { exportToCSV } from '../services/zerodhaService';
import { TrendingUp, TrendingDown, Download, Sparkles } from 'lucide-react';

interface Props {
  portfolio: PortfolioSummary;
  onSwitchToDashboard: () => void;
  onRequestAnalysis: (message: string) => void;
}

export const HoldingsView: React.FC<Props> = ({ portfolio, onSwitchToDashboard, onRequestAnalysis }) => {
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

  const handleExport = () => {
    const exportData = portfolio.holdings.map(h => ({
      Instrument: h.symbol,
      Quantity: h.quantity,
      AveragePrice: h.averagePrice,
      LTP: h.currentPrice,
      Value: h.quantity * h.currentPrice,
      PNL: (h.currentPrice - h.averagePrice) * h.quantity
    }));
    exportToCSV(exportData, `holdings_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleQuickAnalysis = () => {
    onSwitchToDashboard();
    onRequestAnalysis("Analyze my current holdings distribution and suggest if I need to rebalance based on market sector performance.");
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white">Holdings ({portfolio.holdings.length})</h2>
          <p className="text-gray-400 text-sm mt-1">
            Real-time equity exposure: <span className="text-white font-mono">{formatCurrency(portfolio.totalValue)}</span>
          </p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-brand-800 text-gray-300 rounded-lg text-sm hover:bg-brand-700 transition-colors"
            >
                <Download size={16} />
                Export CSV
            </button>
            <button 
                onClick={handleQuickAnalysis}
                className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-bold hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/20"
            >
                <Sparkles size={16} />
                AI Analysis
            </button>
        </div>
      </div>

      <div className="bg-brand-900 rounded-xl border border-brand-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-brand-800/50 border-b border-brand-800 text-gray-400 uppercase tracking-wider text-xs">
                <th className="px-6 py-4 font-semibold">Instrument</th>
                <th className="px-6 py-4 font-semibold text-right">Qty</th>
                <th className="px-6 py-4 font-semibold text-right">Avg. Cost</th>
                <th className="px-6 py-4 font-semibold text-right">LTP</th>
                <th className="px-6 py-4 font-semibold text-right">Cur. Value</th>
                <th className="px-6 py-4 font-semibold text-right">P&L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-800">
              {portfolio.holdings.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500 italic">No active holdings found in your Zerodha profile.</td></tr>
              ) : (
                portfolio.holdings.map((stock) => {
                    const pnl = (stock.currentPrice - stock.averagePrice) * stock.quantity;
                    const pnlPercent = ((stock.currentPrice - stock.averagePrice) / stock.averagePrice) * 100;
                    return (
                    <tr key={stock.symbol} className="hover:bg-brand-800/30 transition-colors">
                        <td className="px-6 py-4">
                        <div className="font-bold text-white">{stock.symbol}</div>
                        <div className="text-[10px] text-gray-500">{stock.sector}</div>
                        </td>
                        <td className="px-6 py-4 text-right text-gray-300 font-mono">{stock.quantity}</td>
                        <td className="px-6 py-4 text-right text-gray-300 font-mono">{stock.averagePrice.toFixed(2)}</td>
                        <td className="px-6 py-4 text-right font-mono text-white">{stock.currentPrice.toFixed(2)}</td>
                        <td className="px-6 py-4 text-right text-white font-mono">{formatCurrency(stock.quantity * stock.currentPrice)}</td>
                        <td className={`px-6 py-4 text-right font-mono font-bold ${pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                            {pnl >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                        </td>
                    </tr>
                    );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
