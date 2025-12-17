
import { PortfolioSummary, Stock, TradeOrder, UserSettings } from '../types';

// Fallback Mock Data
const MOCK_STOCKS: Stock[] = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', quantity: 50, averagePrice: 2400.00, currentPrice: 2980.50, previousClose: 2950.00, sector: 'Energy' },
  { symbol: 'TCS', name: 'Tata Consultancy Svcs', quantity: 20, averagePrice: 4200.00, currentPrice: 4120.10, previousClose: 4150.00, sector: 'IT' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', quantity: 100, averagePrice: 1500.00, currentPrice: 1450.75, previousClose: 1440.00, sector: 'Banking' },
  { symbol: 'ZOMATO', name: 'Zomato Ltd', quantity: 500, averagePrice: 120.00, currentPrice: 185.20, previousClose: 175.00, sector: 'Tech' },
];

async function fetchWithTimeout(url: string, options: RequestInit, timeout = 10000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') throw new Error("Request Timed Out. Check if your Bridge is running.");
    throw error;
  }
}

export const ZerodhaService = {
  async getPortfolio(settings: UserSettings): Promise<PortfolioSummary> {
    if (settings.isLiveMode) {
      if (!settings.backendUrl) throw new Error("Backend Bridge URL is required for live mode.");
      
      try {
        const cleanUrl = settings.backendUrl.endsWith('/') ? settings.backendUrl.slice(0, -1) : settings.backendUrl;
        
        console.log(`ZeroGPT: Connecting to bridge at ${cleanUrl}/holdings...`);
        
        let response;
        try {
            response = await fetchWithTimeout(`${cleanUrl}/holdings`, { method: 'GET' });
        } catch (e: any) {
            // This is where "Failed to fetch" usually happens due to missing CORS or server down
            throw new Error(`Local Bridge Unreachable: ${e.message}. Ensure your Node.js script is running on port 3000 and has CORS enabled.`);
        }

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(`Bridge Error (${response.status}): ${errData.message || 'Check your API keys in the bridge console.'}`);
        }

        const data = await response.json();
        
        if (data.status === 'error') {
            throw new Error(`Zerodha API Error: ${data.message}`);
        }

        const holdingsRaw = data.data || [];
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

        return {
          totalValue,
          investedValue,
          dayChange,
          dayChangePercentage,
          totalPnl: totalValue - investedValue,
          totalPnlPercentage: investedValue > 0 ? ((totalValue - investedValue) / investedValue) * 100 : 0,
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
    
    if (settings.backendUrl) {
        const cleanUrl = settings.backendUrl.endsWith('/') ? settings.backendUrl.slice(0, -1) : settings.backendUrl;
        try {
            const response = await fetch(`${cleanUrl}/order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(order)
            });
            if (!response.ok) throw new Error("Bridge rejected the trade request.");
            const result = await response.json();
            if (result.status === 'error') throw new Error(result.message);
            return true;
        } catch (e: any) {
            throw new Error(`Trade Execution Failed: ${e.message}`);
        }
    }
    
    throw new Error("Live trading requires a configured Bridge URL.");
  }
};
