
import React, { useState, useEffect } from 'react';
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
import { Bell, AlertCircle, ShieldCheck } from 'lucide-react';
import { PortfolioSummary, TradeOrder, UserSettings, User, ChatMessage } from './types';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  // Trade Modal State
  const [pendingOrder, setPendingOrder] = useState<TradeOrder | null>(null);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);

  // Initial Auth Check
  useEffect(() => {
    try {
      const user = AuthService.getCurrentUser();
      if (user) {
        setCurrentUser(user);
      }
    } catch (e) {
      console.error("Auth check failed:", e);
    } finally {
      setIsAuthChecking(false);
    }
  }, []);

  // Poll Portfolio Data
  useEffect(() => {
    if (!currentUser) return;

    const fetchData = async () => {
      setFetchError(null);
      try {
        const data = await ZerodhaService.getPortfolio(currentUser.settings);
        setPortfolio(data);
      } catch (error: any) {
        console.error("Failed to fetch portfolio data", error);
        setFetchError(error.message);
        if (!portfolio) setPortfolio(null); 
      }
    };

    fetchData();
    let intervalId: any;

    if (currentUser.settings.isLiveMode) {
      intervalId = setInterval(fetchData, 15000); // 15s polling for stability
    }

    return () => clearInterval(intervalId);
  }, [currentUser?.id, currentUser?.settings.isLiveMode, currentUser?.settings.apiKey, currentUser?.settings.accessToken]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
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
      alert("Settings Saved!");
    }
  };
  
  const handleSwitchToDemo = () => {
      if (currentUser) {
          const updatedUser = { 
              ...currentUser, 
              settings: { ...currentUser.settings, isLiveMode: false } 
          };
          setCurrentUser(updatedUser);
          AuthService.updateUser(updatedUser);
          setFetchError(null);
          ZerodhaService.getPortfolio({ ...currentUser.settings, isLiveMode: false }).then(setPortfolio);
      }
  };

  const handleMessagesChange = (newMessages: ChatMessage[]) => {
      if (currentUser) {
          const updatedUser = { ...currentUser, chatHistory: newMessages };
          setCurrentUser(updatedUser);
          AuthService.updateUser(updatedUser);
      }
  };

  const initiateTrade = (order: TradeOrder) => {
    setPendingOrder(order);
    setIsTradeModalOpen(true);
  };

  const confirmTrade = async (passcode: string) => {
    if (!pendingOrder || !currentUser) return;
    try {
      await ZerodhaService.executeTrade(pendingOrder, currentUser.settings, passcode);
      setIsTradeModalOpen(false);
      setPendingOrder(null);
      alert("Trade Executed Successfully!");
      const data = await ZerodhaService.getPortfolio(currentUser.settings);
      setPortfolio(data);
    } catch (error: any) {
       alert(error.message);
    }
  };

  // 1. Critical Loading State
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center flex-col gap-4 text-white">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 font-medium animate-pulse">Checking Authorization...</p>
      </div>
    );
  }

  // 2. Auth Gate
  if (!currentUser) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  // 3. Initial Data Loading (After Login)
  if (!portfolio && !fetchError) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center flex-col gap-4 text-white">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 font-medium">Synchronizing Portfolio Data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#0f172a]">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} />
      
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
               {activeTab === 'Settings' ? 'System Configuration' : activeTab}
            </h2>
            <p className="text-gray-400 text-sm">
                Active User: <span className="text-white font-medium">{currentUser.name}</span>
                {currentUser.settings.isLiveMode && <span className="ml-2 text-green-500 inline-flex items-center gap-1">● Live</span>}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-400 hover:text-white transition-colors relative">
                <Bell size={20} />
                <span className="absolute top-1.5 right-2 w-2 h-2 bg-brand-accent rounded-full border-2 border-[#0f172a]"></span>
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-500 to-purple-500 border-2 border-brand-800 flex items-center justify-center font-bold text-white">
                {currentUser.name.charAt(0)}
            </div>
          </div>
        </div>

        {fetchError && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-900 rounded-xl flex items-start gap-3">
                <AlertCircle className="text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                    <h3 className="text-red-500 font-bold text-sm">Connection Error</h3>
                    <p className="text-red-400 text-sm mt-1 mb-3">{fetchError}</p>
                    <div className="flex flex-wrap gap-3">
                        <button onClick={() => setActiveTab('Settings')} className="text-xs bg-brand-900 border border-brand-700 text-white px-3 py-1.5 rounded hover:bg-brand-800 transition-colors">
                            Check API Settings
                        </button>
                        <button onClick={handleSwitchToDemo} className="text-xs bg-brand-500 text-white px-3 py-1.5 rounded hover:bg-brand-600 transition-colors shadow-lg shadow-brand-500/20">
                            Switch to Simulation Mode
                        </button>
                    </div>
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
                            onTradeRequest={initiateTrade} 
                            messages={currentUser.chatHistory}
                            onMessagesChange={handleMessagesChange}
                        />
                    </div>

                    <div className="bg-brand-900 rounded-2xl border border-brand-800 p-6 h-fit">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-white">Top Holdings</h3>
                            <ShieldCheck className="text-brand-500" size={18} />
                        </div>
                        {portfolio.holdings.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 text-sm">
                                <p>No holdings found.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {portfolio.holdings
                                .sort((a, b) => (b.currentPrice * b.quantity) - (a.currentPrice * a.quantity))
                                .slice(0, 5)
                                .map((stock) => {
                                    const pnl = (stock.currentPrice - stock.averagePrice) * stock.quantity;
                                    const pnlPercent = stock.averagePrice > 0 
                                      ? ((stock.currentPrice - stock.averagePrice) / stock.averagePrice) * 100
                                      : 0;
                                    return (
                                    <div key={stock.symbol} className="flex justify-between items-center p-3 hover:bg-brand-800/50 rounded-xl transition-colors cursor-pointer group">
                                        <div>
                                        <div className="font-medium text-white group-hover:text-brand-500 transition-colors">{stock.symbol}</div>
                                        <div className="text-xs text-gray-500">{stock.quantity} units</div>
                                        </div>
                                        <div className="text-right">
                                        <div className="text-sm font-medium text-white">
                                            ₹{(stock.currentPrice * stock.quantity).toLocaleString('en-IN')}
                                        </div>
                                        <div className={`text-xs font-medium ${pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                                            {pnlPercent.toFixed(2)}%
                                        </div>
                                        </div>
                                    </div>
                                    );
                                })}
                            </div>
                        )}
                        <button onClick={() => setActiveTab('Holdings')} className="w-full mt-6 py-2 text-sm text-brand-500 font-medium hover:bg-brand-800/50 rounded-lg transition-colors">
                            View All Holdings
                        </button>
                    </div>
                </div>
            </>
          )}

          {activeTab === 'Holdings' && portfolio && <HoldingsView portfolio={portfolio} />}
          {activeTab === 'Analytics' && portfolio && <AnalyticsView portfolio={portfolio} />}
          {activeTab === 'Reports' && <ReportsView />}
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
