
import { PortfolioSummary, Stock, TradeOrder, UserSettings } from '../types';

// Fallback Mock Data
const MOCK_STOCKS: Stock[] = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', quantity: 50, averagePrice: 2400.00, currentPrice: 2980.50, previousClose: 2950.00, sector: 'Energy' },
  { symbol: 'TCS', name: 'Tata Consultancy Svcs', quantity: 20, averagePrice: 4200.00, currentPrice: 4120.10, previousClose: 4150.00, sector: 'IT' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', quantity: 100, averagePrice: 1500.00, currentPrice: 1450.75, previousClose: 1440.00, sector: 'Banking' },
  { symbol: 'ZOMATO', name: 'Zomato Ltd', quantity: 500, averagePrice: 120.00, currentPrice: 185.20, previousClose: 175.00, sector: 'Tech' },
];

/**
 * Helper to fetch with a timeout
 */
async function fetchWithTimeout(url: string, options: RequestInit, timeout = 15000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export const ZerodhaService = {
  async getPortfolio(settings: UserSettings): Promise<PortfolioSummary> {
    if (settings.isLiveMode) {
      if (!settings.apiKey && !settings.backendUrl) throw new Error("Missing Credentials or Backend URL.");
      
      try {
        let finalData: any = null;
        let lastError = "";

        // 1. PRIMARY: User's Custom Node.js Backend
        if (settings.backendUrl) {
            try {
                const cleanUrl = settings.backendUrl.endsWith('/') ? settings.backendUrl.slice(0, -1) : settings.backendUrl;
                // Fetching from the user's provided /holdings endpoint
                const res = await fetchWithTimeout(`${cleanUrl}/holdings`, { method: 'GET' }, 10000);
                if (res.ok) {
                    finalData = await res.json();
                } else {
                    lastError = `Local Backend returned error ${res.status}`;
                }
            } catch (e: any) {
                console.warn("ZeroGPT: Local Backend connection failed", e.message);
                lastError = `Local Backend Unreachable: ${e.message}`;
            }
        }

        // 2. SECONDARY: Public Proxies (Fall back only if no data from primary)
        if (!finalData && settings.useProxy) {
            const targetUrl = 'https://api.kite.trade/portfolio/holdings';
            const kiteHeaders = {
                'Authorization': `token ${settings.apiKey}:${settings.accessToken}`,
                'X-Kite-Version': '3'
            };

            const proxies = [
                { url: `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`, name: 'AllOrigins', type: 'json-wrap' },
                { url: `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`, name: 'CorsProxy.io', type: 'direct' }
            ];

            for (const proxy of proxies) {
                if (finalData) break;
                try {
                    const res = await fetchWithTimeout(proxy.url, {
                        method: 'GET',
                        headers: proxy.type === 'direct' ? kiteHeaders : {}
                    }, 8000);
                    
                    if (res.ok) {
                        const raw = await res.json();
                        if (proxy.type === 'json-wrap' && raw.contents) {
                            const nested = JSON.parse(raw.contents);
                            if (nested.status === 'success') finalData = nested;
                        } else if (raw.status === 'success') {
                            finalData = raw;
                        }
                    }
                } catch (e) {}
            }
        }

        if (!finalData) {
            throw new Error(`Zerodha Connectivity Error: ${lastError || "Could not reach Zerodha via any method."}`);
        }

        // Parse Standard Kite Response
        const holdingsRaw = finalData.data || [];
        const holdings: Stock[] = holdingsRaw.map((h: any) => ({
          symbol: h.tradingsymbol,
          name: h.tradingsymbol,
          quantity: h.quantity,
          averagePrice: h.average_price,
          currentPrice: h.last_price,
          previousClose: h.close_price,
          sector: 'Equity',
        }));

        const totalValue = holdings.reduce((acc, s) => acc + (s.currentPrice * s.quantity), 0);
        const investedValue = holdings.reduce((acc, s) => acc + (s.averagePrice * s.quantity), 0);
        const dayChange = holdings.reduce((acc, s) => acc + ((s.currentPrice - s.previousClose) * s.quantity), 0);
        const dayChangePercentage = totalValue > 0 ? (dayChange / (totalValue - dayChange)) * 100 : 0;
        const totalPnl = totalValue - investedValue;
        const totalPnlPercentage = investedValue > 0 ? (totalPnl / investedValue) * 100 : 0;

        return {
          totalValue,
          investedValue,
          dayChange,
          dayChangePercentage,
          totalPnl,
          totalPnlPercentage,
          cashBalance: 0,
          holdings
        };

      } catch (error: any) {
        console.error("ZeroGPT: Portfolio Sync Failed", error);
        throw error;
      }
    }

    // Simulation Mode
    return {
      totalValue: MOCK_STOCKS.reduce((acc, s) => acc + (s.currentPrice * s.quantity), 0),
      investedValue: MOCK_STOCKS.reduce((acc, s) => acc + (s.averagePrice * s.quantity), 0),
      dayChange: 4500,
      dayChangePercentage: 1.2,
      totalPnl: 15000,
      totalPnlPercentage: 5.4,
      cashBalance: 50000,
      holdings: MOCK_STOCKS
    };
  },

  async executeTrade(order: TradeOrder, settings: UserSettings, passcode: string): Promise<boolean> {
    if (passcode !== settings.passcode) throw new Error("Invalid Security Passcode");
    if (!settings.isLiveMode) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return true;
    }
    
    // For trade execution, we only try the custom backend if provided
    if (settings.backendUrl) {
        const cleanUrl = settings.backendUrl.endsWith('/') ? settings.backendUrl.slice(0, -1) : settings.backendUrl;
        const response = await fetch(`${cleanUrl}/order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order)
        });
        if (!response.ok) throw new Error("Backend Trade Execution Failed");
        return true;
    }
    
    throw new Error("Live trading requires a configured Backend Bridge URL.");
  }
};
