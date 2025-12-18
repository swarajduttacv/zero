
import React, { useState } from 'react';
import { UserSettings } from '../types';
import { Save, Server, Terminal, Copy, Check, AlertTriangle, KeyRound } from 'lucide-react';

interface Props {
  settings: UserSettings;
  onSave: (settings: UserSettings) => void;
}

export const SettingsView: React.FC<Props> = ({ settings, onSave }) => {
  const [formData, setFormData] = useState(settings);
  const [copied, setCopied] = useState(false);

  const handleChange = (field: keyof UserSettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nodeCode = `/**
 * ZERODHA BRIDGE SERVER (Node.js)
 * Instructions:
 * 1. mkdir kite-bridge && cd kite-bridge
 * 2. npm init -y && npm install express node-fetch@2 cors
 * 3. node server.js
 */
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors'); 

const app = express();
app.use(cors());
app.use(express.json());

const KITE_API_KEY = "${formData.apiKey || 'YOUR_API_KEY'}";
const KITE_ACCESS_TOKEN = "${formData.accessToken || 'YOUR_ACCESS_TOKEN'}";
const HEADERS = { "X-Kite-Version": "3", "Authorization": \`token \${KITE_API_KEY}:\${KITE_ACCESS_TOKEN}\` };

app.get('/holdings', async (req, res) => {
  try {
    const r = await fetch("https://api.kite.trade/portfolio/holdings", { headers: HEADERS });
    res.json(await r.json());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/orders', async (req, res) => {
  try {
    const r = await fetch("https://api.kite.trade/orders", { headers: HEADERS });
    res.json(await r.json());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/order', async (req, res) => {
  try {
    // Implement Kite Order POST here
    res.json({ status: 'success', data: { order_id: 'Z' + Date.now() } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(3000, () => console.log('🚀 Bridge running on http://localhost:3000'));`;

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
              <div className="flex gap-3 text-xs text-red-200">
                <AlertTriangle className="text-red-500 shrink-0" size={20} />
                <p>Ensure your bridge is running and reachable via a tunnel (like ngrok) if deploying remotely.</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-500 mb-2">Bridge URL</label>
              <input
                type="text"
                value={formData.backendUrl}
                onChange={(e) => handleChange('backendUrl', e.target.value)}
                className="w-full bg-slate-950 text-white rounded-lg px-4 py-3 border border-brand-800 font-mono"
                placeholder="https://your-bridge.ngrok.io"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                value={formData.apiKey}
                onChange={(e) => handleChange('apiKey', e.target.value)}
                className="w-full bg-slate-950 text-white rounded-lg px-4 py-3 border border-brand-800"
                placeholder="API Key"
              />
              <input
                type="password"
                value={formData.accessToken}
                onChange={(e) => handleChange('accessToken', e.target.value)}
                className="w-full bg-slate-950 text-white rounded-lg px-4 py-3 border border-brand-800"
                placeholder="Access Token"
              />
            </div>

            <div className="flex items-center gap-3 p-4 bg-brand-800/30 rounded-lg border border-brand-800">
              <input
                type="checkbox"
                id="liveMode"
                checked={formData.isLiveMode}
                onChange={(e) => handleChange('isLiveMode', e.target.checked)}
                className="w-5 h-5 rounded border-gray-600 text-brand-500"
              />
              <label htmlFor="liveMode" className="text-sm text-gray-300 font-medium">Connect Live Mode</label>
            </div>

            <button
              onClick={() => onSave(formData)}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <Save size={20} />
              Save Configuration
            </button>
          </div>

          <div className="bg-slate-950 rounded-xl border border-brand-800 overflow-hidden flex flex-col h-[500px]">
            <div className="p-3 bg-brand-800/50 border-b border-brand-800 flex justify-between items-center">
              <span className="text-xs font-bold text-gray-300 flex items-center gap-2"><Terminal size={14} /> LIVE BRIDGE SCRIPT</span>
              <button onClick={() => { navigator.clipboard.writeText(nodeCode); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="p-1.5 hover:bg-brand-700 rounded text-gray-400">
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1 font-mono text-[10px] text-blue-300">
              <pre>{nodeCode}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
