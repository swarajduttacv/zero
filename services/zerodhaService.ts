
import { PortfolioSummary, Stock, TradeOrder, UserSettings, Transaction } from '../types';

async function fetchWithTimeout(url: string, options: RequestInit, timeout = 10000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') throw new Error("Connection Timeout. Is your Bridge server running?");
    throw error;
  }
}

export const ZerodhaService = {
  async getPortfolio(settings: UserSettings): Promise<PortfolioSummary> {
    if (settings.isLiveMode) {
      if (!settings.backendUrl) throw new Error("Bridge URL is missing. Go to Settings.");

      let baseUrl = settings.backendUrl.trim();
      if (!baseUrl.startsWith('http')) baseUrl = `http://${baseUrl}`;
      if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);

      try {
        // Parallel fetch for holdings and orders
        const [holdingsRes, ordersRes] = await Promise.all([
          fetchWithTimeout(`${baseUrl}/holdings`, { method: 'GET', headers: { 'Accept': 'application/json' }, mode: 'cors' }),
          fetchWithTimeout(`${baseUrl}/orders`, { method: 'GET', headers: { 'Accept': 'application/json' }, mode: 'cors' }).catch(() => null)
        ]);

        if (!holdingsRes.ok) {
          throw new Error(`Bridge Error: ${holdingsRes.status}`);
        }

        const hResult = await holdingsRes.json();
        const holdingsRaw = hResult.data || [];
        
        let orders: Transaction[] = [];
        if (ordersRes && ordersRes.ok) {
          const oResult = await ordersRes.json();
          orders = (oResult.data || []).map((o: any) => ({
            id: o.order_id,
            date: o.order_timestamp ? new Date(o.order_timestamp).toLocaleDateString() : new Date().toLocaleDateString(),
            symbol: o.tradingsymbol,
            type: o.transaction_type as 'BUY' | 'SELL',
            quantity: o.quantity,
            price: o.average_price || o.price,
            total: (o.average_price || o.price) * o.quantity,
            status: o.status
          }));
        }

        const holdings: Stock[] = holdingsRaw.map((h: any) => ({
          symbol: h.tradingsymbol,
          name: h.tradingsymbol,
          quantity: h.quantity,
          averagePrice: h.average_price,
          currentPrice: h.last_price,
          previousClose: h.close_price,
          sector: h.sector || 'Equity',
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
          holdings,
          orders
        };
      } catch (error: any) {
        throw new Error(`Sync Failed: ${error.message}`);
      }
    }

    // Mock Data for Simulation
    return {
      totalValue: 842000,
      investedValue: 710000,
      dayChange: 12400,
      dayChangePercentage: 1.49,
      totalPnl: 132000,
      totalPnlPercentage: 18.59,
      cashBalance: 52000,
      holdings: [],
      orders: []
    };
  },

  async executeTrade(order: TradeOrder, settings: UserSettings, passcode: string): Promise<boolean> {
    if (passcode !== settings.passcode) throw new Error("Invalid Passcode.");
    
    if (!settings.isLiveMode) {
      return true;
    }

    let url = settings.backendUrl.trim();
    if (!url.startsWith('http')) url = `http://${url}`;
    if (url.endsWith('/')) url = url.slice(0, -1);

    const response = await fetch(`${url}/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });

    if (!response.ok) throw new Error("Bridge rejected the order.");
    return true;
  }
};

export const exportToCSV = (data: any[], filename: string) => {
  if (!data.length) return;
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(obj => Object.values(obj).join(',')).join('\n');
  const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
