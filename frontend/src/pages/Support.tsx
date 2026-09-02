import React, { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { supportAPI } from '../services/api';
import { Send, Phone, Video, MoreVertical, Search, CheckCircle2, User as UserIcon, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

const Support = () => {
  const { user } = useContext(AuthContext);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Mock conversations for UI showcase
    setTimeout(() => {
      const mockConversations = [
        {
          id: 1,
          participant_name: user?.role === 'farmer' ? 'Rahul Consumer' : 'Ramesh Farmer',
          participant_avatar: null,
          last_message: 'Is the delivery expected today?',
          last_message_time: '10:45 AM',
          unread: 2,
          is_online: true
        },
        {
          id: 2,
          participant_name: 'KisanSetu Support Team',
          participant_avatar: null,
          last_message: 'Your ticket #1042 has been resolved.',
          last_message_time: 'Yesterday',
          unread: 0,
          is_online: true
        },
        {
          id: 3,
          participant_name: user?.role === 'farmer' ? 'Priya Consumer' : 'Vijay Farmer',
          participant_avatar: null,
          last_message: 'Thank you for the fresh produce!',
          last_message_time: 'Mon',
          unread: 0,
          is_online: false
        }
      ];
      
      setConversations(mockConversations);
      setActiveChat(mockConversations[0]);
      
      setMessages([
        { id: 1, sender: 'other', text: 'Hi, I placed an order for 5kg tomatoes yesterday.', time: '10:30 AM' },
        { id: 2, sender: 'me', text: 'Hello! Yes, I have received the order. It is being packed.', time: '10:35 AM' },
        { id: 3, sender: 'other', text: 'Great! Is the delivery expected today?', time: '10:45 AM' },
      ]);
      
      setLoading(false);
    }, 500);
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: 'me',
      text: input,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([...messages, newMsg]);
    setInput('');
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 flex justify-center">
      <div className="max-w-6xl w-full bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex h-[80vh]">
        
        {/* Sidebar */}
        <div className="w-1/3 border-r border-gray-100 flex flex-col hidden md:flex">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 font-heading mb-4">Messages</h2>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search messages..."
                className="pl-9 pr-4 py-2 w-full bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-green-500 rounded-xl text-sm outline-none transition-all"
              />
            </div>
          </div>
          
          <div className="flex-grow overflow-y-auto">
            {conversations.map((chat) => (
              <div 
                key={chat.id}
                onClick={() => setActiveChat(chat)}
                className={`p-4 border-b border-gray-50 flex items-center cursor-pointer transition-colors ${activeChat?.id === chat.id ? 'bg-green-50/50' : 'hover:bg-gray-50'}`}
              >
                <div className="relative">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold">
                    {chat.participant_name.charAt(0)}
                  </div>
                  {chat.is_online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                
                <div className="ml-4 flex-grow overflow-hidden">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-bold text-gray-900 text-sm truncate">{chat.participant_name}</h3>
                    <span className="text-xs text-gray-400 flex-shrink-0">{chat.last_message_time}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className={`text-sm truncate ${chat.unread > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                      {chat.last_message}
                    </p>
                    {chat.unread > 0 && (
                      <span className="bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-2">
                        {chat.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-grow flex flex-col w-full md:w-2/3">
          {activeChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold mr-3 md:hidden">
                    {activeChat.participant_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{activeChat.participant_name}</h3>
                    <p className="text-xs text-green-600 flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span> Online
                    </p>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors">
                    <Phone className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors">
                    <Video className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Messages List */}
              <div className="flex-grow bg-[#F0F2F5] p-4 overflow-y-auto flex flex-col space-y-4">
                <div className="text-center my-4">
                  <span className="bg-white/60 text-gray-500 text-xs px-3 py-1 rounded-full font-medium shadow-sm">
                    Today
                  </span>
                </div>
                
                {messages.map((msg) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={msg.id} 
                    className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[75%] rounded-2xl p-3 shadow-sm relative ${
                      msg.sender === 'me' 
                        ? 'bg-green-600 text-white rounded-tr-sm' 
                        : 'bg-white text-gray-800 rounded-tl-sm'
                    }`}>
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                      <div className={`text-[10px] flex items-center justify-end mt-1 ${
                        msg.sender === 'me' ? 'text-green-200' : 'text-gray-400'
                      }`}>
                        {msg.time}
                        {msg.sender === 'me' && <CheckCircle2 className="w-3 h-3 ml-1" />}
                      </div>
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-4 bg-white border-t border-gray-100">
                <form onSubmit={handleSend} className="flex items-center">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message here..."
                    className="flex-grow bg-gray-100 border-transparent focus:bg-white focus:ring-2 focus:ring-green-500 rounded-xl px-4 py-3 outline-none transition-all"
                  />
                  <button 
                    type="submit"
                    disabled={!input.trim()}
                    className="ml-3 bg-green-600 text-white p-3 rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm shadow-green-600/20 flex items-center justify-center"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-gray-400">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="w-10 h-10 text-gray-300" />
              </div>
              <p className="font-medium">Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Support;
