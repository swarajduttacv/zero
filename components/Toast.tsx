
import React, { useEffect, useState, useRef } from 'react';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';
import { Notification } from '../types';

interface Props {
  notification: Notification | null;
  onClose: () => void;
}

export const Toast: React.FC<Props> = ({ notification, onClose }) => {
  const [visible, setVisible] = useState(false);
  // Use a ref to store the latest onClose callback to avoid triggering useEffect when the parent re-renders
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (notification) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        // Wait for animation to finish before clearing data
        const cleanupTimer = setTimeout(() => {
           onCloseRef.current?.();
        }, 300);
        return () => clearTimeout(cleanupTimer);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]); // Only re-run if the notification object itself changes

  if (!notification && !visible) return null;

  return (
    <div className={`fixed bottom-6 right-6 z-[100] transition-all duration-300 transform ${visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}`}>
      <div className={`flex items-start gap-3 p-4 rounded-xl border shadow-2xl max-w-sm backdrop-blur-md ${
        notification?.type === 'success' ? 'bg-green-900/90 border-green-800 text-green-100' :
        notification?.type === 'error' ? 'bg-red-900/90 border-red-800 text-red-100' :
        'bg-brand-800/90 border-brand-700 text-gray-100'
      }`}>
        <div className="mt-0.5">
          {notification?.type === 'success' && <CheckCircle size={20} className="text-green-400" />}
          {notification?.type === 'error' && <AlertCircle size={20} className="text-red-400" />}
          {(notification?.type === 'info' || notification?.type === 'warning') && <Info size={20} className="text-brand-400" />}
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-sm">{notification?.title}</h4>
          <p className="text-xs opacity-90 mt-1 leading-relaxed">{notification?.message}</p>
        </div>
        <button 
          onClick={() => { 
            setVisible(false); 
            setTimeout(() => onCloseRef.current?.(), 300); 
          }} 
          className="opacity-50 hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
