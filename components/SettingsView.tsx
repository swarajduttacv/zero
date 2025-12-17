
import React, { useState } from 'react';
import { UserSettings } from '../types';
import { Save, Eye, EyeOff, KeyRound, AlertCircle, Server, Terminal, Copy, Check, Info } from 'lucide-react';

interface Props {
  settings: UserSettings;
  onSave: (settings: UserSettings) => void;
}

export const SettingsView: React.FC<Props> = ({ settings, onSave }) => {
  const [formData, setFormData] = useState(settings);
  const [showPasscode, setShowPasscode] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleChange = (field: keyof UserSettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // The updated Node.js script that matches the User's requested implementation but adds CORS
  const nodeCode = `// Node.js Express Backend Bridge
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors'); // CRITICAL: Fixes the "Unreachable" error
const app = express();

app.use(cors()); // Allow browser access
app.use(express.json());

const API_KEY = "${formData.apiKey || 'YOUR_API_KEY'}";
const ACCESS_TOKEN = "${formData.accessToken || 'YOUR_ACCESS_TOKEN'}";

// 1. Portfolio Holdings Endpoint
app.get('/holdings', async (req, res) => {
  try {
    console.log('Fetching holdings...');
    const r = await fetch("https://api.kite.trade/portfolio/holdings", {
      headers: { 
        "X-Kite-Version": "3", 
        "Authorization": \`token \${API_KEY}:\${ACCESS_TOKEN}\` 
      }
    });
    const data = await r.json();
    res.json(data);
  } catch (e) { 
    res.status(500).json({ status: 'error', message: e.message }); 
  }
});

// 2. Order Execution Endpoint
app.post('/order', async (req, res) => {
  try {
    const order = req.body;
    console.log('Executing order:', order.symbol);
    // Add logic here to call Zerodha POST /orders/regular
    res.json({ status: 'success', message: 'Order received by bridge' });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

app.listen(3000, () => {
  console.log('Zerodha Bridge Online at http://localhost:3000');
});`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(nodeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="bg-brand-900 rounded-2xl border border-brand-800 p-8 shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <KeyRound className="text-brand-500" />
          Zerodha Connectivity
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
                <div className="bg-blue-900/10 border border-blue-900/30 p-4 rounded-xl mb-4">
                    <div className="flex gap-3">
                        <Info className="text-blue-400 shrink-0" size={20} />
                        <p className="text-xs text-blue-200 leading-relaxed">
                            For "Localhost Unreachable" errors, ensure your bridge script includes <span className="text-white font-bold">app.use(cors())</span>. 
                            Try using <span className="text-white font-mono">http://127.0.0.1:3000</span> if localhost fails.
                        </p>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-brand-500 mb-2">Backend Bridge URL</label>
                    <div className="relative">
                        <Server className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input
                            type="text"
                            value={formData.backendUrl}
                            onChange={(e) => handleChange('backendUrl', e.target.value)}
                            className="w-full bg-slate-950 text-white rounded-lg pl-10 pr-4 py-3 border border-brand-800 focus:border-brand-500 focus:outline-none transition-colors font-mono"
                            placeholder="http://127.0.0.1:3000"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">API Key</label>
                        <input
                            type="text"
                            value={formData.apiKey}
                            onChange={(e) => handleChange('apiKey', e.target.value)}
                            className="w-full bg-slate-950 text-white rounded-lg px-4 py-3 border border-brand-800 focus:border-brand-500 focus:outline-none transition-colors font-mono text-sm"
                            placeholder="Kite API Key"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Access Token</label>
                        <input
                            type="password"
                            value={formData.accessToken}
                            onChange={(e) => handleChange('accessToken', e.target.value)}
                            className="w-full bg-slate-950 text-white rounded-lg px-4 py-3 border border-brand-800 focus:border-brand-500 focus:outline-none transition-colors font-mono text-sm"
                            placeholder="Kite Token"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Security Passcode</label>
                    <div className="relative">
                        <input
                            type={showPasscode ? "text" : "password"}
                            value={formData.passcode}
                            onChange={(e) => handleChange('passcode', e.target.value)}
                            maxLength={6}
                            className="w-full bg-slate-950 text-white rounded-lg px-4 py-3 border border-brand-800 focus:border-brand-500 focus:outline-none transition-colors tracking-widest font-mono"
                            placeholder="Set 4-6 digit passcode"
                        />
                        <button onClick={() => setShowPasscode(!showPasscode)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-brand-500">
                            {showPasscode ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3 p-4 bg-brand-800/30 rounded-lg border border-brand-800">
                        <input
                            type="checkbox"
                            id="liveMode"
                            checked={formData.isLiveMode}
                            onChange={(e) => handleChange('isLiveMode', e.target.checked)}
                            className="w-5 h-5 rounded border-gray-600 text-brand-500 bg-slate-950"
                        />
                        <label htmlFor="liveMode" className="text-sm text-gray-300 font-medium cursor-pointer">
                            Enable Live Data Sync
                        </label>
                    </div>
                </div>

                <button
                    onClick={() => onSave(formData)}
                    className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2"
                >
                    <Save size={20} />
                    Save & Test Connection
                </button>
            </div>

            <div className="space-y-4">
                <div className="bg-slate-950 rounded-xl border border-brand-800 overflow-hidden">
                    <div className="p-3 bg-brand-800/50 border-b border-brand-800 flex justify-between items-center">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-300 uppercase">
                            <Terminal size={14} className="text-brand-500" />
                            Backend Implementation
                        </div>
                        <button onClick={copyToClipboard} className="p-1.5 hover:bg-brand-700 rounded transition-colors text-gray-400">
                            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                        </button>
                    </div>
                    <div className="p-4 overflow-x-auto max-h-[350px]">
                        <pre className="text-[10px] text-blue-300 font-mono leading-relaxed">
                            {nodeCode}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
