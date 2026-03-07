import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  BarChart2,
  PhoneCall,
  Lightbulb,
  Settings,
  Menu,
  X,
  Bot,
  LogOut,
  Bell,
  Search,
  Send,
  MessageSquare,
  Gift,
  UtensilsCrossed,
  CalendarDays,
  Loader2
} from 'lucide-react';
import { processMessage } from '../services/chefAiService';

// --- Types ---

interface ChatMessage {
  id: number;
  role: 'user' | 'bot';
  text: string;
  data?: Record<string, any>;
  intent?: string;
}

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

// --- Data Renderers for Chat Bubbles ---

const MenuDataView: React.FC<{ menu: { name: string; price: number; category: string }[] }> = ({ menu }) => (
  <div className="mt-2 space-y-1">
    {menu.map((item, i) => (
      <div key={i} className="flex items-center justify-between text-[11px]">
        <span className="text-slate-300">{item.name}</span>
        <span className="text-orange-400 font-semibold">${item.price}</span>
      </div>
    ))}
  </div>
);

const ComboDataView: React.FC<{ combos: { name: string; items: string[]; price: number }[] }> = ({ combos }) => (
  <div className="mt-2 space-y-2">
    {combos.map((combo, i) => (
      <div key={i} className="bg-white/5 rounded-lg p-2 border border-white/10">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[11px] font-semibold text-white">{combo.name}</span>
          <span className="text-[11px] text-orange-400 font-bold">${combo.price}</span>
        </div>
        <p className="text-[10px] text-slate-500">{Array.isArray(combo.items) ? combo.items.join(' + ') : ''}</p>
      </div>
    ))}
  </div>
);

const SingleComboView: React.FC<{ combo: { name: string; items: string[]; price: number } }> = ({ combo }) => (
  <div className="mt-2 bg-white/5 rounded-lg p-2 border border-white/10">
    <div className="flex justify-between items-center mb-1">
      <span className="text-[11px] font-semibold text-white">{combo.name}</span>
      <span className="text-[11px] text-orange-400 font-bold">${combo.price}</span>
    </div>
    <p className="text-[10px] text-slate-500">{Array.isArray(combo.items) ? combo.items.join(' + ') : ''}</p>
  </div>
);

const SpecialsDataView: React.FC<{ specials: { name: string; price: number; tag?: string }[] }> = ({ specials }) => (
  <div className="mt-2 space-y-1.5">
    {specials.map((item, i) => (
      <div key={i} className="flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-300">⭐ {item.name}</span>
          {item.tag && <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">{item.tag}</span>}
        </div>
        <span className="text-emerald-400 font-semibold">${item.price}</span>
      </div>
    ))}
  </div>
);

// --- Structured Data Renderer ---

const ChatDataRenderer: React.FC<{ intent?: string; data?: Record<string, any> }> = ({ intent, data }) => {
  if (!data || Object.keys(data).length === 0) return null;

  switch (intent) {
    case 'menu':
      return Array.isArray(data.menu) ? <MenuDataView menu={data.menu} /> : null;
    case 'combo':
      return Array.isArray(data.combos) ? <ComboDataView combos={data.combos} /> : null;
    case 'cheapest_combo':
    case 'best_combo':
      return data.combo && typeof data.combo === 'object' ? <SingleComboView combo={data.combo} /> : null;
    case 'specials':
      return Array.isArray(data.specials) ? <SpecialsDataView specials={data.specials} /> : null;
    case 'reservation':
      return data.time ? (
        <div className="mt-2 bg-white/5 rounded-lg p-2 border border-white/10 text-[11px]">
          <div className="flex justify-between">
            <span className="text-slate-400">Next slot:</span>
            <span className="text-white font-semibold">{data.time}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-slate-400">Table size:</span>
            <span className="text-white font-semibold">{data.table_size} seats</span>
          </div>
        </div>
      ) : null;
    default:
      return null;
  }
};

// --- Typing Indicator ---

const TypingIndicator: React.FC = () => (
  <div className="flex gap-3">
    <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 border border-orange-500/30">
      <Bot className="w-4 h-4 text-orange-500" />
    </div>
    <div className="bg-[#1c1c24] p-3 rounded-2xl rounded-tl-none border border-white/5">
      <div className="flex items-center gap-1">
        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  </div>
);

// --- Main Layout ---

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, onLogout }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: 'bot',
      text: "Bonjour! Kitchen is live. Ask me about the menu, combos, specials, or reservations 🍽️",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLElement>(null);
  let nextId = useRef(2);

  // Auto-scroll chat messages to bottom (scoped to chat container only)
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Scroll main content to top when tab changes (NO window.scrollTo)
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const text = chatMessage.trim();
    if (!text || isTyping) return;

    // Add user message
    const userMsg: ChatMessage = { id: nextId.current++, role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setChatMessage('');

    // Show typing indicator while awaiting Gemini / fallback
    setIsTyping(true);
    try {
      const response = await processMessage(text);
      const botMsg: ChatMessage = {
        id: nextId.current++,
        role: 'bot',
        text: response.reply,
        data: response.data,
        intent: response.intent,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: nextId.current++,
        role: 'bot',
        text: "Sorry, I couldn't process that request right now.",
        data: {},
        intent: 'general',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'transcripts', label: 'Transcripts', icon: PhoneCall },
    { id: 'insights', label: 'Insights', icon: Lightbulb },
    { id: 'rewards', label: 'Rewards', icon: Gift },
    { id: 'combos', label: 'Combo Meals', icon: UtensilsCrossed },
    { id: 'holidays', label: 'Holiday Schedule', icon: CalendarDays },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#0f1115] text-slate-200 font-sans flex overflow-hidden">
      {/* Background Image Overlay */}
      <div
        className="fixed inset-0 z-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1575824244772-e180d5965ce6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXJrJTIwbW9kZXJuJTIwcmVzdGF1cmFudCUyMGludGVyaW9yJTIwYmx1cnxlbnwxfHx8fDE3NzEzNDk4Nzh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(2px)'
        }}
      />

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - ChefAI Assistant Style */}
      <motion.aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-80 bg-[#13131a] border-r border-white/5 flex flex-col transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
      >
        {/* Header */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-orange-500 p-2 rounded-xl shadow-lg shadow-orange-900/20">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-wide">ChefAI <span className="text-slate-400 font-normal">Assistant</span></span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation — NEVER scrollable, all tabs always visible */}
        <div className="px-3 mb-2 flex-shrink-0 overflow-hidden">
          <p className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 mt-1">Menu</p>
          <nav className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-lg transition-all duration-200 group relative ${isActive
                    ? 'bg-orange-500/10 text-orange-500'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-orange-500' : 'text-slate-500 group-hover:text-white'}`} />
                  <span className="font-medium text-sm truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* ─── Chat Section ─── separated from nav ─── */}
        <div className="flex-1 flex flex-col min-h-[250px] border-t border-white/10">
          {/* Chat Messages — only this area scrolls */}
          <div
            className="flex-1 px-4 overflow-y-auto flex flex-col chat-scroll"
            ref={chatContainerRef}
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#3f3f50 #1a1a24',
            }}
          >
            <style>{`
              .chat-scroll::-webkit-scrollbar { width: 6px; }
              .chat-scroll::-webkit-scrollbar-track { background: #1a1a24; border-radius: 3px; }
              .chat-scroll::-webkit-scrollbar-thumb { background: #3f3f50; border-radius: 3px; }
              .chat-scroll::-webkit-scrollbar-thumb:hover { background: #55556a; }
            `}</style>
            <div className="mt-auto space-y-3 mb-4 py-2">
              {messages.map((msg) => (
                msg.role === 'bot' ? (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 border border-orange-500/30">
                      <Bot className="w-4 h-4 text-orange-500" />
                    </div>
                    <div className="bg-[#1c1c24] p-3 rounded-2xl rounded-tl-none border border-white/5 max-w-[85%]">
                      <p className="text-xs text-slate-300 leading-relaxed">{msg.text}</p>
                      <ChatDataRenderer intent={msg.intent} data={msg.data} />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex gap-3 flex-row-reverse"
                  >
                    <div className="bg-orange-600 p-3 rounded-2xl rounded-tr-none max-w-[85%]">
                      <p className="text-xs text-white">{msg.text}</p>
                    </div>
                  </motion.div>
                )
              ))}

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <TypingIndicator />
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Chat Input — fixed at bottom of chat section */}
          <div className="p-4 border-t border-white/5 bg-[#13131a] flex-shrink-0">
            <form onSubmit={handleSendMessage} className="relative">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                placeholder="Ask ChefAI..."
                disabled={isTyping}
                className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-orange-500/50 transition-colors disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isTyping || !chatMessage.trim()}
                className="absolute right-2 top-2 p-1.5 bg-orange-500 rounded-lg text-white hover:bg-orange-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isTyping ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </button>
            </form>
          </div>
        </div>{/* end Chat Section */}
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Top Navbar */}
        <header className="h-16 flex items-center justify-between px-6 lg:px-8 border-b border-white/5 bg-[#0f1115]/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-white transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-semibold text-white hidden sm:block">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 text-xs font-medium text-slate-300 transition-colors">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Sync</span>
            </button>

            <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block"></div>

            <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full border-2 border-[#0f1115]"></span>
            </button>

            <button className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-rose-600 flex items-center justify-center text-white text-xs font-bold border border-white/10 shadow-lg shadow-orange-500/20">
              JD
            </button>
          </div>
        </header>

        {/* Page Content — scrolls to top on tab change */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8" ref={mainContentRef}>
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};
