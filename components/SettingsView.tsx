
import React, { useState } from 'react';
import { UserSettings } from '../types';
import { Save, Server, Terminal, Copy, Check, AlertTriangle, KeyRound, Sparkles, Link as LinkIcon, ShieldCheck } from 'lucide-react';

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

// CONFIGURATION FROM SETTINGS
const KITE_API_KEY = "${formData.kiteApiKey || 'YOUR_KITE_API_KEY'}";
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
    // Basic Order Execution Proxy
    const response = await fetch("https://api.kite.trade/orders/" + (req.body.variety || 'regular'), {
        method: 'POST',
        headers: { ...HEADERS, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(req.body)
    });
    res.json(await response.json());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(3000, () => console.log('🚀 Bridge running on http://localhost:3000'));`;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
      
      {/* SECTION 1: AI CONFIGURATION */}
      <div className="bg-brand-900 rounded-2xl border border-brand-800 p-8 shadow-xl">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
          <Sparkles className="text-brand-500" />
          AI Configuration
        </h2>
        <div className="space-y-4">
             <div>
              <label className="block text-sm font-medium text-brand-500 mb-2">Gemini API Key</label>
              <input
                type="password"
                value={formData.geminiApiKey}
                onChange={(e) => handleChange('geminiApiKey', e.target.value)}
                className="w-full bg-slate-950 text-white rounded-lg px-4 py-3 border border-brand-800 font-mono focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                placeholder="AIzaSy..."
              />
              <p className="text-xs text-gray-500 mt-2">Required for the Chatbot and Portfolio Analysis features. Get it from <a href="https://aistudio.google.com/" target="_blank" className="text-brand-500 underline" rel="noreferrer">Google AI Studio</a>.</p>
            </div>
        </div>
      </div>

      {/* SECTION 2: BROKER CONFIGURATION */}
      <div className="bg-brand-900 rounded-2xl border border-brand-800 p-8 shadow-xl">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
          <KeyRound className="text-brand-500" />
          Kite Connectivity
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-orange-900/10 border border-orange-900/30 p-4 rounded-xl">
              <div className="flex gap-3 text-xs text-orange-200">
                <AlertTriangle className="text-orange-500 shrink-0" size={20} />
                <p>For security, Zerodha API calls must route through your own backend bridge. Enter your API credentials below to generate the bridge script.</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-500 mb-2">Bridge URL</label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input
                    type="text"
                    value={formData.backendUrl}
                    onChange={(e) => handleChange('backendUrl', e.target.value)}
                    className="w-full bg-slate-950 text-white rounded-lg pl-10 pr-4 py-3 border border-brand-800 font-mono focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                    placeholder="https://your-bridge.ngrok.io"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                 <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase">Kite API Key</label>
                 <input
                    type="text"
                    value={formData.kiteApiKey}
                    onChange={(e) => handleChange('kiteApiKey', e.target.value)}
                    className="w-full bg-slate-950 text-white rounded-lg px-4 py-3 border border-brand-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                    placeholder="zerodha_api_key"
                />
              </div>
              <div>
                 <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase">Access Token</label>
                 <input
                    type="password"
                    value={formData.accessToken}
                    onChange={(e) => handleChange('accessToken', e.target.value)}
                    className="w-full bg-slate-950 text-white rounded-lg px-4 py-3 border border-brand-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                    placeholder="access_token_xyz"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-brand-800/30 rounded-lg border border-brand-800">
              <input
                type="checkbox"
                id="liveMode"
                checked={formData.isLiveMode}
                onChange={(e) => handleChange('isLiveMode', e.target.checked)}
                className="w-5 h-5 rounded border-gray-600 text-brand-500 focus:ring-brand-500 bg-slate-950"
              />
              <label htmlFor="liveMode" className="text-sm text-gray-300 font-medium select-none cursor-pointer">Enable Live Connection</label>
            </div>
          </div>

          <div className="bg-slate-950 rounded-xl border border-brand-800 overflow-hidden flex flex-col h-[500px]">
            <div className="p-3 bg-brand-800/50 border-b border-brand-800 flex justify-between items-center">
              <span className="text-xs font-bold text-gray-300 flex items-center gap-2"><Terminal size={14} /> LIVE BRIDGE SCRIPT (Auto-Generated)</span>
              <button onClick={() => { navigator.clipboard.writeText(nodeCode); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="p-1.5 hover:bg-brand-700 rounded text-gray-400 transition-colors">
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1 font-mono text-[10px] text-blue-300">
              <pre>{nodeCode}</pre>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: SECURITY CONFIGURATION */}
      <div className="bg-brand-900 rounded-2xl border border-brand-800 p-8 shadow-xl">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
          <ShieldCheck className="text-brand-500" />
          Security
        </h2>
        <div className="space-y-4">
             <div>
              <label className="block text-sm font-medium text-brand-500 mb-2">Transaction Passcode</label>
              <input
                type="password"
                maxLength={6}
                value={formData.passcode}
                onChange={(e) => handleChange('passcode', e.target.value)}
                className="w-full max-w-xs bg-slate-950 text-white rounded-lg px-4 py-3 border border-brand-800 font-mono tracking-widest text-center text-lg focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                placeholder="0000"
              />
              <p className="text-xs text-gray-500 mt-2">This 4-6 digit code is required to authorize any trade execution via the Chat Assistant.</p>
            </div>
            
            <button
              onClick={() => onSave(formData)}
              className="w-full md:w-auto px-8 bg-brand-500 hover:bg-brand-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2"
            >
              <Save size={20} />
              Save Configuration
            </button>
        </div>
      </div>
    </div>
  );
};
