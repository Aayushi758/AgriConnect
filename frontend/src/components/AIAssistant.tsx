import React, { useState, useRef, useEffect, useContext } from 'react';
import { MessageSquare, X, Send, Bot, User as UserIcon, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { aiAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';

const AIAssistant = () => {
  const { user } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'ai' | 'user', content: string}[]>([
    { role: 'ai', content: 'Namaste! 🙏 I am your KisanSetu AI assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await aiAPI.assistant({ 
        message: userMessage,
        context: { role: user?.role } 
      });
      
      setMessages(prev => [...prev, { role: 'ai', content: response.data.response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: 'Sorry, I am having trouble connecting to the server right now. Please try again later.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-16 right-0 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col"
            style={{ height: '500px', maxHeight: '80vh' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-500 p-4 flex justify-between items-center text-white">
              <div className="flex items-center">
                <div className="bg-white/20 p-2 rounded-full mr-3">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold">Kisan AI</h3>
                  <p className="text-xs text-green-100">Always here to help</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Messages Area */}
            <div className="flex-grow p-4 overflow-y-auto bg-gray-50 flex flex-col space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-green-100 ml-2' : 'bg-green-600 mr-2'}`}>
                      {msg.role === 'user' ? <UserIcon className="w-4 h-4 text-green-600" /> : <Bot className="w-4 h-4 text-white" />}
                    </div>
                    <div className={`p-3 rounded-2xl text-sm shadow-sm ${msg.role === 'user' ? 'bg-green-600 text-white rounded-tr-sm' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'}`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 mr-2 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-tl-sm shadow-sm flex space-x-1 items-center">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input Area */}
            <div className="p-3 bg-white border-t border-gray-100">
              <form onSubmit={handleSend} className="flex items-center">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about crops, prices, weather..."
                  className="flex-grow bg-gray-100 border-transparent focus:bg-white focus:ring-2 focus:ring-green-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                />
                <button 
                  type="submit" 
                  disabled={!input.trim() || loading}
                  className="ml-2 bg-green-600 text-white p-2.5 rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-green-600 rounded-full shadow-xl shadow-green-600/30 flex items-center justify-center text-white"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </motion.button>
    </div>
  );
};

export default AIAssistant;
