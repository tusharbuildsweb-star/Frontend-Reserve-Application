import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Bell, X, Check, CheckCheck, Calendar, CreditCard, Star, AlertTriangle, Info } from 'lucide-react';
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
        case 'reservation': return <Calendar className={`${cls} text-amber-500`} />;
        case 'payment':     return <CreditCard className={`${cls} text-green-500`} />;
        case 'subscription':return <AlertTriangle className={`${cls} text-red-400`} />;
        case 'review':      return <Star className={`${cls} text-purple-400`} />;
        default:            return <Info className={`${cls} text-blue-400`} />;
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
                className="relative p-2 text-zinc-400 hover:text-white transition-colors rounded-xl hover:bg-white/5"
                aria-label="Notifications"
            >
                <Bell size={22} />
                {unreadCount > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none"
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
                        className="absolute right-0 top-full mt-2 w-[360px] bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                            <div className="flex items-center gap-2">
                                <Bell size={16} className="text-amber-500" />
                                <h3 className="text-white font-semibold text-sm">Notifications</h3>
                                {unreadCount > 0 && (
                                    <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold">{unreadCount}</span>
                                )}
                            </div>
                            {unreadCount > 0 && (
                                <button
                                    onClick={() => dispatch(markAllNotificationsAsRead())}
                                    className="flex items-center gap-1 text-xs text-zinc-400 hover:text-amber-500 transition-colors"
                                >
                                    <CheckCheck size={13} /> Mark all read
                                </button>
                            )}
                        </div>

                        {/* List */}
                        <div className="max-h-[400px] overflow-y-auto divide-y divide-white/5">
                            {recent.length === 0 ? (
                                <div className="py-10 text-center text-zinc-600 text-sm">
                                    <Bell size={28} className="mx-auto mb-3 opacity-30" />
                                    No notifications yet
                                </div>
                            ) : (
                                recent.map(n => (
                                    <div
                                        key={n._id}
                                        onClick={() => handleNotificationClick(n)}
                                        className={`flex items-start gap-3 px-5 py-3.5 cursor-pointer transition-colors hover:bg-white/5 group relative ${!n.read ? 'bg-amber-500/5' : ''}`}
                                    >
                                        <div className={`mt-0.5 p-1.5 rounded-lg flex-shrink-0 ${!n.read ? 'bg-amber-500/10' : 'bg-white/5'}`}>
                                            {typeIcon(n.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium truncate ${!n.read ? 'text-white' : 'text-zinc-300'}`}>
                                                {n.title}
                                                {!n.read && <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-amber-500 align-middle" />}
                                            </p>
                                            <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                                            <p className="text-[10px] text-zinc-600 mt-1">{timeAgo(n.createdAt)}</p>
                                        </div>
                                        <button
                                            onClick={(e) => handleDelete(e, n._id)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-zinc-600 hover:text-red-400 flex-shrink-0"
                                        >
                                            <X size={13} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-3 border-t border-white/10 flex items-center justify-between">
                            <button
                                onClick={() => { navigate('/notifications'); setOpen(false); }}
                                className="text-xs text-amber-500 hover:text-white transition-colors font-medium"
                            >
                                See all notifications →
                            </button>
                            {list.length > 8 && (
                                <span className="text-[10px] text-zinc-600">{list.length - 8} more</span>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationBell;
