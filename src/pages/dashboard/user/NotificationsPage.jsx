import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Calendar, CreditCard, Star, AlertTriangle, Info, Trash2, CheckCheck, X, Filter } from 'lucide-react';
import {
    fetchNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification
} from '../../../app/features/notificationSlice';

const TYPES = ['all', 'reservation', 'payment', 'subscription', 'review', 'system'];

const typeConfig = {
    reservation: { icon: Calendar, color: 'text-[#F5B942]', bg: 'bg-[#F5B942]/10', label: 'Reservation' },
    payment: { icon: CreditCard, color: 'text-green-400', bg: 'bg-green-400/10', label: 'Payment' },
    subscription: { icon: AlertTriangle, color: 'text-[#F5B942]', bg: 'bg-[#F5B942]/10', label: 'Subscription' },
    review: { icon: Star, color: 'text-[#F5B942]', bg: 'bg-[#F5B942]/10', label: 'Review' },
    system: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-400/10', label: 'System' },
    support: { icon: Info, color: 'text-[#A1A1A1]', bg: 'bg-white/5', label: 'Support' },
};

const timeAgo = (dateStr) => {
    const diff = (Date.now() - new Date(dateStr)) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hour${Math.floor(diff / 3600) !== 1 ? 's' : ''} ago`;
    if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) !== 1 ? 's' : ''} ago`;
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const groupByDate = (list) => {
    const groups = {};
    list.forEach(n => {
        const d = new Date(n.createdAt);
        const today = new Date();
        const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
        let key;
        if (d.toDateString() === today.toDateString()) key = 'Today';
        else if (d.toDateString() === yesterday.toDateString()) key = 'Yesterday';
        else key = d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
        if (!groups[key]) groups[key] = [];
        groups[key].push(n);
    });
    return groups;
};

const NotificationsPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { list, unreadCount, loading } = useSelector(state => state.notifications);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        dispatch(fetchNotifications());
    }, [dispatch]);

    const filtered = filter === 'all' ? list : list.filter(n => n.type === filter);
    const grouped = groupByDate(filtered);

    const handleClick = (n) => {
        if (!n.read) dispatch(markNotificationAsRead(n._id));
        if (n.link) navigate(n.link);
    };

    return (
        <div className="min-h-screen bg-[#050505] pt-32 pb-20 px-4 relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#F5B942]/[0.02] rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#F5B942]/[0.01] rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-2xl mx-auto relative z-10">

                {/* Header */}
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h1 className="text-4xl font-serif text-[#F5F5F5] tracking-tight">Notifications</h1>
                        {unreadCount > 0 && (
                            <p className="text-[#F5B942] text-xs font-bold uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#F5B942] animate-pulse" />
                                {unreadCount} Unread Updates
                            </p>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={() => dispatch(markAllNotificationsAsRead())}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[11px] uppercase tracking-widest font-bold text-[#A1A1A1] hover:text-[#F5B942] hover:border-[#F5B942]/30 transition-all active:scale-95"
                        >
                            <CheckCheck size={14} /> Clear Unread
                        </button>
                    )}
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-4 mb-10 scrollbar-hide no-scrollbar">
                    {TYPES.map(t => (
                        <button
                            key={t}
                            onClick={() => setFilter(t)}
                            className={`px-5 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border ${filter === t ? 'bg-[#F5B942] text-black border-[#F5B942] shadow-[0_4px_15px_rgba(245,185,66,0.3)]' : 'bg-[#0B0B0B] text-[#A1A1A1] border-white/5 hover:border-white/20 hover:text-[#F5F5F5]'}`}
                        >
                            {t === 'all' ? `All (${list.length})` : t}
                        </button>
                    ))}
                </div>

                {/* Notification Groups */}
                {loading ? (
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-24 bg-white/[0.03] rounded-2xl animate-pulse border border-white/5" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-32">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5 shadow-inner">
                            <Bell size={40} className="text-[#3a3a3a]" />
                        </div>
                        <p className="text-2xl font-serif text-[#F5F5F5]">Pure Silence</p>
                        <p className="text-[#A1A1A1] text-sm mt-2 max-w-xs mx-auto leading-relaxed">Everything is up to date. We'll notify you when something extraordinary happens.</p>
                    </div>
                ) : (
                    Object.entries(grouped).map(([date, items]) => (
                        <div key={date} className="mb-8">
                            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-600 mb-3">{date}</p>
                            <div className="space-y-2">
                                <AnimatePresence>
                                    {items.map(n => {
                                        const cfg = typeConfig[n.type] || typeConfig.system;
                                        const Icon = cfg.icon;
                                        return (
                                            <motion.div
                                                key={n._id}
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                onClick={() => handleClick(n)}
                                                className={`flex items-start gap-5 p-5 rounded-2xl border cursor-pointer transition-all group relative overflow-hidden backdrop-blur-sm ${!n.read ? 'bg-[#F5B942]/[0.03] border-[#F5B942]/20' : 'bg-[#0B0B0B]/40 border-white/5 hover:border-white/20'}`}
                                            >
                                                {!n.read && <div className="absolute top-0 left-0 w-1 h-full bg-[#F5B942]" />}
                                                <div className={`p-3 rounded-2xl flex-shrink-0 border transition-colors ${!n.read ? 'bg-[#F5B942]/10 border-[#F5B942]/20' : 'bg-white/5 border-white/5 group-hover:border-white/10'}`}>
                                                    <Icon size={20} className={cfg.color} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-center gap-2 mb-1">
                                                        <p className={`font-semibold text-base tracking-tight ${!n.read ? 'text-[#F5F5F5]' : 'text-[#A1A1A1]'}`}>
                                                            {n.title}
                                                        </p>
                                                        <span className="text-[10px] text-[#3a3a3a] font-mono tracking-wider">{timeAgo(n.createdAt)}</span>
                                                    </div>
                                                    <p className={`text-sm leading-relaxed ${!n.read ? 'text-[#D1D1D1]' : 'text-[#717171]'}`}>{n.message}</p>
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); dispatch(deleteNotification(n._id)); }}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-[#3a3a3a] hover:text-red-400 flex-shrink-0 rounded-xl hover:bg-red-500/10"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;
