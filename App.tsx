
import React, { useState, useEffect, useCallback } from 'react';
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
      console.error(e);
    } finally {
      setIsAuthChecking(false);
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (!currentUser) return;
    try {
      const data = await ZerodhaService.getPortfolio(currentUser.settings);
      setPortfolio(data);
      if (fetchError) {
        setFetchError(null);
        addNotification("System Connected", "Live portfolio sync active.", "success");
      }
    } catch (error: any) {
      setFetchError(error.message);
      if (!portfolio) setPortfolio({
        totalValue: 0, investedValue: 0, dayChange: 0, dayChangePercentage: 0, totalPnl: 0, totalPnlPercentage: 0, cashBalance: 0, holdings: [], orders: []
      });
    }
  }, [currentUser, fetchError, portfolio, addNotification]);

  useEffect(() => {
    if (currentUser) {
      fetchData();
      const intervalId = setInterval(fetchData, 30000);
      return () => clearInterval(intervalId);
    }
  }, [currentUser, fetchData]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    addNotification("Login Successful", `Welcome back, ${user.name}`);
  };

  const handleLogout = () => {
    AuthService.logout();
    setCurrentUser(null);
    setPortfolio(null);
    setActiveTab('Dashboard');
  };

  const handleSettingsSave = (newSettings: UserSettings) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, settings: newSettings };
      setCurrentUser(updatedUser);
      AuthService.updateUser(updatedUser);
      setPortfolio(null);
      addNotification("Settings Updated", "Configuration saved successfully.");
    }
  };

  const handleMessagesChange = (newMessages: ChatMessage[]) => {
    if (currentUser) {
      AuthService.updateUser({ ...currentUser, chatHistory: newMessages });
    }
  };

  const confirmTrade = async (passcode: string) => {
    if (!pendingOrder || !currentUser) return;
    try {
      await ZerodhaService.executeTrade(pendingOrder, currentUser.settings, passcode);
      setIsTradeModalOpen(false);
      setPendingOrder(null);
      addNotification("Order Executed", `${pendingOrder.transactionType} ${pendingOrder.quantity} ${pendingOrder.symbol} completed.`, "success");
      fetchData();
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
    <div className="min-h-screen flex bg-[#0f172a]">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} />
      
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen relative">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">{activeTab}</h2>
            <p className="text-gray-400 text-sm">
                User: <span className="text-white font-medium">{currentUser.name}</span>
                {currentUser.settings.isLiveMode && <span className="ml-2 text-green-500">● Live</span>}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-gray-400 hover:text-white transition-colors relative"
              >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0f172a]"></span>
                  )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-brand-900 border border-brand-800 rounded-2xl shadow-2xl z-50 overflow-hidden">
                  <div className="p-4 border-b border-brand-800 flex justify-between items-center">
                    <span className="font-bold text-white text-sm">Notifications</span>
                    <button onClick={() => setShowNotifications(false)}><X size={14} className="text-gray-500" /></button>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-xs text-gray-500">No recent activity.</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className="p-4 border-b border-brand-800/50 hover:bg-brand-800/30 transition-colors">
                          <div className="text-xs font-bold text-white">{n.title}</div>
                          <div className="text-[11px] text-gray-400 mt-1">{n.message}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-500 to-purple-500 border-2 border-brand-800 flex items-center justify-center font-bold text-white uppercase">
                {currentUser.name.charAt(0)}
            </div>
          </div>
        </div>

        {fetchError && activeTab === 'Dashboard' && (
          <div className="mb-6 p-4 bg-red-900/10 border border-red-900/30 rounded-xl flex items-start gap-3">
              <AlertCircle className="text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                  <h3 className="text-red-500 font-bold text-sm">Connection Issue</h3>
                  <p className="text-red-200/70 text-sm mt-1">Could not sync with Bridge server. Showing cached or simulation data.</p>
              </div>
          </div>
        )}

        <div className="max-w-6xl mx-auto space-y-6">
          {activeTab === 'Dashboard' && portfolio && (
            <>
                <DashboardStats portfolio={portfolio} />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <ChatInterface 
                            portfolio={portfolio} 
                            onTradeRequest={(o) => {setPendingOrder(o); setIsTradeModalOpen(true);}} 
                            messages={currentUser.chatHistory || []}
                            onMessagesChange={handleMessagesChange}
                        />
                    </div>
                    <div className="bg-brand-900 rounded-2xl border border-brand-800 p-6 h-fit">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-white">Top Portfolio</h3>
                            <ShieldCheck className="text-brand-500" size={18} />
                        </div>
                        <div className="space-y-4">
                            {portfolio.holdings.slice(0, 5).map((stock) => (
                                <div key={stock.symbol} className="flex justify-between items-center p-3 hover:bg-brand-800/50 rounded-xl transition-colors">
                                    <div>
                                        <div className="font-medium text-white">{stock.symbol}</div>
                                        <div className="text-xs text-gray-500">{stock.quantity} Qty</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-medium text-white">₹{(stock.currentPrice * stock.quantity).toLocaleString()}</div>
                                        <div className={`text-xs ${stock.currentPrice >= stock.averagePrice ? 'text-profit' : 'text-loss'}`}>
                                            {((stock.currentPrice-stock.averagePrice)/stock.averagePrice*100).toFixed(2)}%
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </>
          )}

          {activeTab === 'Holdings' && portfolio && <HoldingsView portfolio={portfolio} />}
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
