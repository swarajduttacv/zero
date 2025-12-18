
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { DashboardStats } from './components/DashboardStats';
import { ChatInterface } from './components/ChatInterface';
import { ZerodhaService } from './services/zerodhaService';
import { TradeModal } from './components/TradeModal';
import { SettingsView } from './components/SettingsView';
import { HoldingsView } from './components/HoldingsView';
import { AnalyticsView } from './components/AnalyticsView';
import { ReportsView } from './components/ReportsView';
import { AuthScreen } from './components/AuthScreen';
import { AuthService } from './services/authService';
import { Bell, AlertCircle, ShieldCheck, X } from 'lucide-react';
import { PortfolioSummary, TradeOrder, UserSettings, User, ChatMessage, Notification } from './types';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const [pendingOrder, setPendingOrder] = useState<TradeOrder | null>(null);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);

  // Use a ref for the error state to avoid re-triggering effects during sync logic
  const errorRef = useRef<string | null>(null);

  const addNotification = useCallback((title: string, message: string, type: Notification['type'] = 'info') => {
    const newNote: Notification = {
      id: Date.now().toString(),
      title,
      message,
      type,
      timestamp: new Date(),
      read: false
    };
    setNotifications(prev => [newNote, ...prev].slice(0, 10));
  }, []);

  useEffect(() => {
    try {
      const user = AuthService.getCurrentUser();
      if (user) setCurrentUser(user);
    } catch (e) {
      console.error("Auth initialization failed:", e);
    } finally {
      setIsAuthChecking(false);
    }
  }, []);

  // Decoupled fetching logic to prevent infinite render loops
  const syncPortfolio = useCallback(async (user: User) => {
    try {
      const data = await ZerodhaService.getPortfolio(user.settings);
      setPortfolio(data);
      
      // Notify only if we just recovered from an error
      if (errorRef.current) {
        addNotification("System Connected", "Portfolio successfully synced with Kite.", "success");
        errorRef.current = null;
        setFetchError(null);
      }
    } catch (error: any) {
      const msg = error.message;
      // Only update state if the error message actually changed to avoid unnecessary re-renders
      if (errorRef.current !== msg) {
        errorRef.current = msg;
        setFetchError(msg);
      }
      
      // Provide a minimal valid state if none exists to keep UI alive
      setPortfolio(prev => prev || {
        totalValue: 0, investedValue: 0, dayChange: 0, dayChangePercentage: 0, totalPnl: 0, totalPnlPercentage: 0, cashBalance: 0, holdings: [], orders: []
      });
    }
  }, [addNotification]);

  useEffect(() => {
    if (currentUser) {
      // Initial fetch
      syncPortfolio(currentUser);
      
      // Polling setup - depends only on currentUser stability
      const intervalId = setInterval(() => syncPortfolio(currentUser), 30000);
      return () => clearInterval(intervalId);
    }
  }, [currentUser, syncPortfolio]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    addNotification("Login Successful", `Welcome back, ${user.name}`);
  };

  const handleLogout = () => {
    AuthService.logout();
    setCurrentUser(null);
    setPortfolio(null);
    setActiveTab('Dashboard');
    errorRef.current = null;
    setFetchError(null);
  };

  const handleSettingsSave = (newSettings: UserSettings) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, settings: newSettings };
      setCurrentUser(updatedUser); // Update state
      AuthService.updateUser(updatedUser); // Update storage
      addNotification("Settings Updated", "Configuration saved successfully.");
      // Trigger immediate re-sync with new settings
      syncPortfolio(updatedUser);
    }
  };

  const handleMessagesChange = (newMessages: ChatMessage[]) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, chatHistory: newMessages };
      setCurrentUser(updatedUser); // Update state immediately
      AuthService.updateUser(updatedUser); // Persist to storage
    }
  };

  const confirmTrade = async (passcode: string) => {
    if (!pendingOrder || !currentUser) return;
    try {
      await ZerodhaService.executeTrade(pendingOrder, currentUser.settings, passcode);
      setIsTradeModalOpen(false);
      setPendingOrder(null);
      addNotification("Order Executed", `${pendingOrder.transactionType} ${pendingOrder.quantity} ${pendingOrder.symbol} completed.`, "success");
      syncPortfolio(currentUser);
    } catch (error: any) {
       addNotification("Trade Failed", error.message, "error");
       throw error;
    }
  };

  if (isAuthChecking) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center flex-col gap-4 text-white">
      <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!currentUser) return <AuthScreen onLogin={handleLogin} />;

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen flex bg-[#0f172a] text-slate-200">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} />
      
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen relative scroll-smooth">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">{activeTab}</h2>
            <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">User:</span>
                <span className="text-white font-medium">{currentUser.name}</span>
                {currentUser.settings.isLiveMode && (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 bg-green-900/20 border border-green-800/30 rounded-full text-[10px] text-green-400 font-bold uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    Live
                  </span>
                )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-gray-400 hover:text-white transition-colors relative focus:outline-none"
              >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0f172a]"></span>
                  )}
              </button>

              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
                  <div className="absolute right-0 mt-2 w-80 bg-brand-900 border border-brand-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right">
                    <div className="p-4 border-b border-brand-800 flex justify-between items-center bg-brand-800/30">
                      <span className="font-bold text-white text-sm">Notifications</span>
                      <button onClick={() => setShowNotifications(false)} className="p-1 hover:bg-brand-700 rounded-md transition-colors">
                        <X size={14} className="text-gray-500" />
                      </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-xs text-gray-500 italic">No recent activity.</div>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} className="p-4 border-b border-brand-800/50 hover:bg-brand-800/30 transition-colors cursor-default">
                            <div className="flex justify-between items-start mb-1">
                              <span className={`text-[10px] font-bold uppercase tracking-widest ${
                                n.type === 'success' ? 'text-green-500' : 
                                n.type === 'error' ? 'text-red-500' : 'text-brand-500'
                              }`}>
                                {n.type}
                              </span>
                              <span className="text-[9px] text-gray-600">
                                {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className="text-xs font-bold text-white">{n.title}</div>
                            <div className="text-[11px] text-gray-400 mt-1 line-clamp-2">{n.message}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-500 to-purple-500 border-2 border-brand-800 flex items-center justify-center font-bold text-white uppercase shadow-lg select-none">
                {currentUser.name.charAt(0)}
            </div>
          </div>
        </div>

        {fetchError && (
          <div className="mb-6 p-4 bg-red-900/10 border border-red-900/30 rounded-xl flex items-start gap-3 animate-in slide-in-from-top duration-300">
              <AlertCircle className="text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                  <h3 className="text-red-500 font-bold text-sm">Sync Status</h3>
                  <p className="text-red-200/70 text-sm mt-1">{fetchError} Running in Simulation Mode.</p>
              </div>
          </div>
        )}

        <div className="max-w-6xl mx-auto space-y-6">
          {activeTab === 'Dashboard' && portfolio && (
            <div className="animate-in fade-in duration-500">
                <DashboardStats portfolio={portfolio} />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 h-[600px]">
                        <ChatInterface 
                            portfolio={portfolio} 
                            onTradeRequest={(o) => {setPendingOrder(o); setIsTradeModalOpen(true);}} 
                            messages={currentUser.chatHistory || []}
                            onMessagesChange={handleMessagesChange}
                            apiKey={currentUser.settings.apiKey}
                        />
                    </div>
                    <div className="bg-brand-900 rounded-2xl border border-brand-800 p-6 h-fit shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-white text-lg">Top Allocation</h3>
                            <ShieldCheck className="text-brand-500" size={20} />
                        </div>
                        <div className="space-y-3">
                            {portfolio.holdings.length === 0 ? (
                                <div className="py-10 text-center text-gray-600 text-sm italic">
                                  No holdings found.
                                </div>
                            ) : (
                              portfolio.holdings.slice(0, 8).map((stock) => (
                                <div key={stock.symbol} className="flex justify-between items-center p-3 hover:bg-brand-800/50 rounded-xl transition-all border border-transparent hover:border-brand-800">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-brand-800 flex items-center justify-center text-[10px] font-bold text-brand-500">
                                          {stock.symbol.slice(0, 2)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-white text-sm">{stock.symbol}</div>
                                            <div className="text-[10px] text-gray-500 font-mono">{stock.quantity} Units</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-white">₹{(stock.currentPrice * stock.quantity).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                                        <div className={`text-[10px] font-bold ${stock.currentPrice >= stock.averagePrice ? 'text-profit' : 'text-loss'}`}>
                                            {stock.currentPrice >= stock.averagePrice ? '▲' : '▼'} {Math.abs(((stock.currentPrice-stock.averagePrice)/stock.averagePrice*100)).toFixed(2)}%
                                        </div>
                                    </div>
                                </div>
                              ))
                            )}
                        </div>
                        {portfolio.holdings.length > 8 && (
                          <button onClick={() => setActiveTab('Holdings')} className="w-full mt-4 text-center py-2 text-xs font-bold text-brand-500 hover:text-brand-400 transition-colors">
                            View All Holdings
                          </button>
                        )}
                    </div>
                </div>
            </div>
          )}

          {activeTab === 'Holdings' && portfolio && <HoldingsView portfolio={portfolio} onSwitchToDashboard={() => setActiveTab('Dashboard')} onRequestAnalysis={(msg) => handleMessagesChange([...(currentUser.chatHistory || []), {id: Date.now().toString(), role: 'user', content: msg, timestamp: new Date()}])} />}
          {activeTab === 'Analytics' && portfolio && <AnalyticsView portfolio={portfolio} />}
          {activeTab === 'Reports' && <ReportsView portfolio={portfolio} />}
          {activeTab === 'Settings' && <SettingsView settings={currentUser.settings} onSave={handleSettingsSave} />}
        </div>
      </main>

      {pendingOrder && (
          <TradeModal 
            order={pendingOrder}
            isOpen={isTradeModalOpen}
            onCancel={() => { setIsTradeModalOpen(false); setPendingOrder(null); }}
            onConfirm={confirmTrade}
          />
      )}
    </div>
  );
};

export default App;
