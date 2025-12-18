
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, TrendingUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage, PortfolioSummary, TradeOrder } from '../types';
import { analyzePortfolio } from '../services/geminiService';
import { VisualChart } from './VisualChart';

interface Props {
  portfolio: PortfolioSummary;
  onTradeRequest: (order: TradeOrder) => void;
  messages: ChatMessage[];
  onMessagesChange: (messages: ChatMessage[]) => void;
  apiKey?: string;
}

export const ChatInterface: React.FC<Props> = ({ portfolio, onTradeRequest, messages, onMessagesChange, apiKey }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMsg];
    onMessagesChange(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Pass the apiKey prop (from user settings) as a fallback
      const response = await analyzePortfolio(portfolio, userMsg.content, apiKey);
      
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.analysis,
        visuals: response.visuals,
        tradeProposal: response.tradeProposal,
        timestamp: new Date(),
      };

      onMessagesChange([...newMessages, aiMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble connecting to the network right now. Please try again.",
        timestamp: new Date()
      };
      onMessagesChange([...newMessages, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = [
    "Analyze my risk exposure",
    "Which stocks are underperforming?",
    "Sell 10 TCS",
    "Buy 50 ZOMATO"
  ];

  return (
    <div className="flex flex-col h-[600px] bg-brand-900 rounded-2xl border border-brand-800 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-brand-800/50 border-b border-brand-800 flex items-center gap-3">
        <div className="p-2 bg-brand-500 rounded-lg">
          <Sparkles className="text-white" size={20} />
        </div>
        <div>
          <h2 className="font-semibold text-white">ZeroGPT Assistant</h2>
          <p className="text-xs text-brand-500 font-medium">Live Zerodha Integration</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
        {messages.length === 0 && (
             <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
                 <Bot size={48} className="text-brand-800" />
                 <p>Start asking questions about your portfolio...</p>
                 {!apiKey && !process.env.API_KEY && (
                   <p className="text-xs text-orange-400 bg-orange-900/20 px-3 py-1 rounded-full border border-orange-900/50">
                     ⚠️ API Key missing. Please add it in Settings.
                   </p>
                 )}
             </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-brand-800' : 'bg-brand-500'}`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            
            <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-brand-800 text-white rounded-tr-none'
                    : 'bg-brand-800/50 text-gray-100 rounded-tl-none border border-brand-800'
                }`}
              >
                <div className="prose prose-invert prose-sm max-w-none">
                  {msg.content && (
                    <ReactMarkdown 
                      components={{
                        ul: (props) => <ul className="list-disc pl-4 space-y-1 my-2" {...props} />,
                        li: (props) => <li className="marker:text-brand-500" {...props} />,
                        strong: (props) => <strong className="text-white font-bold" {...props} />
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  )}
                </div>
                
                {/* Trade Proposal Card */}
                {msg.tradeProposal && (
                    <div className="mt-4 p-4 bg-brand-950 rounded-xl border border-brand-700 flex items-center justify-between gap-4">
                        <div>
                            <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Proposal</div>
                            <div className="font-bold text-white text-lg flex items-center gap-2">
                                <span className={msg.tradeProposal.transactionType === 'BUY' ? 'text-green-500' : 'text-red-500'}>
                                    {msg.tradeProposal.transactionType}
                                </span>
                                <span>{msg.tradeProposal.quantity} {msg.tradeProposal.symbol}</span>
                            </div>
                        </div>
                        <button 
                            onClick={() => onTradeRequest(msg.tradeProposal!)}
                            className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-brand-500/20"
                        >
                            Review
                        </button>
                    </div>
                )}
              </div>
              
              {/* Dynamic Charts */}
              {msg.visuals && msg.visuals.type !== 'none' && (
                <div className="w-full max-w-md mt-2">
                   <VisualChart visuals={msg.visuals} />
                </div>
              )}

              <span className="text-[10px] text-gray-500 mt-1 px-1">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center animate-pulse">
              <Bot size={16} />
            </div>
            <div className="flex items-center gap-2 text-gray-400 text-sm bg-brand-800/30 px-4 py-2 rounded-2xl rounded-tl-none">
              <Loader2 className="animate-spin" size={14} />
              Analysing Market Data...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-brand-900 border-t border-brand-800">
        {messages.length < 2 && (
            <div className="flex gap-2 overflow-x-auto pb-3 mb-2 scrollbar-hide">
                {suggestions.map((s, i) => (
                    <button 
                        key={i} 
                        onClick={() => setInput(s)}
                        className="whitespace-nowrap px-3 py-1.5 bg-brand-800 hover:bg-brand-700 border border-brand-700 rounded-full text-xs text-gray-300 transition-colors"
                    >
                        {s}
                    </button>
                ))}
            </div>
        )}
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask specific questions or command a trade..."
            className="w-full bg-brand-950 text-white rounded-xl pl-4 pr-12 py-3.5 border border-brand-800 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 placeholder-gray-500 shadow-inner"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
