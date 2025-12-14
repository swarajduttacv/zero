
import React from 'react';
import { PortfolioSummary } from '../types';
import { TrendingUp, TrendingDown, MoreVertical } from 'lucide-react';

interface Props {
  portfolio: PortfolioSummary;
}

export const HoldingsView: React.FC<Props> = ({ portfolio }) => {
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(val);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white">Holdings ({portfolio.holdings.length})</h2>
          <p className="text-gray-400 text-sm mt-1">
            Total Investment Value: <span className="text-white font-mono">{formatCurrency(portfolio.totalValue)}</span>
          </p>
        </div>
        <div className="flex gap-2">
            <button className="px-4 py-2 bg-brand-800 text-gray-300 rounded-lg text-sm hover:bg-brand-700">Download CSV</button>
            <button className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600">Analyze All</button>
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
                <th className="px-6 py-4 font-semibold text-right">Net Chg.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-800">
              {portfolio.holdings.map((stock) => {
                const curValue = stock.quantity * stock.currentPrice;
                const pnl = (stock.currentPrice - stock.averagePrice) * stock.quantity;
                const pnlPercent = ((stock.currentPrice - stock.averagePrice) / stock.averagePrice) * 100;
                const dayChange = (stock.currentPrice - stock.previousClose) * stock.quantity;
                const dayChangePercent = ((stock.currentPrice - stock.previousClose) / stock.previousClose) * 100;

                return (
                  <tr key={stock.symbol} className="hover:bg-brand-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-1 h-8 rounded-full ${dayChange >= 0 ? 'bg-profit' : 'bg-loss'}`}></div>
                        <div>
                            <div className="font-bold text-white">{stock.symbol}</div>
                            <div className="text-xs text-gray-500">{stock.name}</div>
                        </div>
                        {stock.sector && (
                            <span className="ml-2 px-2 py-0.5 rounded text-[10px] bg-brand-800 text-gray-400 border border-brand-700">
                                {stock.sector}
                            </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-300 font-mono">{stock.quantity}</td>
                    <td className="px-6 py-4 text-right text-gray-300 font-mono">{stock.averagePrice.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right font-mono">
                        <div className={dayChange >= 0 ? 'text-profit' : 'text-loss'}>
                            {stock.currentPrice.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-gray-500">
                             {dayChangePercent > 0 ? '+' : ''}{dayChangePercent.toFixed(2)}%
                        </div>
                    </td>
                    <td className="px-6 py-4 text-right text-white font-mono font-medium">{formatCurrency(curValue)}</td>
                    <td className="px-6 py-4 text-right font-mono">
                      <div className={pnl >= 0 ? 'text-profit' : 'text-loss'}>
                        {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono">
                       <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${pnl >= 0 ? 'bg-green-900/20 text-profit' : 'bg-red-900/20 text-loss'}`}>
                            {pnlPercent > 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                       </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
