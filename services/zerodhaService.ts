
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
      if (!settings.apiKey) throw new Error("Missing 'API Key'. Please check your settings.");
      if (!settings.accessToken) throw new Error("Missing 'Access Token'. Please check your settings.");

      try {
        const targetUrl = 'https://api.kite.trade/portfolio/holdings';
        
        // Define a broader set of proxies for better connectivity
        const proxies = settings.useProxy ? [
            { url: `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`, name: 'AllOrigins', type: 'json-wrap' },
            { url: `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`, name: 'CorsProxy.io', type: 'direct' },
            { url: `https://api.codetabs.com/v1/proxy?quest=${targetUrl}`, name: 'Codetabs', type: 'direct' }
        ] : [{ url: targetUrl, name: 'Direct Connection', type: 'direct' }];

        let finalData: any = null;
        let lastError = "";

        for (const proxy of proxies) {
            try {
                console.log(`ZeroGPT: Attempting sync via ${proxy.name}...`);
                const res = await fetchWithTimeout(proxy.url, {
                    method: 'GET',
                    headers: proxy.type === 'direct' ? {
                        'Authorization': `token ${settings.apiKey}:${settings.accessToken}`,
                        'X-Kite-Version': '3'
                    } : {} // AllOrigins doesn't forward headers easily in the simple URL format, but we'll try
                }, 12000);
                
                if (res.ok) {
                    const raw = await res.json();
                    if (proxy.type === 'json-wrap') {
                        // AllOrigins wraps the result in a 'contents' string which we need to parse
                        if (raw.contents) {
                             const nestedData = JSON.parse(raw.contents);
                             if (nestedData.status === 'success') {
                                 finalData = nestedData;
                                 break;
                             }
                        }
                    } else if (raw.status === 'success') {
                        finalData = raw;
                        break;
                    }
                } else {
                    lastError = `Proxy ${proxy.name} returned status ${res.status}`;
                }
            } catch (e: any) {
                console.warn(`ZeroGPT: Connection failed via ${proxy.name}`, e.message);
                lastError = e.message;
            }
        }

        if (!finalData) {
            throw new Error(`Connectivity Blocked: Zerodha API is not reachable through available proxies. Last error: ${lastError}. Try using a CORS browser extension.`);
        }

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
        console.error("ZeroGPT: Zerodha Sync Failed:", error);
        throw error;
      }
    }

    // Mock Mode
    const currentHoldings = [...MOCK_STOCKS];
    const totalValue = currentHoldings.reduce((acc, s) => acc + (s.currentPrice * s.quantity), 0);
    const investedValue = currentHoldings.reduce((acc, s) => acc + (s.averagePrice * s.quantity), 0);
    const dayChange = currentHoldings.reduce((acc, s) => acc + ((s.currentPrice - s.previousClose) * s.quantity), 0);
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
      cashBalance: 50000,
      holdings: currentHoldings
    };
  },

  async executeTrade(order: TradeOrder, settings: UserSettings, passcode: string): Promise<boolean> {
    if (passcode !== settings.passcode) throw new Error("Invalid Security Passcode");

    if (settings.isLiveMode) {
         if (!settings.apiKey || !settings.accessToken) throw new Error("Live execution requires valid credentials.");
         
         const targetUrl = 'https://api.kite.trade/orders/regular';
         const proxyUrl = settings.useProxy ? `https://corsproxy.io/?${encodeURIComponent(targetUrl)}` : targetUrl;

         const formData = new URLSearchParams();
         formData.append('tradingsymbol', order.symbol);
         formData.append('exchange', 'NSE');
         formData.append('transaction_type', order.transactionType);
         formData.append('order_type', order.orderType);
         formData.append('quantity', order.quantity.toString());
         formData.append('product', 'CNC');
         formData.append('validity', 'DAY');
         if (order.price) formData.append('price', order.price.toString());

         const response = await fetchWithTimeout(proxyUrl, {
            method: 'POST',
            headers: {
                'Authorization': `token ${settings.apiKey}:${settings.accessToken}`,
                'X-Kite-Version': '3',
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData
         }, 15000);

         if (!response.ok) {
             const errText = await response.text();
             let msg = "Order Execution Failed";
             try { msg = JSON.parse(errText).message || msg; } catch (e) {}
             throw new Error(msg);
         }
         return true;
    } else {
        await new Promise(resolve => setTimeout(resolve, 1500));
        return true;
    }
  }
};
