
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
        // Note: '/orders' typically returns the order book for the current day
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
          const rawOrders = oResult.data || [];
          
          orders = rawOrders.map((o: any) => ({
            id: o.order_id,
            // Use order_timestamp if available, otherwise fallback
            date: o.order_timestamp ? new Date(o.order_timestamp).toLocaleTimeString() + ' ' + new Date(o.order_timestamp).toLocaleDateString() : new Date().toLocaleDateString(),
            rawDate: o.order_timestamp ? new Date(o.order_timestamp) : new Date(),
            symbol: o.tradingsymbol,
            type: o.transaction_type as 'BUY' | 'SELL',
            quantity: o.quantity,
            price: o.average_price || o.price,
            total: (o.average_price || o.price) * o.quantity,
            status: o.status
          }));

          // Sort orders: Newest first
          orders.sort((a: any, b: any) => b.rawDate.getTime() - a.rawDate.getTime());
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

    // Mock Data for Simulation (Consistent with previous total values)
    const mockHoldings: Stock[] = [
      { symbol: 'RELIANCE', name: 'Reliance Industries', quantity: 150, averagePrice: 2350.00, currentPrice: 2475.20, previousClose: 2460, sector: 'Energy' },
      { symbol: 'TCS', name: 'Tata Consultancy Svc', quantity: 45, averagePrice: 3200.00, currentPrice: 3540.00, previousClose: 3500, sector: 'IT' },
      { symbol: 'INFY', name: 'Infosys', quantity: 120, averagePrice: 1450.00, currentPrice: 1380.00, previousClose: 1390, sector: 'IT' },
      { symbol: 'HDFCBANK', name: 'HDFC Bank', quantity: 200, averagePrice: 1480.00, currentPrice: 1610.50, previousClose: 1600, sector: 'Finance' },
      { symbol: 'TATAMOTORS', name: 'Tata Motors', quantity: 300, averagePrice: 420.00, currentPrice: 620.00, previousClose: 610, sector: 'Auto' },
      { symbol: 'ZOMATO', name: 'Zomato Ltd', quantity: 1000, averagePrice: 65.00, currentPrice: 92.00, previousClose: 90, sector: 'Tech' },
    ];
    
    // Calculate exact totals from mock holdings
    const totalValue = mockHoldings.reduce((acc, s) => acc + (s.currentPrice * s.quantity), 0);
    const investedValue = mockHoldings.reduce((acc, s) => acc + (s.averagePrice * s.quantity), 0);
    const dayChange = mockHoldings.reduce((acc, s) => acc + ((s.currentPrice - s.previousClose) * s.quantity), 0);
    
    return {
      totalValue,
      investedValue,
      dayChange,
      dayChangePercentage: (dayChange / (totalValue - dayChange)) * 100,
      totalPnl: totalValue - investedValue,
      totalPnlPercentage: ((totalValue - investedValue) / investedValue) * 100,
      cashBalance: 52000,
      holdings: mockHoldings,
      orders: [
         { id: '10001', date: new Date().toLocaleDateString(), symbol: 'RELIANCE', type: 'BUY', quantity: 10, price: 2450, total: 24500, status: 'COMPLETE' },
         { id: '10002', date: new Date(Date.now() - 86400000).toLocaleDateString(), symbol: 'TCS', type: 'SELL', quantity: 5, price: 3500, total: 17500, status: 'COMPLETE' }
      ]
    };
  },

  async executeTrade(order: TradeOrder, settings: UserSettings, passcode: string): Promise<boolean> {
    // Strict passcode validation
    if (!settings.passcode || passcode !== settings.passcode) {
        throw new Error("Invalid Passcode.");
    }
    
    if (!settings.isLiveMode) {
      // Simulate network delay in mock mode
      await new Promise(resolve => setTimeout(resolve, 1000));
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
  if (!data || !data.length) {
    alert("No data available to export.");
    return;
  }
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
