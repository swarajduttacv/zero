
import React from 'react';
import { Transaction } from '../types';
import { FileText, Download } from 'lucide-react';

// Mock Transaction History
const MOCK_HISTORY: Transaction[] = [
    { id: '1', date: '2023-10-24', symbol: 'RELIANCE', type: 'BUY', quantity: 10, price: 2350, total: 23500 },
    { id: '2', date: '2023-10-20', symbol: 'TCS', type: 'SELL', quantity: 5, price: 3400, total: 17000 },
    { id: '3', date: '2023-10-15', symbol: 'ZOMATO', type: 'BUY', quantity: 100, price: 110, total: 11000 },
    { id: '4', date: '2023-10-10', symbol: 'HDFCBANK', type: 'BUY', quantity: 25, price: 1520, total: 38000 },
    { id: '5', date: '2023-09-28', symbol: 'INFY', type: 'SELL', quantity: 10, price: 1450, total: 14500 },
];

export const ReportsView: React.FC = () => {
  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-2xl font-bold text-white">Reports & Ledger</h2>
            <p className="text-gray-400 text-sm">View and download your transaction history.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-brand-800 hover:bg-brand-700 text-white rounded-lg transition-colors">
            <Download size={18} />
            <span>Export 2023-24</span>
        </button>
      </div>

      <div className="bg-brand-900 rounded-xl border border-brand-800 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-brand-800 bg-brand-800/20">
            <h3 className="font-semibold text-white flex items-center gap-2">
                <FileText size={18} className="text-brand-500"/>
                Recent Transactions
            </h3>
        </div>
        <table className="w-full text-left text-sm">
            <thead>
                <tr className="bg-brand-950 text-gray-400 text-xs uppercase tracking-wider">
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Instrument</th>
                    <th className="px-6 py-4 text-center">Type</th>
                    <th className="px-6 py-4 text-right">Qty</th>
                    <th className="px-6 py-4 text-right">Price</th>
                    <th className="px-6 py-4 text-right">Total</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-brand-800">
                {MOCK_HISTORY.map((tx) => (
                    <tr key={tx.id} className="hover:bg-brand-800/30 transition-colors">
                        <td className="px-6 py-4 text-gray-300">{tx.date}</td>
                        <td className="px-6 py-4 font-bold text-white">{tx.symbol}</td>
                        <td className="px-6 py-4 text-center">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${tx.type === 'BUY' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                                {tx.type}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-right text-gray-300">{tx.quantity}</td>
                        <td className="px-6 py-4 text-right text-gray-300">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(tx.price)}</td>
                        <td className="px-6 py-4 text-right text-white font-medium">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(tx.total)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};
