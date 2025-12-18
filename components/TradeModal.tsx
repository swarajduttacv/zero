
import React, { useState } from 'react';
import { TradeOrder } from '../types';
import { X, Lock, AlertTriangle, CheckCircle, Wallet } from 'lucide-react';

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
      setError('Please enter your security passcode');
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

  const estimatedTotal = order.quantity * (order.price || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-brand-900 w-full max-w-md rounded-2xl border border-brand-800 shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-brand-800/50 p-4 border-b border-brand-800 flex justify-between items-center">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Wallet className="text-brand-500" size={20} />
            Confirm Order
          </h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="flex flex-col items-center justify-center p-6 bg-brand-950 rounded-xl border border-brand-800 relative overflow-hidden">
             {/* Background accent */}
             <div className={`absolute top-0 left-0 w-full h-1 ${order.transactionType === 'BUY' ? 'bg-green-500' : 'bg-red-500'}`}></div>
             
             <span className={`text-xs font-bold px-3 py-1 rounded-full mb-3 tracking-wider ${order.transactionType === 'BUY' ? 'bg-green-900/30 text-green-400 border border-green-900/50' : 'bg-red-900/30 text-red-400 border border-red-900/50'}`}>
               {order.transactionType} ORDER
             </span>
             
             <div className="flex items-baseline gap-2 mb-1">
                 <h2 className="text-4xl font-bold text-white">{order.quantity}</h2>
                 <span className="text-lg text-gray-500 font-medium">qty</span>
             </div>
             
             <div className="text-xl font-medium text-brand-500 mb-4">{order.symbol}</div>
             
             <div className="flex gap-4 w-full justify-center border-t border-brand-800/50 pt-4">
                 <div className="text-center">
                     <div className="text-[10px] text-gray-500 uppercase font-bold">Type</div>
                     <div className="text-sm text-gray-300 font-mono">{order.orderType}</div>
                 </div>
                 <div className="w-px bg-brand-800/50"></div>
                 <div className="text-center">
                     <div className="text-[10px] text-gray-500 uppercase font-bold">Price / Share</div>
                     <div className="text-lg text-white font-bold font-mono">
                        {order.price ? `₹${order.price.toLocaleString('en-IN')}` : 'MARKET'}
                     </div>
                     {!order.price && <div className="text-[9px] text-gray-600">Price determined at execution</div>}
                 </div>
             </div>
             
             {estimatedTotal > 0 && (
                <div className="mt-4 pt-3 border-t border-brand-800/30 w-full text-center">
                    <div className="text-[10px] text-gray-500 uppercase font-bold">Estimated Total</div>
                    <div className="text-xl font-bold text-white font-mono">₹{estimatedTotal.toLocaleString('en-IN')}</div>
                </div>
             )}
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">Security Passcode</label>
            <div className="relative">
              <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${error ? 'text-red-500' : 'text-gray-500'}`} size={18} />
              <input
                type="password"
                value={passcode}
                onChange={(e) => { setPasscode(e.target.value); setError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                className={`w-full bg-brand-950 text-white rounded-xl pl-10 pr-4 py-3.5 border font-mono tracking-[0.5em] text-center text-lg focus:outline-none focus:ring-1 transition-all ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-brand-800 focus:border-brand-500 focus:ring-brand-500'}`}
                placeholder="••••"
                maxLength={6}
                autoFocus
              />
            </div>
            {error && (
                <div className="flex items-center gap-2 text-red-400 text-xs bg-red-900/10 p-2 rounded-lg">
                    <AlertTriangle size={12} />
                    {error}
                </div>
            )}
            <p className="text-[10px] text-gray-500 text-center">Enter the passcode configured in Settings (Default: 0000)</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onCancel}
              className="flex-1 py-3 px-4 rounded-xl border border-brand-700 text-gray-300 hover:bg-brand-800 hover:text-white transition-colors font-medium text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isProcessing}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 text-sm ${
                isProcessing ? 'bg-brand-700 cursor-not-allowed opacity-75' : 'bg-brand-500 hover:bg-brand-600 shadow-lg shadow-brand-500/20'
              }`}
            >
              {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Verifying...
                  </>
              ) : (
                  <>
                    <CheckCircle size={16} />
                    Confirm Trade
                  </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
