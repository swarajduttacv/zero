import { PortfolioSummary, Stock, TradeOrder, UserSettings } from '../types';

async function fetchWithTimeout(url: string, options: RequestInit, timeout = 10000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    throw error;
  }
}

export const ZerodhaService = {
  async getPortfolio(settings: UserSettings): Promise<PortfolioSummary> {
    if (settings.isLiveMode) {
      if (!settings.backendUrl) throw new Error("Local Bridge URL not configured. Go to Settings.");

      let url = settings.backendUrl.trim();
      if (!url.startsWith('http')) url = `http://${url}`;
      if (url.endsWith('/')) url = url.slice(0, -1);

      try {
        console.log(`Connecting to Bridge: ${url}/holdings`);
        
        const response = await fetchWithTimeout(`${url}/holdings`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        }).catch(err => {
          if (err.name === 'AbortError') throw new Error("Connection Timed Out. Is the bridge running?");
          throw new Error("Failed to Connect. Ensure your Node.js bridge has CORS enabled and is running on this port.");
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Bridge Error (${response.status}): ${errorText || 'Check bridge console.'}`);
        }

        const data = await response.json();
        
        // Handle potential error envelopes from Zerodha passed through bridge
        if (data.status === 'error') {
          throw new Error(`Zerodha API: ${data.message}`);
        }

        const holdingsRaw = data.data || [];
        const holdings: Stock[] = holdingsRaw.map((h: any) => ({
          symbol: h.tradingsymbol,
          name: h.tradingsymbol,
          quantity: h.quantity,
          averagePrice: h.average_price,
          currentPrice: h.last_price,
          previousClose: h.close_price,
          sector: 'Equity', // Sector is not always returned in holdings LTP
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

    // Mock data for simulation mode
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
    if (passcode !== settings.passcode) throw new Error("Incorrect Security Passcode.");
    
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

      if (!response.ok) throw new Error("Order rejected by local bridge.");
      const result = await response.json();
      if (result.status === 'error') throw new Error(result.message);
      
      return true;
    } catch (error: any) {
      throw new Error(`Trade Failed: ${error.message}`);
    }
  }
};