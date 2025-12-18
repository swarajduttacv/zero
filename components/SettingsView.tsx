
import React, { useState } from 'react';
import { UserSettings } from '../types';
import { Save, Eye, EyeOff, KeyRound, Server, Terminal, Copy, Check, Info, AlertTriangle, ExternalLink } from 'lucide-react';

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

  const nodeCode = `/**
 * ZERODHA BRIDGE SERVER (Node.js)
 * Instructions:
 * 1. Create directory: mkdir kite-bridge && cd kite-bridge
 * 2. Init: npm init -y
 * 3. Install: npm install express node-fetch@2 cors
 * 4. Create server.js and paste this code.
 * 5. Run: node server.js
 */
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors'); 

const app = express();
app.use(cors()); // CRITICAL: Allows browser connection
app.use(express.json());

const KITE_API_KEY = "${formData.apiKey || 'YOUR_API_KEY'}";
const KITE_ACCESS_TOKEN = "${formData.accessToken || 'YOUR_ACCESS_TOKEN'}";

// Portfolio Endpoint
app.get('/holdings', async (req, res) => {
  try {
    console.log('Syncing holdings...');
    const response = await fetch("https://api.kite.trade/portfolio/holdings", {
      headers: { 
        "X-Kite-Version": "3", 
        "Authorization": \`token \${KITE_API_KEY}:\${KITE_ACCESS_TOKEN}\` 
      }
    });
    const data = await response.json();
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// Order Execution Endpoint
app.post('/order', async (req, res) => {
  try {
    const order = req.body;
    console.log('Order received for:', order.symbol);
    // Add Kite Order POST logic here
    res.json({ status: 'success', message: 'Bridge received order' });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(\`🚀 Bridge online at http://localhost:\${PORT}\`));`;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="bg-brand-900 rounded-2xl border border-brand-800 p-8 shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <KeyRound className="text-brand-500" />
          Kite Connectivity
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-red-900/10 border border-red-900/30 p-4 rounded-xl">
              <div className="flex gap-3">
                <AlertTriangle className="text-red-500 shrink-0" size={20} />
                <div className="text-xs text-red-200 space-y-2">
                  <p><strong>Mixed Content Warning:</strong> Browsers block HTTPS sites (Vercel) from calling HTTP (Localhost).</p>
                  <p>To fix the "Unreachable" error, use a tunnel like <strong>ngrok</strong> to get a secure HTTPS URL for your bridge:</p>
                  <code className="bg-black/50 px-2 py-1 rounded text-white block">ngrok http 3000</code>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-500 mb-2">Bridge Server URL (HTTPS Recommended)</label>
              <div className="relative">
                <Server className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="text"
                  value={formData.backendUrl}
                  onChange={(e) => handleChange('backendUrl', e.target.value)}
                  className="w-full bg-slate-950 text-white rounded-lg pl-10 pr-4 py-3 border border-brand-800 focus:border-brand-500 font-mono"
                  placeholder="https://your-tunnel.ngrok-free.app"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Kite API Key</label>
                <input
                  type="text"
                  value={formData.apiKey}
                  onChange={(e) => handleChange('apiKey', e.target.value)}
                  className="w-full bg-slate-950 text-white rounded-lg px-4 py-3 border border-brand-800 focus:border-brand-500 font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Kite Access Token</label>
                <input
                  type="password"
                  value={formData.accessToken}
                  onChange={(e) => handleChange('accessToken', e.target.value)}
                  className="w-full bg-slate-950 text-white rounded-lg px-4 py-3 border border-brand-800 focus:border-brand-500 font-mono text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-brand-800/30 rounded-lg border border-brand-800">
              <input
                type="checkbox"
                id="liveMode"
                checked={formData.isLiveMode}
                onChange={(e) => handleChange('isLiveMode', e.target.checked)}
                className="w-5 h-5 rounded border-gray-600 text-brand-500 bg-slate-950"
              />
              <label htmlFor="liveMode" className="text-sm text-gray-300 font-medium cursor-pointer">
                Connect Live Zerodha Profile
              </label>
            </div>

            <button
              onClick={() => onSave(formData)}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2"
            >
              <Save size={20} />
              Save Configuration
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-950 rounded-xl border border-brand-800 overflow-hidden">
              <div className="p-3 bg-brand-800/50 border-b border-brand-800 flex justify-between items-center">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                  <Terminal size={14} className="text-brand-500" />
                  UPDATED BRIDGE SCRIPT
                </div>
                <button 
                  onClick={() => { navigator.clipboard.writeText(nodeCode); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  className="p-1.5 hover:bg-brand-700 rounded text-gray-400"
                >
                  {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                </button>
              </div>
              <div className="p-4 overflow-x-auto max-h-[400px]">
                <pre className="text-[10px] text-blue-300 font-mono leading-relaxed">
                  {nodeCode}
                </pre>
              </div>
            </div>
            <p className="text-[10px] text-gray-500 leading-relaxed italic">
              * Note: Running your bridge via ngrok solves the "Unreachable" error on Vercel deployments.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
