
import { PortfolioSummary, Stock, TradeOrder, UserSettings } from '../types';

async function fetchWithTimeout(url: string, options: RequestInit, timeout = 12000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') throw new Error("Bridge Request Timed Out (12s). Check if your local server is under heavy load.");
    throw error;
  }
}

export const ZerodhaService = {
  async getPortfolio(settings: UserSettings): Promise<PortfolioSummary> {
    if (settings.isLiveMode) {
      if (!settings.backendUrl) throw new Error("Bridge URL is missing. Go to Settings.");

      let url = settings.backendUrl.trim();
      if (!url.startsWith('http')) url = `http://${url}`;
      if (url.endsWith('/')) url = url.slice(0, -1);

      // MIXED CONTENT CHECK
      const isAppSecure = window.location.protocol === 'https:';
      const isBridgeInsecure = url.startsWith('http:');
      
      if (isAppSecure && isBridgeInsecure && !url.includes('localhost') && !url.includes('127.0.0.1')) {
          throw new Error("SECURE CONNECTION ERROR: Your browser blocks requests from HTTPS (Vercel) to HTTP (Bridge). Please use 'ngrok' to get an HTTPS URL for your bridge, or run this app locally.");
      }

      try {
        console.log(`ZeroGPT: Polling bridge at ${url}/holdings`);
        
        const response = await fetchWithTimeout(`${url}/holdings`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          mode: 'cors'
        }).catch(err => {
          console.error("Bridge Connection Failed", err);
          throw new Error(`CONNECTION FAILED: Could not reach ${url}. 1. Ensure your Node.js script is running. 2. Ensure CORS is enabled in the script. 3. Check for firewall blocks.`);
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`BRIDGE REJECTION (${response.status}): ${errorText || 'Check bridge logs.'}`);
        }

        const result = await response.json();
        
        if (result.status === 'error' || result.error) {
          throw new Error(`ZERODHA API ERROR: ${result.message || result.error}`);
        }

        const holdingsRaw = result.data || [];
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

        return {
          totalValue,
          investedValue,
          dayChange,
          dayChangePercentage: totalValue > 0 ? (dayChange / (totalValue - dayChange)) * 100 : 0,
          totalPnl: totalValue - investedValue,
          totalPnlPercentage: investedValue > 0 ? ((totalValue - investedValue) / investedValue) * 100 : 0,
          cashBalance: 0,
          holdings
        };

      } catch (error: any) {
        throw new Error(error.message);
      }
    }

    // Default Mock Data for Simulation
    return {
      totalValue: 1250000,
      investedValue: 1100000,
      dayChange: 15400,
      dayChangePercentage: 1.25,
      totalPnl: 150000,
      totalPnlPercentage: 13.6,
      cashBalance: 45000,
      holdings: []
    };
  },

  async executeTrade(order: TradeOrder, settings: UserSettings, passcode: string): Promise<boolean> {
    if (passcode !== settings.passcode) throw new Error("Verification Failed: Invalid Passcode.");
    
    if (!settings.isLiveMode) {
      await new Promise(r => setTimeout(r, 1000));
      return true;
    }

    let url = settings.backendUrl.trim();
    if (!url.startsWith('http')) url = `http://${url}`;
    if (url.endsWith('/')) url = url.slice(0, -1);

    try {
      const response = await fetch(`${url}/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      });

      if (!response.ok) throw new Error("Order was rejected by the local bridge server.");
      const result = await response.json();
      if (result.status === 'error' || result.error) throw new Error(result.message || result.error);
      
      return true;
    } catch (error: any) {
      throw new Error(`Trade Execution Failure: ${error.message}`);
    }
  }
};
