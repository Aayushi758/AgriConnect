import React, { useEffect, useState, useRef, useContext } from 'react';
import { chatAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { MessageSquare, Send, User as UserIcon, Clock, ChevronRight } from 'lucide-react';

const Messages = () => {
  const { user } = useContext(AuthContext);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeConvId) {
      fetchMessages(activeConvId);
      // Simple polling for demo
      const interval = setInterval(() => fetchMessages(activeConvId), 5000);
      return () => clearInterval(interval);
    }
  }, [activeConvId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const res = await chatAPI.getConversations();
      setConversations(res.data);
      if (res.data.length > 0 && !activeConvId) {
        setActiveConvId(res.data[0].id);
      }
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const fetchMessages = async (convId: number) => {
    try {
      const res = await chatAPI.getMessages(convId);
      setMessages(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeConvId) return;

    const msg = input;
    setInput('');
    
    try {
      await chatAPI.sendMessage(activeConvId, { content: msg, message_type: 'text' });
      fetchMessages(activeConvId);
      fetchConversations();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-8">Loading messages...</div>;
  }

  const activeConv = conversations.find(c => c.id === activeConvId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-4rem)]">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex overflow-hidden h-[80vh]">
        
        {/* Sidebar */}
        <div className="w-1/3 border-r border-gray-100 flex flex-col bg-gray-50/50">
          <div className="p-4 border-b border-gray-100 bg-white">
            <h2 className="text-xl font-bold text-gray-900 font-heading">Messages</h2>
          </div>
          <div className="flex-grow overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                No conversations yet.
              </div>
            ) : (
              conversations.map(conv => (
                <div 
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${activeConvId === conv.id ? 'bg-green-50 border-l-4 border-l-green-500' : ''}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-gray-900 truncate pr-2">{conv.other_user_name}</h4>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {new Date(conv.last_message_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{conv.subject}</p>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-500 truncate max-w-[80%]">{conv.last_message}</p>
                    {conv.unread_count > 0 && (
                      <span className="bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="w-2/3 flex flex-col bg-white">
          {activeConvId ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center">
                  <div className="bg-gray-100 p-2 rounded-full mr-3">
                    <UserIcon className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{activeConv?.other_user_name}</h3>
                    <p className="text-xs text-gray-500">{activeConv?.subject}</p>
                  </div>
                </div>
                {activeConv?.is_bulk_inquiry && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                    Bulk Inquiry
                  </span>
                )}
              </div>

              {/* Messages */}
              <div className="flex-grow p-6 overflow-y-auto bg-gray-50 space-y-4">
                {messages.map((msg, idx) => {
                  const isMine = msg.is_mine;
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                      <div 
                        className={`max-w-[75%] p-3 rounded-2xl text-sm shadow-sm ${
                          isMine 
                            ? 'bg-green-600 text-white rounded-tr-sm' 
                            : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
                        }`}
                      >
                        {msg.content}
                      </div>
                      <div className="flex items-center mt-1 space-x-1">
                        <span className="text-[10px] text-gray-400">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-gray-100 bg-white">
                <form onSubmit={handleSend} className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-grow bg-gray-50 border border-gray-200 focus:bg-white focus:border-green-500 focus:ring-1 focus:ring-green-500 rounded-xl px-4 py-3 outline-none transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="bg-green-600 text-white p-3 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-gray-400">
              <MessageSquare className="h-16 w-16 mb-4 opacity-20" />
              <p>Select a conversation to start messaging</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Messages;
