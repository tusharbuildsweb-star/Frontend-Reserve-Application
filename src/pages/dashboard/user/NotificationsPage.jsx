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
    reservation: { icon: Calendar,     color: 'text-amber-500',  bg: 'bg-amber-500/10',  label: 'Reservation' },
    payment:     { icon: CreditCard,   color: 'text-green-500',  bg: 'bg-green-500/10',  label: 'Payment' },
    subscription:{ icon: AlertTriangle,color: 'text-red-400',    bg: 'bg-red-500/10',    label: 'Subscription' },
    review:      { icon: Star,         color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'Review' },
    system:      { icon: Info,         color: 'text-blue-400',   bg: 'bg-blue-500/10',   label: 'System' },
    support:     { icon: Info,         color: 'text-zinc-400',   bg: 'bg-white/5',       label: 'Support' },
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
        <div className="min-h-screen bg-zinc-950 pt-24 pb-16 px-4">
            <div className="max-w-2xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-serif text-white">Notifications</h1>
                        {unreadCount > 0 && (
                            <p className="text-zinc-500 text-sm mt-1">{unreadCount} unread</p>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={() => dispatch(markAllNotificationsAsRead())}
                            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
                        >
                            <CheckCheck size={15} /> Mark all read
                        </button>
                    )}
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
                    {TYPES.map(t => (
                        <button
                            key={t}
                            onClick={() => setFilter(t)}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all ${filter === t ? 'bg-amber-500 text-black' : 'bg-white/5 text-zinc-400 hover:text-white border border-white/10 hover:border-white/20'}`}
                        >
                            {t === 'all' ? `All (${list.length})` : t}
                        </button>
                    ))}
                </div>

                {/* Notification Groups */}
                {loading ? (
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-24 text-zinc-600">
                        <Bell size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="text-lg font-medium">No notifications</p>
                        <p className="text-sm mt-1">You're all caught up!</p>
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
                                                className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all group ${!n.read ? 'bg-amber-500/5 border-amber-500/10 hover:bg-amber-500/10' : 'bg-white/[0.03] border-white/5 hover:bg-white/5'}`}
                                            >
                                                <div className={`p-2.5 rounded-xl flex-shrink-0 ${cfg.bg}`}>
                                                    <Icon size={18} className={cfg.color} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className={`font-semibold text-sm truncate ${!n.read ? 'text-white' : 'text-zinc-300'}`}>
                                                            {n.title}
                                                        </p>
                                                        {!n.read && <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />}
                                                    </div>
                                                    <p className="text-zinc-500 text-xs mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>
                                                    <p className="text-zinc-700 text-[10px] mt-1.5">{timeAgo(n.createdAt)}</p>
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); dispatch(deleteNotification(n._id)); }}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-zinc-600 hover:text-red-400 flex-shrink-0 rounded-lg hover:bg-red-500/10"
                                                >
                                                    <Trash2 size={14} />
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
