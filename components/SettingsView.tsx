
import React, { useState } from 'react';
import { UserSettings } from '../types';
import { Save, Eye, EyeOff, KeyRound, AlertCircle, Globe, ExternalLink, RefreshCw } from 'lucide-react';

interface Props {
  settings: UserSettings;
  onSave: (settings: UserSettings) => void;
}

export const SettingsView: React.FC<Props> = ({ settings, onSave }) => {
  const [formData, setFormData] = useState(settings);
  const [showPasscode, setShowPasscode] = useState(false);

  const handleChange = (field: keyof UserSettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-2xl mx-auto bg-brand-900 rounded-2xl border border-brand-800 p-8 shadow-xl">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <KeyRound className="text-brand-500" />
        System Configuration
      </h2>

      <div className="bg-blue-950/40 border border-blue-900 p-5 rounded-xl mb-8">
          <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-900/50 rounded-lg shrink-0">
                  <RefreshCw className="text-blue-400" size={20} />
              </div>
              <div>
                  <h3 className="font-bold text-blue-100 text-sm mb-1">Connecting to Live Zerodha API</h3>
                  <p className="text-xs text-blue-300 leading-relaxed mb-3">
                      Zerodha security often blocks direct web requests. We recommend using a CORS browser extension for the most stable experience.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <div className="bg-blue-900/20 p-3 rounded border border-blue-800/50">
                          <h4 className="font-bold text-xs text-white mb-1">Method A: Proxy (Enabled below)</h4>
                          <p className="text-[10px] text-gray-400">
                              Routes requests through public proxy servers.
                          </p>
                      </div>
                      
                      <div className="bg-green-900/10 p-3 rounded border border-green-900/30">
                          <h4 className="font-bold text-xs text-green-400 mb-1">Method B: Direct (Recommended)</h4>
                          <p className="text-[10px] text-gray-400">
                              Requires a browser extension to allow direct connections.
                          </p>
                          <a href="https://chromewebstore.google.com/detail/allow-cors-access-control/lhobafahddgcelffkeicbaginigeejlf" 
                             target="_blank" rel="noreferrer" 
                             className="mt-2 inline-flex items-center gap-1 text-[10px] bg-green-900/30 text-green-300 px-2 py-1 rounded hover:bg-green-900/50 transition-colors">
                              Install Extension <ExternalLink size={8} />
                          </a>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-brand-500 mb-2">Zerodha API Key</label>
          <input
            type="text"
            value={formData.apiKey}
            onChange={(e) => handleChange('apiKey', e.target.value)}
            className="w-full bg-brand-950 text-white rounded-lg px-4 py-3 border border-brand-800 focus:border-brand-500 focus:outline-none transition-colors font-mono"
            placeholder="Kite App Key"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Access Token</label>
          <input
            type="password"
            value={formData.accessToken}
            onChange={(e) => handleChange('accessToken', e.target.value)}
            className="w-full bg-brand-950 text-white rounded-lg px-4 py-3 border border-brand-800 focus:border-brand-500 focus:outline-none transition-colors font-mono"
            placeholder="Kite Session Token"
          />
          <p className="text-xs text-gray-500 mt-1">
             <AlertCircle size={10} className="inline mr-1"/>
             This token expires daily.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Security Passcode</label>
          <div className="relative">
            <input
              type={showPasscode ? "text" : "password"}
              value={formData.passcode}
              onChange={(e) => handleChange('passcode', e.target.value)}
              maxLength={6}
              className="w-full bg-brand-950 text-white rounded-lg px-4 py-3 border border-brand-800 focus:border-brand-500 focus:outline-none transition-colors tracking-widest font-mono"
              placeholder="Set 4-6 digit passcode"
            />
            <button
              onClick={() => setShowPasscode(!showPasscode)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-brand-500"
            >
              {showPasscode ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="flex items-center gap-3 p-4 bg-brand-800/30 rounded-lg border border-brand-800">
                <input
                    type="checkbox"
                    id="liveMode"
                    checked={formData.isLiveMode}
                    onChange={(e) => handleChange('isLiveMode', e.target.checked)}
                    className="w-5 h-5 rounded border-gray-600 text-brand-500 focus:ring-brand-500 bg-brand-950"
                />
                <label htmlFor="liveMode" className="text-sm text-gray-300 font-medium cursor-pointer select-none">
                    Enable Live Data
                </label>
            </div>

            <div className="flex items-center gap-3 p-4 bg-brand-800/30 rounded-lg border border-brand-800">
                <input
                    type="checkbox"
                    id="useProxy"
                    checked={formData.useProxy}
                    onChange={(e) => handleChange('useProxy', e.target.checked)}
                    className="w-5 h-5 rounded border-gray-600 text-brand-500 focus:ring-brand-500 bg-brand-950"
                />
                <label htmlFor="useProxy" className="text-sm text-gray-300 font-medium cursor-pointer select-none flex items-center gap-2">
                    <Globe size={14} />
                    Use CORS Proxy
                </label>
            </div>
        </div>

        <button
          onClick={() => onSave(formData)}
          className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 mt-4"
        >
          <Save size={20} />
          Save & Connect
        </button>
      </div>
    </div>
  );
};
