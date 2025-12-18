
export interface Stock {
  symbol: string;
  name: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  previousClose: number;
  sector: string;
}

export interface PortfolioSummary {
  totalValue: number;
  investedValue: number;
  dayChange: number;
  dayChangePercentage: number;
  totalPnl: number;
  totalPnlPercentage: number;
  cashBalance: number;
  holdings: Stock[];
  orders?: Transaction[];
}

export interface ChartDataPoint {
  label: string;
  value: number;
  [key: string]: any;
}

export interface AIResponseVisuals {
  type: 'bar' | 'pie' | 'line' | 'none';
  title: string;
  data: ChartDataPoint[];
  yAxisLabel?: string;
}

export interface AIMessageResponse {
  analysis: string; // Markdown supported
  visuals?: AIResponseVisuals;
  tradeProposal?: TradeOrder; // If the AI suggests a trade
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  visuals?: AIResponseVisuals;
  tradeProposal?: TradeOrder;
  timestamp: Date;
  isThinking?: boolean;
}

export type TransactionType = 'BUY' | 'SELL';
export type OrderType = 'MARKET' | 'LIMIT';

export interface TradeOrder {
  symbol: string;
  transactionType: TransactionType;
  quantity: number;
  orderType: OrderType;
  price?: number;
}

export interface UserSettings {
  geminiApiKey: string; // Specific for Google GenAI
  kiteApiKey: string;   // Specific for Zerodha Kite
  apiSecret: string;
  accessToken: string;
  passcode: string;
  isLiveMode: boolean;
  useProxy: boolean;
  backendUrl: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  settings: UserSettings;
  chatHistory: ChatMessage[];
}

export interface Transaction {
  id: string;
  date: string;
  symbol: string;
  type: TransactionType;
  quantity: number;
  price: number;
  total: number;
  status?: string;
}
