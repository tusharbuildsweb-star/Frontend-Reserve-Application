import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, Sparkles, ChevronRight, HelpCircle } from 'lucide-react';
import api from '../../services/api';
import { useSelector } from 'react-redux';

const AIChatAssistant = () => {
    const { user } = useSelector(state => state.auth);
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, type: 'bot', text: "Hello! I'm your Zesty Assistant. How can I help you today?", timestamp: new Date() }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading]);

    const handleSend = async (e) => {
        if (e) e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { id: Date.now(), type: 'user', text: userMsg, timestamp: new Date() }]);
        setLoading(true);

        try {
            const res = await api.post('ai/chat', { message: userMsg });

            setTimeout(() => {
                setMessages(prev => [...prev, {
                    id: Date.now() + 1,
                    type: 'bot',
                    text: res.data.message,
                    isHandoff: res.data.type === 'handoff',
                    timestamp: new Date()
                }]);
                setLoading(false);
            }, 600);
        } catch (error) {
            console.error('AI Chat Error:', error);
            setMessages(prev => [...prev, { id: Date.now() + 1, type: 'bot', text: "I'm having a bit of trouble connecting to my brain. Please try again later!", timestamp: new Date() }]);
            setLoading(false);
        }
    };

    const quickActions = [
        "How to book?",
        "Become a partner",
        "Refund policy",
        "Talk to human"
    ];

    if (!user) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[9999]">
            {/* Floating Button */}
            {!isOpen && (
                <motion.button
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsOpen(true)}
                    className="w-16 h-16 bg-amber-500 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center justify-center text-black border-2 border-white/20 relative group overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-700" />
                    <MessageSquare size={28} />
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border border-white/20"></span>
                    </span>
                </motion.button>
            )}

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.8 }}
                        className="w-[380px] h-[550px] bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden bottom-20 absolute right-0"
                    >
                        {/* Header */}
                        <div className="bg-amber-500 p-4 flex items-center justify-between text-black">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-black/10 rounded-full flex items-center justify-center border border-black/5">
                                    <Bot size={22} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">Zesty AI Assistant</h3>
                                    <p className="text-[10px] font-medium opacity-70 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-green-900 rounded-full animate-pulse" /> Always Online
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-black/10 rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-950/50 custom-scrollbar">
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, x: msg.type === 'bot' ? -10 : 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.type === 'user'
                                        ? 'bg-amber-500 text-black rounded-tr-none'
                                        : msg.isHandoff
                                            ? 'bg-blue-500/10 border border-blue-500/30 text-blue-200 rounded-tl-none'
                                            : 'bg-white/5 border border-white/10 text-zinc-200 rounded-tl-none'
                                        }`}>
                                        <p>{msg.text}</p>
                                        <span className="text-[10px] opacity-30 mt-1 block text-right">
                                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                            {loading && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                                    <div className="bg-white/5 border border-white/10 p-3 rounded-2xl rounded-tl-none flex gap-1">
                                        <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                                        <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Quick Suggestions */}
                        {messages.length < 5 && !loading && (
                            <div className="px-4 py-2 flex flex-wrap gap-2 bg-zinc-950/50">
                                {quickActions.map(action => (
                                    <button
                                        key={action}
                                        onClick={() => { setInput(action); handleSend(); }}
                                        className="text-[10px] px-2 py-1 bg-white/5 border border-white/10 rounded-full text-zinc-400 hover:text-white transition-all"
                                    >
                                        {action}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Input Area */}
                        <form onSubmit={handleSend} className="p-4 bg-zinc-900 border-t border-white/5">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask anything..."
                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-all placeholder:text-zinc-600"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || loading}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-amber-500 hover:text-amber-400 disabled:opacity-30 transition-colors"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AIChatAssistant;
