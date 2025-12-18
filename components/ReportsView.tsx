
import React from 'react';
import { PortfolioSummary } from '../types';
import { FileText, Download, ListFilter } from 'lucide-react';
import { exportToCSV } from '../services/zerodhaService';

interface Props {
  portfolio: PortfolioSummary | null;
}

export const ReportsView: React.FC<Props> = ({ portfolio }) => {
  const orders = portfolio?.orders || [];

  const handleExport = () => {
    if (!orders.length) return;
    exportToCSV(orders, `transactions_${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-2xl font-bold text-white">Reports & Ledger</h2>
            <p className="text-gray-400 text-sm">Live transaction and order history from Kite.</p>
        </div>
        <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-brand-800 hover:bg-brand-700 text-gray-400 text-sm rounded-lg transition-colors">
                <ListFilter size={16} />
                Filter
            </button>
            <button 
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors"
            >
                <Download size={18} />
                <span>Export Ledger</span>
            </button>
        </div>
      </div>

      <div className="bg-brand-900 rounded-xl border border-brand-800 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-brand-800 bg-brand-800/20">
            <h3 className="font-semibold text-white flex items-center gap-2">
                <FileText size={18} className="text-brand-500"/>
                Recent Orders
            </h3>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="bg-brand-950 text-gray-400 text-xs uppercase tracking-wider">
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Instrument</th>
                        <th className="px-6 py-4 text-center">Type</th>
                        <th className="px-6 py-4 text-right">Qty</th>
                        <th className="px-6 py-4 text-right">Avg. Price</th>
                        <th className="px-6 py-4 text-right">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-brand-800">
                    {orders.length === 0 ? (
                        <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No transaction records found in this cycle.</td></tr>
                    ) : (
                        orders.map((tx) => (
                            <tr key={tx.id} className="hover:bg-brand-800/30 transition-colors">
                                <td className="px-6 py-4 text-gray-300 font-mono text-xs">{tx.date}</td>
                                <td className="px-6 py-4 font-bold text-white">{tx.symbol}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold ${tx.type === 'BUY' ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-red-900/30 text-red-400 border border-red-800'}`}>
                                        {tx.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right text-gray-300 font-mono">{tx.quantity}</td>
                                <td className="px-6 py-4 text-right text-gray-300 font-mono">₹{tx.price?.toLocaleString()}</td>
                                <td className="px-6 py-4 text-right font-medium">
                                    <span className={`text-[10px] uppercase tracking-tighter ${tx.status === 'COMPLETE' ? 'text-green-500' : 'text-orange-500'}`}>
                                        {tx.status || 'PROCESSED'}
                                    </span>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};
