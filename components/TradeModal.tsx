import React, { useState } from 'react';
import { TradeOrder } from '../types';
import { X, Lock, AlertTriangle, CheckCircle } from 'lucide-react';

interface Props {
  order: TradeOrder;
  onConfirm: (passcode: string) => Promise<void>;
  onCancel: () => void;
  isOpen: boolean;
}

export const TradeModal: React.FC<Props> = ({ order, onConfirm, onCancel, isOpen }) => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!passcode) {
      setError('Please enter your passcode');
      return;
    }
    setError('');
    setIsProcessing(true);
    try {
      await onConfirm(passcode);
      setPasscode('');
    } catch (err: any) {
      setError(err.message || 'Verification Failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const totalValue = order.quantity * (order.price || 0); // Approx if market

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-brand-900 w-full max-w-md rounded-2xl border border-brand-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-brand-800/50 p-4 border-b border-brand-800 flex justify-between items-center">
          <h3 className="font-bold text-white flex items-center gap-2">
            <AlertTriangle className="text-yellow-500" size={20} />
            Confirm Trade Execution
          </h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="flex flex-col items-center justify-center p-4 bg-brand-950 rounded-xl border border-brand-800">
             <span className={`text-sm font-bold px-2 py-1 rounded mb-2 ${order.transactionType === 'BUY' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
               {order.transactionType}
             </span>
             <h2 className="text-3xl font-bold text-white mb-1">{order.quantity} <span className="text-xl text-gray-400">Qty</span></h2>
             <div className="text-xl font-medium text-brand-500">{order.symbol}</div>
             <div className="text-sm text-gray-500 mt-2">Order Type: {order.orderType}</div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-400">Enter Security Passcode</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full bg-brand-950 text-white rounded-xl pl-10 pr-4 py-3 border border-brand-800 focus:border-brand-500 focus:outline-none tracking-widest"
                placeholder="••••••"
                maxLength={6}
              />
            </div>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onCancel}
              className="flex-1 py-3 px-4 rounded-xl border border-brand-700 text-gray-300 hover:bg-brand-800 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isProcessing}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
                isProcessing ? 'bg-brand-700 cursor-not-allowed' : 'bg-brand-500 hover:bg-brand-600 shadow-lg shadow-brand-500/20'
              }`}
            >
              {isProcessing ? 'Verifying...' : 'Execute Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};