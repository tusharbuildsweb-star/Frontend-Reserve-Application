import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Bell, X, Check, CheckCheck, Calendar, CreditCard, Star, AlertTriangle, Info, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import {
    fetchNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    receiveNotification
} from '../../app/features/notificationSlice';

const typeIcon = (type) => {
    const cls = 'w-4 h-4 flex-shrink-0';
    switch (type) {
        case 'reservation': return <Calendar className={`${cls} text-[#F5B942]`} />;
        case 'payment': return <CreditCard className={`${cls} text-green-400`} />;
        case 'subscription': return <AlertTriangle className={`${cls} text-[#F5B942]`} />;
        case 'review': return <Star className={`${cls} text-[#F5B942]`} />;
        default: return <Info className={`${cls} text-blue-400`} />;
    }
};

const timeAgo = (dateStr) => {
    const diff = (Date.now() - new Date(dateStr)) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
};

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const NotificationBell = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { list, unreadCount } = useSelector(state => state.notifications);
    const { user, isAuthenticated } = useSelector(state => state.auth);
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef(null);
    const socketRef = useRef(null);

    // Fetch on mount
    useEffect(() => {
        if (isAuthenticated) {
            dispatch(fetchNotifications());
        }
    }, [isAuthenticated, dispatch]);

    // Socket.io — join user room and listen for live notifications
    useEffect(() => {
        if (!isAuthenticated || !user?._id) return;

        const socket = io(SOCKET_URL, { transports: ['websocket'] });
        socketRef.current = socket;

        socket.on('connect', () => {
            socket.emit('joinUser', user._id);
            if (user.role === 'admin') socket.emit('joinAdmin');
        });

        socket.on('notification', (notification) => {
            dispatch(receiveNotification(notification));
        });

        // Also refresh on globalUpdate (catches legacy emits)
        socket.on('globalUpdate', () => {
            dispatch(fetchNotifications());
        });

        return () => { socket.disconnect(); };
    }, [isAuthenticated, user?._id, user?.role, dispatch]);

    // Close on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleNotificationClick = (n) => {
        if (!n.read) dispatch(markNotificationAsRead(n._id));
        if (n.link) navigate(n.link);
        setOpen(false);
    };

    const handleDelete = (e, id) => {
        e.stopPropagation();
        dispatch(deleteNotification(id));
    };

    if (!isAuthenticated) return null;

    const recent = list.slice(0, 8);

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setOpen(prev => !prev)}
                className="relative p-2 text-[#A1A1A1] hover:text-[#F5B942] transition-all rounded-xl hover:bg-white/5 active:scale-95"
                aria-label="Notifications"
            >
                <Bell size={22} className={unreadCount > 0 ? 'animate-pulse' : ''} />
                {unreadCount > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-1 right-1 min-w-[18px] h-[18px] text-black text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none shadow-[0_0_10px_rgba(245,185,66,0.5)]"
                        style={{ background: 'linear-gradient(135deg, #F5B942, #D4A017)' }}
                    >
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </motion.span>
                )}
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        transition={{ duration: 0.18 }}
                        className="absolute right-0 top-full mt-3 w-[380px] bg-[#0C0C0C]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-50"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
                            <div className="flex items-center gap-2.5">
                                <div className="p-1.5 bg-[#F5B942]/10 rounded-lg">
                                    <Bell size={16} className="text-[#F5B942]" />
                                </div>
                                <h3 className="text-[#F5F5F5] font-serif text-lg tracking-tight">Notifications</h3>
                                {unreadCount > 0 && (
                                    <span className="text-[10px] text-black px-2 py-0.5 rounded-full font-bold shadow-sm" style={{ background: 'linear-gradient(135deg, #F5B942, #D4A017)' }}>
                                        {unreadCount} New
                                    </span>
                                )}
                            </div>
                            {unreadCount > 0 && (
                                <button
                                    onClick={() => dispatch(markAllNotificationsAsRead())}
                                    className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest font-bold text-[#A1A1A1] hover:text-[#F5B942] transition-colors"
                                >
                                    <CheckCheck size={14} /> Mark all
                                </button>
                            )}
                        </div>

                        {/* List */}
                        <div className="max-h-[420px] overflow-y-auto custom-scrollbar divide-y divide-white/5">
                            {recent.length === 0 ? (
                                <div className="py-16 text-center">
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                                        <Bell size={24} className="text-[#3a3a3a]" />
                                    </div>
                                    <p className="text-[#F5F5F5] font-serif text-lg">All caught up</p>
                                    <p className="text-[#A1A1A1] text-xs mt-1">No new notifications at this time.</p>
                                </div>
                            ) : (
                                recent.map(n => (
                                    <div
                                        key={n._id}
                                        onClick={() => handleNotificationClick(n)}
                                        className={`flex items-start gap-4 px-6 py-4.5 cursor-pointer transition-all group relative border-l-2 ${!n.read ? 'bg-[#F5B942]/[0.03] border-[#F5B942]' : 'hover:bg-white/[0.02] border-transparent'}`}
                                    >
                                        <div className={`mt-0.5 p-2 rounded-xl flex-shrink-0 border transition-colors ${!n.read ? 'bg-[#F5B942]/10 border-[#F5B942]/20' : 'bg-white/5 border-white/5 group-hover:border-white/10'}`}>
                                            {typeIcon(n.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-2">
                                                <p className={`text-sm font-semibold leading-tight ${!n.read ? 'text-[#F5F5F5]' : 'text-[#A1A1A1]'}`}>
                                                    {n.title}
                                                </p>
                                                <span className="text-[10px] text-[#3a3a3a] whitespace-nowrap font-mono">{timeAgo(n.createdAt)}</span>
                                            </div>
                                            <p className={`text-xs mt-1.5 leading-relaxed line-clamp-2 ${!n.read ? 'text-[#D1D1D1]' : 'text-[#717171]'}`}>{n.message}</p>
                                        </div>
                                        <button
                                            onClick={(e) => handleDelete(e, n._id)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-[#3a3a3a] hover:text-red-400 flex-shrink-0 hover:bg-red-500/10 rounded-lg"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between bg-black/20">
                            <button
                                onClick={() => { navigate('/notifications'); setOpen(false); }}
                                className="text-xs text-[#F5B942] hover:text-white transition-all font-bold uppercase tracking-widest flex items-center gap-2 group/btn"
                            >
                                See All <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                            {list.length > 8 && (
                                <span className="text-[10px] text-[#3a3a3a] font-medium tracking-wide">{list.length - 8} additional updates</span>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationBell;
