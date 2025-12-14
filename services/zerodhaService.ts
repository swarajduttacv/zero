
import { PortfolioSummary, Stock, TradeOrder, UserSettings } from '../types';

// Fallback Mock Data (Only used if NOT in Live Mode)
const MOCK_STOCKS: Stock[] = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', quantity: 50, averagePrice: 2400.00, currentPrice: 2980.50, previousClose: 2950.00, sector: 'Energy' },
  { symbol: 'TCS', name: 'Tata Consultancy Svcs', quantity: 20, averagePrice: 4200.00, currentPrice: 4120.10, previousClose: 4150.00, sector: 'IT' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', quantity: 100, averagePrice: 1500.00, currentPrice: 1450.75, previousClose: 1440.00, sector: 'Banking' },
  { symbol: 'ZOMATO', name: 'Zomato Ltd', quantity: 500, averagePrice: 120.00, currentPrice: 185.20, previousClose: 175.00, sector: 'Tech' },
];

export const ZerodhaService = {
  // Fetch real portfolio data
  async getPortfolio(settings: UserSettings): Promise<PortfolioSummary> {
    
    // 1. LIVE MODE: Try to fetch from Kite Connect API
    if (settings.isLiveMode) {
      if (!settings.apiKey) {
         throw new Error("Missing 'API Key'. Please enter it in Settings.");
      }
      if (!settings.accessToken) {
         throw new Error("Missing 'Access Token'. Please enter it in Settings.");
      }

      try {
        console.log(`Fetching live holdings...`);
        
        const targetUrl = 'https://api.kite.trade/portfolio/holdings';
        
        // Define proxy list with names for debugging
        const proxies = settings.useProxy ? [
            { url: `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`, name: 'CorsProxy.io' },
            { url: `https://thingproxy.freeboard.io/fetch/${targetUrl}`, name: 'ThingProxy' },
            { url: `https://cors-anywhere.herokuapp.com/${targetUrl}`, name: 'CorsAnywhere (Requires Activation)' }
        ] : [{ url: targetUrl, name: 'Direct Connection' }];

        let response: Response | null = null;
        let successProxy = '';

        for (const proxy of proxies) {
            try {
                console.log(`Attempting connection via: ${proxy.name}`);
                const res = await fetch(proxy.url, {
                    method: 'GET',
                    headers: {
                        'Authorization': `token ${settings.apiKey}:${settings.accessToken}`,
                        'X-Kite-Version': '3'
                    }
                });
                
                // If we get a response (even 4xx), the connection worked
                if (res.ok || res.status === 401 || res.status === 403 || res.status === 400) {
                    response = res;
                    successProxy = proxy.name;
                    break;
                }
            } catch (e) {
                console.warn(`Connection failed via ${proxy.name}`, e);
            }
        }

        if (!response) {
            let msg = "Network Error: Unable to reach Zerodha API.";
            if (settings.useProxy) {
                msg += " All proxies failed. Try disabling 'Use CORS Proxy' and using the 'Allow CORS' browser extension.";
            } else {
                msg += " Direct connection blocked. Please enable the 'Allow CORS' browser extension.";
            }
            throw new Error(msg);
        }

        if (!response.ok) {
          // Handle Authentication Errors explicitly
          if (response.status === 403) {
             throw new Error(`Access Denied (403). Invalid API Key or Access Token.`);
          }
          if (response.status === 401) {
             throw new Error(`Unauthorized (401). Invalid API Key or Access Token.`);
          }
          
          const errText = await response.text();
          console.error("API Error Response:", errText);
          
          // Parse JSON error if possible
          let detailedMsg = errText.substring(0, 100);
          try {
              const errJson = JSON.parse(errText);
              if (errJson.message) detailedMsg = errJson.message;
          } catch(e) {}

          throw new Error(`API Error ${response.status}: ${detailedMsg}`);
        }

        const data = await response.json();
        console.log("Zerodha Data Received:", data);
        
        if (data.status === 'error') {
            throw new Error(data.message || 'Zerodha API returned an error status');
        }

        const holdingsRaw = data.data || [];

        // Map Kite API response to our app structure
        const holdings: Stock[] = holdingsRaw.map((h: any) => ({
          symbol: h.tradingsymbol,
          name: h.tradingsymbol, // Kite doesn't provide full name in this endpoint
          quantity: h.quantity,
          averagePrice: h.average_price,
          currentPrice: h.last_price,
          previousClose: h.close_price,
          sector: 'Equity', // Sector data requires separate mapping/API, defaulting to Equity
        }));

        // Calculate Summary
        const totalValue = holdings.reduce((acc, stock) => acc + (stock.currentPrice * stock.quantity), 0);
        const investedValue = holdings.reduce((acc, stock) => acc + (stock.averagePrice * stock.quantity), 0);
        const dayChange = holdings.reduce((acc, stock) => acc + ((stock.currentPrice - stock.previousClose) * stock.quantity), 0);
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
          cashBalance: 0, // Requires /user/margins endpoint
          holdings
        };

      } catch (error: any) {
        console.error("Zerodha API Fetch Error:", error);
        throw error;
      }
    }

    // 2. MOCK MODE (Fallback if Live Mode is OFF)
    console.warn("Live mode OFF. Using Mock Data.");
    const currentHoldings = [...MOCK_STOCKS];
    const totalValue = currentHoldings.reduce((acc, stock) => acc + (stock.currentPrice * stock.quantity), 0);
    const investedValue = currentHoldings.reduce((acc, stock) => acc + (stock.averagePrice * stock.quantity), 0);
    const dayChange = currentHoldings.reduce((acc, stock) => acc + ((stock.currentPrice - stock.previousClose) * stock.quantity), 0);
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
    if (passcode !== settings.passcode) {
      throw new Error("Invalid Passcode");
    }

    if (settings.isLiveMode) {
         if (!settings.apiKey || !settings.accessToken) {
            throw new Error("Live execution requires API Key and Access Token.");
         }
         
         const targetUrl = 'https://api.kite.trade/orders/regular';
         const proxies = settings.useProxy ? [
            { url: `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`, name: 'CorsProxy.io' },
            { url: `https://thingproxy.freeboard.io/fetch/${targetUrl}`, name: 'ThingProxy' }
         ] : [{ url: targetUrl, name: 'Direct' }];

         // Try proxies for trade
         let response: Response | null = null;
         const formData = new URLSearchParams();
         formData.append('tradingsymbol', order.symbol);
         formData.append('exchange', 'NSE'); // Defaulting to NSE
         formData.append('transaction_type', order.transactionType);
         formData.append('order_type', order.orderType);
         formData.append('quantity', order.quantity.toString());
         formData.append('product', 'CNC'); // Delivery
         formData.append('validity', 'DAY');
         if (order.price) formData.append('price', order.price.toString());

         for (const proxy of proxies) {
             try {
                const res = await fetch(proxy.url, {
                    method: 'POST',
                    headers: {
                        'Authorization': `token ${settings.apiKey}:${settings.accessToken}`,
                        'X-Kite-Version': '3',
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: formData
                });
                if (res.ok || res.status === 400 || res.status === 403) {
                    response = res;
                    break;
                }
             } catch(e) {}
         }

         if (!response) {
             throw new Error("Network Error: Could not reach Zerodha for trade.");
         }
             
         if (!response.ok) {
             const errText = await response.text();
             let errMsg = "Order Failed";
             try {
                 const errJson = JSON.parse(errText);
                 errMsg = errJson.message || errMsg;
             } catch (e) {}
             throw new Error(errMsg);
         }
         return true;
    } else {
        // Mock Trade Execution
        await new Promise(resolve => setTimeout(resolve, 1500));
        return true;
    }
  }
};
