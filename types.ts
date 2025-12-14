
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
  apiKey: string;
  apiSecret: string;
  accessToken: string; // Added access token
  passcode: string;
  isLiveMode: boolean;
  useProxy: boolean; // Added toggle for CORS proxy
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // In a real app, never store plain text
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
}
