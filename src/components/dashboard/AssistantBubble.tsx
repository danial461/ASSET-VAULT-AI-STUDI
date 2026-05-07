import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Bot, Sparkles } from 'lucide-react';
import { chatService, ChatMessage } from '../../services/chatService';
import { Asset } from '../../types';
import { cn } from '../../lib/utils';

interface AssistantBubbleProps {
  assets: Asset[];
}

export function AssistantBubble({ assets }: AssistantBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', content: "Hello. I'm your Vault Assistant. How can I help you manage your estate today?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      const response = await chatService.askVault(userMessage, assets, messages.slice(-5));
      if (response) {
        setMessages(prev => [...prev, { role: 'model', content: response }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', content: "I encountered a synchronization error. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-24 right-6 z-50">
        <button 
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-all hover:bg-[#f2f2f7]"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <MessageSquare size={24} strokeWidth={2.5} />
          </motion.div>
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:p-6 sm:justify-end bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-sm h-[70vh] bg-[#1c1c1e] rounded-[32px] border border-white/10 shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-black/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-black">
                    <Bot size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white leading-tight italic">Vault Assistant</span>
                    <span className="text-[10px] text-[#34c759] font-bold uppercase tracking-widest">Always Active</span>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-[#8e8e93] hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Chat Content */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 scrollbar-none">
                {messages.map((msg, i) => (
                  <div key={i} className={cn(
                    "max-w-[85%] flex flex-col gap-1",
                    msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                  )}>
                    <div className={cn(
                      "px-4 py-3 rounded-2xl text-sm leading-relaxed",
                      msg.role === 'user' 
                        ? "bg-indigo-600 text-white rounded-tr-none" 
                        : "bg-[#2c2c2e] text-white rounded-tl-none border border-white/5"
                    )}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex items-center gap-2 text-[#48484a] text-xs font-bold animate-pulse">
                    <Sparkles size={14} className="animate-spin text-indigo-400" />
                    Assistant is thinking...
                  </div>
                )}
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="p-4 bg-black/40 border-t border-white/5 flex gap-2">
                <input 
                  type="text"
                  placeholder="Ask about your vault..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 bg-black/40 border border-white/5 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20 transition-all placeholder:text-[#48484a]"
                />
                <button 
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="w-11 h-11 bg-white text-black rounded-2xl flex items-center justify-center disabled:opacity-30 disabled:active:scale-100 active:scale-90 transition-all shadow-lg"
                >
                  <Send size={18} />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
