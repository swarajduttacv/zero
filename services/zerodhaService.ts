
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
async function fetchWithTimeout(url: string, options: RequestInit, timeout = 10000): Promise<Response> {
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
      if (!settings.apiKey) throw new Error("Missing 'API Key'.");
      if (!settings.accessToken) throw new Error("Missing 'Access Token'.");

      try {
        const targetUrl = 'https://api.kite.trade/portfolio/holdings';
        const proxies = settings.useProxy ? [
            { url: `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`, name: 'CorsProxy.io' },
            { url: `https://thingproxy.freeboard.io/fetch/${targetUrl}`, name: 'ThingProxy' }
        ] : [{ url: targetUrl, name: 'Direct Connection' }];

        let response: Response | null = null;

        for (const proxy of proxies) {
            try {
                console.log(`Connecting via ${proxy.name}...`);
                const res = await fetchWithTimeout(proxy.url, {
                    method: 'GET',
                    headers: {
                        'Authorization': `token ${settings.apiKey}:${settings.accessToken}`,
                        'X-Kite-Version': '3'
                    }
                }, 8000); // 8 second timeout per proxy
                
                if (res.ok || res.status < 500) {
                    response = res;
                    break;
                }
            } catch (e) {
                console.warn(`Connection failed via ${proxy.name}`, e);
            }
        }

        if (!response) {
            throw new Error("Connectivity Issue: All connection attempts timed out or were blocked.");
        }

        if (!response.ok) {
          const errText = await response.text();
          let detailedMsg = `Server Error ${response.status}`;
          try {
              const errJson = JSON.parse(errText);
              detailedMsg = errJson.message || detailedMsg;
          } catch(e) {}
          throw new Error(detailedMsg);
        }

        const data = await response.json();
        if (data.status === 'error') throw new Error(data.message);

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
        console.error("Zerodha Sync Failed:", error);
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
    if (passcode !== settings.passcode) throw new Error("Invalid Passcode");

    if (settings.isLiveMode) {
         if (!settings.apiKey || !settings.accessToken) throw new Error("Live execution requires credentials.");
         
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
         }, 10000);

         if (!response.ok) {
             const errText = await response.text();
             let msg = "Order Failed";
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
