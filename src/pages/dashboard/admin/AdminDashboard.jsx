import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart3, Users, Store, ShieldAlert, Settings, LogOut,
    TrendingUp, IndianRupee, Activity, ChevronRight, Ban, CheckCircle,
    Search, ClipboardList, Check, X, Trash2, Eye, RefreshCw, MessageSquare, CreditCard, Clock, Star
} from 'lucide-react';
import api from '@/services/api';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout, loadUser } from '@/app/features/authSlice';
import { fetchNotifications } from '@/app/features/notificationSlice';
import { io } from 'socket.io-client';

// ─── Confirmation Modal ───────────────────────────────────────────────────────
const ConfirmModal = ({ message, onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-zinc-900 border border-red-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl"
        >
            <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                    <Trash2 size={20} className="text-red-400" />
                </div>
                <div>
                    <h3 className="text-white font-semibold text-lg">Confirm Action</h3>
                    <p className="text-zinc-400 text-sm mt-1">{message}</p>
                </div>
            </div>
            <div className="flex gap-3">
                <button onClick={onCancel} className="flex-1 px-4 py-2 bg-white/5 text-white rounded-xl hover:bg-white/10 transition-colors border border-white/10">
                    Cancel
                </button>
                <button onClick={onConfirm} className="flex-1 px-4 py-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors border border-red-500/30 font-medium">
                    Delete Permanently
                </button>
            </div>
        </motion.div>
    </div>
);

// ─── Reject Modal ─────────────────────────────────────────────────────────────
const RejectModal = ({ onConfirm, onCancel }) => {
    const [reason, setReason] = useState('');
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-zinc-900 border border-red-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl"
            >
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                        <X size={20} className="text-red-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-semibold text-lg">Reject Application</h3>
                        <p className="text-zinc-400 text-sm mt-1">Please provide a reason for rejection. This will be emailed to the owner.</p>
                    </div>
                </div>
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter rejection reason (required)..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm mb-6 focus:outline-none focus:border-red-500/50 min-h-[120px]"
                />
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 px-4 py-2 bg-white/5 text-white rounded-xl hover:bg-white/10 transition-colors border border-white/10">
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(reason)}
                        disabled={!reason.trim()}
                        className="flex-1 px-4 py-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors border border-red-500/30 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Submit Rejection
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

// ─── Application Detail Modal ─────────────────────────────────────────────────
const AppDetailModal = ({ app, onClose, onApprove, onReject, onDelete }) => (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-zinc-900 border border-white/10 rounded-2xl p-8 max-w-2xl w-full shadow-2xl my-8"
        >
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-2xl font-serif text-white">{app.restaurantName}</h2>
                    <span className={`mt-1 inline-block px-2 py-0.5 rounded text-xs ${app.status === 'approved' ? 'bg-green-500/10 text-green-400' : app.status === 'rejected' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                        {app.status.toUpperCase()}
                    </span>
                </div>
                <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors p-1"><X size={20} /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-3">
                    <h3 className="text-xs text-zinc-500 uppercase tracking-widest font-medium">Administrative Contact</h3>
                    <div className="bg-black/30 rounded-xl p-4 space-y-2">
                        <p className="text-white font-medium">{app.ownerName}</p>
                        <p className="text-amber-400 text-sm">{app.email}</p>
                        <p className="text-zinc-400 text-sm">{app.phone}</p>
                    </div>
                </div>
                <div className="space-y-3">
                    <h3 className="text-xs text-zinc-500 uppercase tracking-widest font-medium">Restaurant Details</h3>
                    <div className="bg-black/30 rounded-xl p-4 space-y-2">
                        <p className="text-white text-sm"><span className="text-zinc-500">Cuisine:</span> {app.cuisine}</p>
                        <p className="text-white text-sm"><span className="text-zinc-500">Location:</span> {app.location}</p>
                        <p className="text-white text-sm"><span className="text-zinc-500">Tables:</span> {app.tables}</p>
                        <p className="text-white text-sm"><span className="text-zinc-500">Facilities:</span> {Array.isArray(app.facilities) ? app.facilities.join(', ') : app.facilities}</p>
                    </div>
                </div>
            </div>

            <div className="mb-6">
                <h3 className="text-xs text-zinc-500 uppercase tracking-widest font-medium mb-3">Concept Description</h3>
                <p className="text-zinc-300 text-sm bg-black/30 rounded-xl p-4">{app.description}</p>
            </div>

            {app.status === 'rejected' && app.rejectionReason && (
                <div className="mb-6">
                    <h3 className="text-xs text-red-500 uppercase tracking-widest font-medium mb-3">Rejection Reason</h3>
                    <p className="text-red-200 text-sm bg-red-500/5 border border-red-500/20 rounded-xl p-4 italic">"{app.rejectionReason}"</p>
                </div>
            )}

            {app.images && app.images.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-xs text-zinc-500 uppercase tracking-widest font-medium mb-3">Restaurant Images</h3>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                        {app.images.map((img, i) => (
                            <img key={i} src={img} alt={`img-${i}`}
                                className="w-28 h-20 object-cover rounded-lg border border-white/10 flex-shrink-0"
                                onError={e => { e.target.src = 'https://placehold.co/112x80/1a1a1a/555?text=No+Image'; }}
                            />
                        ))}
                    </div>
                </div>
            )}

            {app.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t border-white/10">
                    <button onClick={() => onApprove(app._id)} className="flex-1 px-4 py-2.5 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-xl text-sm font-medium border border-green-500/30 flex items-center justify-center gap-2">
                        <Check size={16} /> Approve
                    </button>
                    <button onClick={() => onReject(app._id)} className="flex-1 px-4 py-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl text-sm font-medium border border-red-500/30 flex items-center justify-center gap-2">
                        <X size={16} /> Reject
                    </button>
                    <button onClick={() => onDelete(app._id)} className="px-4 py-2.5 bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-xl text-sm font-medium border border-white/10 flex items-center gap-2">
                        <Trash2 size={16} /> Delete
                    </button>
                </div>
            )}
            {app.status !== 'pending' && (
                <div className="flex gap-3 pt-4 border-t border-white/10">
                    <button onClick={() => onDelete(app._id)} className="px-4 py-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl text-sm font-medium border border-red-500/30 flex items-center gap-2">
                        <Trash2 size={16} /> Delete Application
                    </button>
                </div>
            )}
        </motion.div>
    </div>
);

// ─── Ticket Detail Modal ──────────────────────────────────────────────────────
const TicketDetailModal = ({ ticket, onClose, onReply }) => {
    const [reply, setReply] = useState('');
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-zinc-900 border border-white/10 rounded-2xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-start items-center mb-6 gap-4">
                    <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors p-1"><X size={20} /></button>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-xl font-bold text-white">{ticket.ticketId}</h2>
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${ticket.status === 'Open' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : ticket.status === 'In Progress' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                                {ticket.status}
                            </span>
                        </div>
                        <p className="text-amber-500 text-sm font-medium">{ticket.category} • <span className="text-zinc-500">From: {ticket.userId?.name || 'User'}</span></p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2 custom-scrollbar">
                    <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                        <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-2">Original Issue</p>
                        <p className="text-zinc-200 text-sm whitespace-pre-wrap">{ticket.description}</p>
                        {ticket.image && (
                            <div className="mt-4">
                                <a href={`http://localhost:5000${ticket.image}`} target="_blank" rel="noopener noreferrer">
                                    <img src={`http://localhost:5000${ticket.image}`} alt="Attachment" className="max-w-xs h-32 object-cover rounded-lg border border-white/10 hover:opacity-80 transition-opacity" />
                                </a >
                            </div >
                        )}
                        <p className="text-[10px] text-zinc-600 mt-2">{new Date(ticket.createdAt).toLocaleString()}</p>
                    </div >

                    {
                        ticket.messages && ticket.messages.map((msg, i) => (
                            <div key={i} className={`p-4 rounded-xl text-sm ${msg.senderId === ticket.userId?._id ? 'bg-white/5 border border-white/5 ml-8' : 'bg-amber-500/5 border border-amber-500/10 text-amber-200 mr-8'}`}>
                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">{msg.senderId === ticket.userId?._id ? 'Customer' : 'Support Team'}</p>
                                <p>{msg.message}</p>
                                <p className="text-[10px] text-zinc-600 mt-2">{new Date(msg.timestamp).toLocaleString()}</p>
                            </div>
                        ))
                    }
                </div >

                {
                    ticket.status !== 'Resolved' && (
                        <div className="space-y-4 pt-4 border-t border-white/10">
                            <textarea
                                value={reply}
                                onChange={e => setReply(e.target.value)}
                                placeholder="Type your response here..."
                                className="w-full bg-zinc-950 border border-white/10 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-amber-500 min-h-[100px] resize-none"
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={() => { onReply(ticket._id, reply, 'Resolved'); onClose(); }}
                                    className="px-6 py-2.5 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-xl text-sm font-medium border border-green-500/30 flex-1"
                                >
                                    Resolve & Reply
                                </button>
                                <button
                                    onClick={() => { onReply(ticket._id, reply, 'In Progress'); onClose(); }}
                                    disabled={!reply.trim()}
                                    className="px-6 py-2.5 bg-amber-500 text-black hover:bg-amber-400 rounded-xl text-sm font-medium transition-colors flex-[2] disabled:opacity-50"
                                >
                                    Send Reply
                                </button>
                            </div>
                        </div>
                    )
                }
            </motion.div >
        </div >
    );
};

// ─── Stat Card Component ───────────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, color = 'text-white' }) => (
    <div className="bg-black/20 border border-white/10 p-6 rounded-xl hover:border-white/30 transition-colors">
        <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-white/5 rounded-lg text-white">
                <Icon size={20} />
            </div>
        </div>
        <h3 className="text-zinc-400 font-medium text-sm mb-1">{label}</h3>
        <p className={`text-3xl font-serif ${color}`}>{value}</p>
    </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────
const AdminDashboard = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('analytics');

    // Health and Logs state
    const [systemHealth, setSystemHealth] = useState(null);
    const [activityLogs, setActivityLogs] = useState([]);
    const [healthLoading, setHealthLoading] = useState(false);
    const [logsLoading, setLogsLoading] = useState(false);

    // Data state
    const [analytics, setAnalytics] = useState(null);
    const [users, setUsers] = useState([]);
    const [restaurants, setRestaurants] = useState([]);
    const [applications, setApplications] = useState([]);
    const [payments, setPayments] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [adminPromotions, setAdminPromotions] = useState([]);

    // UI state
    const [loading, setLoading] = useState(false);
    const [searchUser, setSearchUser] = useState('');
    const [selectedApp, setSelectedApp] = useState(null);
    const [rejectingId, setRejectingId] = useState(null);
    const [confirmAction, setConfirmAction] = useState(null); // { message, onConfirm }
    const [tickets, setTickets] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [ticketFilter, setTicketFilter] = useState('All'); // All, Open, In Progress, Resolved

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchUser.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchUser.toLowerCase())
    );

    // ── Data Fetchers ─────────────────────────────────────────────────────────
    const fetchAnalytics = useCallback(async () => {
        try {
            const res = await api.get('admin/analytics');
            setAnalytics(res.data);
        } catch (e) { console.error('Analytics fetch failed', e); }
    }, []);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('admin/users');
            setUsers(res.data);
        } catch (e) { console.error('Users fetch failed', e); }
        finally { setLoading(false); }
    }, []);

    const fetchRestaurants = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('admin/restaurants');
            setRestaurants(res.data);
        } catch (e) { console.error('Restaurants fetch failed', e); }
        finally { setLoading(false); }
    }, []);

    const fetchApplications = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('admin/owner-applications');
            setApplications(res.data);
        } catch (e) { console.error('Applications fetch failed', e); }
        finally { setLoading(false); }
    }, []);

    const fetchTickets = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('support/admin');
            setTickets(res.data);
        } catch (e) { console.error('Tickets fetch failed', e); }
        finally { setLoading(false); }
    }, []);

    const fetchPayments = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('admin/payments');
            setPayments(res.data);
        } catch (e) { console.error('Payments fetch failed', e); }
        finally { setLoading(false); }
    }, []);

    const fetchReservations = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('admin/reservations');
            setReservations(res.data);
        } catch (e) { console.error('Reservations fetch failed', e); }
        finally { setLoading(false); }
    }, []);

    const fetchActivityLogs = useCallback(async () => {
        setLogsLoading(true);
        try {
            const res = await api.get('system/logs');
            setActivityLogs(res.data);
        } catch (e) { console.error('Logs fetch failed', e); }
        finally { setLogsLoading(false); }
    }, []);

    const fetchSystemHealth = useCallback(async () => {
        setHealthLoading(true);
        try {
            const res = await api.get('system/health');
            setSystemHealth(res.data);
        } catch (e) { console.error('Health fetch failed', e); }
        finally { setHealthLoading(false); }
    }, []);

    const fetchAdminPromotionsData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('promotions/admin');
            setAdminPromotions(res.data);
        } catch (e) { console.error('Promotions fetch failed', e); }
        finally { setLoading(false); }
    }, []);

    // ── Tab effect ─────────────────────────────────────────────────────────────
    const activeTabRef = useRef(activeTab);
    useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);

    useEffect(() => {
        if (activeTab === 'analytics') fetchAnalytics();
        if (activeTab === 'users') fetchUsers();
        if (activeTab === 'restaurants') fetchRestaurants();
        if (activeTab === 'applications') fetchApplications();
        if (activeTab === 'support') fetchTickets();
        if (activeTab === 'payments') fetchPayments();
        if (activeTab === 'reservations') fetchReservations();
        if (activeTab === 'promotions') fetchAdminPromotionsData();
    }, [activeTab, fetchAdminPromotionsData]);

    useEffect(() => {
        if (activeTab === 'logs') fetchActivityLogs();
        if (activeTab === 'health') fetchSystemHealth();
    }, [activeTab, fetchActivityLogs, fetchSystemHealth]);

    useEffect(() => {
        const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
        const socket = io(SOCKET_URL);

        socket.on('ticketCreated', () => {
            if (activeTabRef.current === 'support') fetchTickets();
        });

        socket.on('ticketUpdated', () => {
            if (activeTabRef.current === 'support') fetchTickets();
        });

        socket.on('ticketClosed', () => {
            if (activeTabRef.current === 'support') fetchTickets();
        });

        socket.on('dataUpdated', (data) => {
            if (data.type === 'restaurantApproved' && activeTabRef.current === 'restaurants') fetchRestaurants();
            if (data.type === 'restaurantDeleted' && activeTabRef.current === 'restaurants') fetchRestaurants();
            if (data.type === 'userSuspended' && activeTabRef.current === 'users') fetchUsers();
            if (data.type === 'userActivated' && activeTabRef.current === 'users') fetchUsers();
            if (data.type === 'userDeleted' && activeTabRef.current === 'users') fetchUsers();
            if (data.type === 'applicationDeleted' && activeTabRef.current === 'applications') fetchApplications();
            if (data.type === 'promotionUpdated' && activeTabRef.current === 'promotions') fetchAdminPromotionsData();
            if (data.type === 'promotionCreated' && activeTabRef.current === 'promotions') fetchAdminPromotionsData();
        });

        // Global update: refresh whatever tab is active
        socket.on('globalUpdate', () => {
            const tab = activeTabRef.current;

            // Core data sync
            dispatch(loadUser());
            dispatch(fetchNotifications());

            // Tab specific data sync
            if (tab === 'analytics') fetchAnalytics();
            else if (tab === 'users') fetchUsers();
            else if (tab === 'restaurants') fetchRestaurants();
            else if (tab === 'applications') fetchApplications();
            else if (tab === 'support') fetchTickets();
            else if (tab === 'payments') fetchPayments();
            else if (tab === 'reservations') fetchReservations();
            else if (tab === 'promotions') fetchAdminPromotionsData();
            else if (tab === 'logs') fetchActivityLogs();
            else if (tab === 'health') fetchSystemHealth();
        });

        return () => socket.disconnect();
    }, [fetchTickets, fetchRestaurants, fetchUsers, fetchApplications, fetchAnalytics, fetchPayments, fetchReservations, fetchAdminPromotionsData]);

    // ── Approve / Reject / Delete Application ─────────────────────────────────
    const handleApprove = async (id) => {
        try { await api.put(`admin/owner/${id}/approve`); setSelectedApp(null); fetchApplications(); }
        catch (e) { console.error(e); }
    };
    const handleReject = async (id, reason) => {
        try {
            await api.put(`admin/owner/${id}/reject`, { reason });
            setRejectingId(null);
            setSelectedApp(null);
            fetchApplications();
        }
        catch (e) { console.error(e); }
    };
    const handleDeleteApp = (id) => {
        setConfirmAction({
            message: 'Permanently delete this partner application? This cannot be undone.',
            onConfirm: async () => {
                await api.delete(`admin/owner-applications/${id}`);
                setSelectedApp(null); setConfirmAction(null); fetchApplications();
            }
        });
    };

    // ── User Actions ──────────────────────────────────────────────────────────
    const handleSuspendUser = async (id) => {
        try { await api.put(`admin/users/${id}/suspend`); fetchUsers(); }
        catch (e) { console.error(e); }
    };
    const handleActivateUser = async (id) => {
        try { await api.put(`admin/users/${id}/activate`); fetchUsers(); }
        catch (e) { console.error(e); }
    };
    const handleDeleteUser = (id, name) => {
        setConfirmAction({
            message: `Delete user "${name}" and all their data (reservations, reviews)? This cannot be undone.`,
            onConfirm: async () => {
                await api.delete(`admin/users/${id}`);
                setConfirmAction(null); fetchUsers();
            }
        });
    };

    // ── Restaurant Actions ─────────────────────────────────────────────────────
    const handleDeleteRestaurant = (id, name) => {
        setConfirmAction({
            message: `Delete "${name}" and all its data (menus, slots, packages, reservations)? This cannot be undone.`,
            onConfirm: async () => {
                await api.delete(`admin/restaurants/${id}`);
                setConfirmAction(null); fetchRestaurants();
            }
        });
    };

    const handleRoleChange = async (id, role) => {
        try {
            await api.put(`admin/users/${id}/role`, { role });
            fetchUsers();
        } catch (e) { console.error(e); }
    };

    const handleUpdateReservationStatus = async (id, status) => {
        try {
            await api.put(`admin/reservations/${id}/status`, { status });
            fetchReservations();
        } catch (e) { console.error(e); }
    };

    const handleDeleteReservation = (id) => {
        setConfirmAction({
            message: 'Permanently delete this reservation? This cannot be undone.',
            onConfirm: async () => {
                await api.delete(`reservations/${id}`); // Assuming generic delete works
                setConfirmAction(null);
                fetchReservations();
            }
        });
    };

    // ── Tab Components ────────────────────────────────────────────────────────
    const UsersTab = () => (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <h2 className="text-2xl font-serif text-white">Users Management</h2>
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                    <input
                        type="text"
                        placeholder="Search name or email..."
                        value={searchUser}
                        onChange={(e) => setSearchUser(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-amber-500/50"
                    />
                </div>
            </div>
            {loading ? (
                <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/10 text-zinc-400 text-xs uppercase tracking-wider">
                                <th className="pb-4 font-medium">User</th>
                                <th className="pb-4 font-medium">Role</th>
                                <th className="pb-4 font-medium">Status</th>
                                <th className="pb-4 font-medium">Joined</th>
                                <th className="pb-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {filteredUsers.map(u => (
                                <tr key={u._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 font-bold text-xs">
                                                {u.name?.[0]?.toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="text-white font-medium">{u.name}</div>
                                                <div className="text-xs text-zinc-500">{u.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4">
                                        <select
                                            value={u.role}
                                            onChange={(e) => handleRoleChange(u._id, e.target.value)}
                                            className="bg-transparent text-zinc-300 text-xs focus:outline-none cursor-pointer hover:text-amber-400 transition-colors"
                                        >
                                            <option value="user" className="bg-zinc-900">User</option>
                                            <option value="owner" className="bg-zinc-900">Owner</option>
                                            <option value="admin" className="bg-zinc-900">Admin</option>
                                        </select>
                                    </td>
                                    <td className="py-4">
                                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${u.isSuspended ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                                            {u.isSuspended ? 'Suspended' : 'Active'}
                                        </span>
                                    </td>
                                    <td className="py-4 text-zinc-400 text-xs">
                                        {new Date(u.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {u.isSuspended ? (
                                                <button onClick={() => handleActivateUser(u._id)} title="Activate User" className="p-2 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 border border-green-500/20"><CheckCircle size={14} /></button>
                                            ) : (
                                                <button onClick={() => handleSuspendUser(u._id)} title="Suspend User" className="p-2 bg-yellow-500/10 text-yellow-500 rounded-lg hover:bg-yellow-500/20 border border-yellow-500/20"><Ban size={14} /></button>
                                            )}
                                            <button onClick={() => handleDeleteUser(u._id, u.name)} title="Delete User" className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 border border-red-500/20"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );

    const LogsTab = () => (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-serif text-white">Activity Logs</h2>
                <button onClick={fetchActivityLogs} className="text-zinc-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg">
                    <RefreshCw size={16} className={logsLoading ? 'animate-spin' : ''} />
                </button>
            </div>
            {logsLoading ? (
                <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : (
                <div className="space-y-3">
                    {activityLogs.map((log, i) => (
                        <div key={log._id || i} className="p-4 bg-black/20 border border-white/5 rounded-xl flex items-start justify-between group hover:border-white/20 transition-all">
                            <div className="flex gap-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${log.action?.includes('Delete') ? 'bg-red-500/10 text-red-400' : log.action?.includes('Approve') ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                    <ClipboardList size={18} />
                                </div>
                                <div>
                                    <p className="text-white text-sm font-medium">{log.action}</p>
                                    <p className="text-zinc-500 text-xs mt-1">
                                        User: <span className="text-amber-500">{log.userId?.name || 'System'}</span> • {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-zinc-600 text-[10px] uppercase font-bold tracking-widest">{new Date(log.createdAt).toLocaleTimeString()}</p>
                                <p className="text-zinc-700 text-[10px] mt-1">{new Date(log.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                    ))}
                    {activityLogs.length === 0 && <div className="text-center py-20 text-zinc-500 font-serif">No activity logs recorded.</div>}
                </div>
            )}
        </div>
    );

    const HealthTab = () => (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-serif text-white">System Health</h2>
                <button onClick={fetchSystemHealth} className="text-zinc-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg">
                    <RefreshCw size={16} className={healthLoading ? 'animate-spin' : ''} />
                </button>
            </div>
            {healthLoading || !systemHealth ? (
                <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-black/20 border border-white/10 p-6 rounded-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Activity size={80} />
                        </div>
                        <h3 className="text-zinc-500 font-medium text-xs uppercase tracking-widest mb-6 border-b border-white/5 pb-2">Server Status</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-zinc-400 text-sm">Main API Status</span>
                                <span className="flex items-center text-green-400 text-xs font-bold uppercase"><span className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse" /> Operational</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-zinc-400 text-sm">Database</span>
                                <span className="text-white text-sm font-medium">{systemHealth.database}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-zinc-400 text-sm">Uptime</span>
                                <span className="text-white text-sm font-medium">{Math.floor(systemHealth.uptime / 3600)}h {Math.floor((systemHealth.uptime % 3600) / 60)}m</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-black/20 border border-white/10 p-6 rounded-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <BarChart3 size={80} />
                        </div>
                        <h3 className="text-zinc-500 font-medium text-xs uppercase tracking-widest mb-6 border-b border-white/5 pb-2">Environment</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-zinc-400 text-sm">Platform</span>
                                <span className="text-white text-sm font-medium uppercase font-mono">{systemHealth.platform}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-zinc-400 text-sm">CPU Cores</span>
                                <span className="text-white text-sm font-medium">{systemHealth.cpuCount}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-zinc-400 text-sm">Memory Usage</span>
                                <span className="text-white text-sm font-medium">{Math.round(systemHealth.memoryUsage?.heapUsed / 1024 / 1024)} MB</span>
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-2 bg-black/20 border border-white/10 p-6 rounded-2xl">
                        <h3 className="text-zinc-500 font-medium text-xs uppercase tracking-widest mb-4">Infrastructure Health</h3>
                        <div className="flex gap-1 h-2 outline outline-1 outline-white/5 rounded-full overflow-hidden">
                            {[...Array(40)].map((_, i) => (
                                <div key={i} className={`flex-1 ${i > 35 ? 'bg-amber-500/50' : 'bg-green-500/50'}`} />
                            ))}
                        </div>
                        <div className="flex justify-between mt-2 text-[10px] text-zinc-600 font-mono">
                            <span>24H History</span>
                            <span>99.98% SLA</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    // ── Format helpers ─────────────────────────────────────────────────────────
    const formatRupees = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

    const navItems = [
        { id: 'analytics', icon: BarChart3, label: 'Platform Analytics' },
        { id: 'users', icon: Users, label: 'Users Management' },
        { id: 'restaurants', icon: Store, label: 'Restaurants' },
        { id: 'reservations', icon: ClipboardList, label: 'Global Reservations' },
        { id: 'applications', icon: ClipboardList, label: 'Partner Applications' },
        { id: 'promotions', icon: Star, label: 'Promotion Requests' },
        { id: 'support', icon: MessageSquare, label: 'Support Tickets' },
        { id: 'payments', icon: CreditCard, label: 'Payments' },
        { id: 'moderation', icon: ShieldAlert, label: 'Moderation' },
        { id: 'logs', icon: ClipboardList, label: 'Activity Logs' },
        { id: 'health', icon: Activity, label: 'System Health' },
        { id: 'settings', icon: Settings, label: 'System Settings' },
    ];

    return (
        <div className="min-h-screen bg-zinc-950 pt-28 pb-16">
            {/* Confirm Modal */}
            <AnimatePresence>
                {confirmAction && (
                    <ConfirmModal
                        message={confirmAction.message}
                        onConfirm={confirmAction.onConfirm}
                        onCancel={() => setConfirmAction(null)}
                    />
                )}
            </AnimatePresence>

            {/* App Detail Modal */}
            <AnimatePresence>
                {selectedApp && (
                    <AppDetailModal
                        app={selectedApp}
                        onClose={() => setSelectedApp(null)}
                        onApprove={handleApprove}
                        onReject={handleReject}
                        onDelete={handleDeleteApp}
                    />
                )}
            </AnimatePresence>

            {/* Reject Modal */}
            <AnimatePresence>
                {rejectingId && (
                    <RejectModal
                        onConfirm={(reason) => handleReject(rejectingId, reason)}
                        onCancel={() => setRejectingId(null)}
                    />
                )}
            </AnimatePresence>

            {/* Ticket Detail Modal */}
            <AnimatePresence>
                {selectedTicket && (
                    <TicketDetailModal
                        ticket={selectedTicket}
                        onClose={() => setSelectedTicket(null)}
                        onReply={async (id, message, status) => {
                            try {
                                await api.put(`support/${id}/status`, { status, message });
                                fetchTickets();
                            } catch (e) { console.error(e); }
                        }}
                    />
                )}
            </AnimatePresence>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12 flex flex-col md:flex-row items-center md:items-start justify-between bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl relative overflow-hidden group"
                >
                    {/* Decorative Background Element */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none group-hover:bg-red-500/10 transition-all duration-700" />

                    <div className="flex items-center gap-8 relative z-10">
                        <div className="relative">
                            <div className="w-28 h-28 rounded-3xl bg-zinc-800 overflow-hidden flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.2)] border-2 border-red-500/50 transform rotate-3 group-hover:rotate-0 transition-transform duration-500">
                                <ShieldAlert size={48} className="text-red-500" />
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-red-500 rounded-2xl flex items-center justify-center border-4 border-zinc-900 shadow-lg transform -rotate-6">
                                <Activity size={18} className="text-white" />
                            </div>
                        </div>
                        <div>
                            <span className="text-red-500 font-medium tracking-[0.2em] uppercase text-[10px] mb-2 block bg-red-500/10 w-fit px-3 py-1 rounded-full border border-red-500/20">
                                System Oversight
                            </span>
                            <h1 className="text-4xl md:text-5xl font-serif text-white mb-3 tracking-tight">Console Command</h1>
                            <div className="flex flex-wrap items-center gap-4 text-zinc-400 text-sm">
                                <span className="flex items-center"><Users size={14} className="mr-2 text-white/40" /> Root Administrator</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-800 hidden md:block" />
                                <span className="flex items-center text-green-400/90 font-medium tracking-widest uppercase text-[10px]">
                                    <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
                                    Security Layer Active
                                </span>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => { dispatch(logout()); navigate('/'); }}
                        className="mt-8 md:mt-0 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-zinc-400 hover:text-red-400 hover:border-red-400/30 hover:bg-red-500/5 transition-all duration-300 flex items-center group font-medium relative z-10">
                        <LogOut size={16} className="mr-3 transform group-hover:-translate-x-1 transition-transform" /> Sign Out
                    </button>
                </motion.div>

                <div className="flex flex-col lg:flex-row gap-10">
                    {/* Sidebar */}
                    <div className="w-full lg:w-1/4">
                        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sticky top-32 space-y-2 shadow-2xl">
                            <div className="px-4 py-2 mb-2">
                                <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-zinc-600">Master Control</span>
                            </div>
                            {navItems.map(item => (
                                <button key={item.id} onClick={() => setActiveTab(item.id)}
                                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group ${activeTab === item.id ? 'bg-white/10 text-white shadow-[0_10px_20px_rgba(255,255,255,0.02)] border border-white/10' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}>
                                    <span className="flex items-center font-semibold"><item.icon size={20} className={`mr-4 ${activeTab === item.id ? 'text-white' : 'text-zinc-500 group-hover:text-white transition-colors'}`} />{item.label}</span>
                                    {activeTab === item.id && <ChevronRight size={16} />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="w-full lg:w-3/4">
                        <motion.div key={activeTab} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
                            className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-10 min-h-[600px] shadow-2xl">

                            {/* ── ANALYTICS ─────────────────────────────────────────── */}
                            {activeTab === 'analytics' && (
                                <div>
                                    <div className="flex justify-between items-center mb-8">
                                        <h2 className="text-2xl font-serif text-white">Platform Overview</h2>
                                        <button onClick={fetchAnalytics} className="text-zinc-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"><RefreshCw size={16} /></button>
                                    </div>
                                    {!analytics ? (
                                        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <StatCard label="Total Platform Revenue" value={formatRupees(analytics.totalRevenue)} icon={IndianRupee} color="text-green-400" />
                                            <StatCard label="Active Users (30d)" value={analytics.activeUsers?.toLocaleString('en-IN')} icon={Users} />
                                            <StatCard label="Approved Restaurants" value={analytics.approvedRestaurants} icon={Store} color="text-amber-400" />
                                            <StatCard label="Active Reservations" value={analytics.activeReservations} icon={Activity} color="text-blue-400" />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── USERS ─────────────────────────────────────────────── */}
                            {activeTab === 'users' && <UsersTab />}
                            {activeTab === 'logs' && <LogsTab />}
                            {activeTab === 'health' && <HealthTab />}

                            {/* ── RESTAURANTS ───────────────────────────────────────── */}
                            {activeTab === 'restaurants' && (
                                <div>
                                    <div className="flex justify-between items-center mb-8">
                                        <h2 className="text-2xl font-serif text-white">Partner Restaurants</h2>
                                        <button onClick={fetchRestaurants} className="text-zinc-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"><RefreshCw size={16} /></button>
                                    </div>
                                    {loading ? (
                                        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
                                    ) : (
                                        <div className="space-y-4">
                                            {restaurants.map(r => (
                                                <div key={r._id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-5 bg-black/20 border border-white/10 rounded-xl hover:border-white/30 transition-colors gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <h4 className="text-white font-medium text-lg">{r.name}</h4>
                                                            <span className={`px-2 py-0.5 rounded text-xs ${r.isApproved ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'}`}>
                                                                {r.isApproved ? 'Approved' : 'Pending'}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-zinc-400">Owner: <span className="text-amber-400">{r.ownerId?.name}</span> ({r.ownerId?.email})</p>
                                                        <p className="text-xs text-zinc-500 mt-1">{r.location} • {r.cuisine}</p>
                                                    </div>
                                                    <div className="flex items-center gap-6">
                                                        <div className="text-center">
                                                            <span className="block text-xl font-serif text-white">{r.avgRating > 0 ? r.avgRating : '–'}</span>
                                                            <span className="text-xs text-zinc-400">Rating</span>
                                                        </div>
                                                        <div className="text-center">
                                                            <span className="block text-xl font-serif text-white">{r.bookingCount}</span>
                                                            <span className="text-xs text-zinc-400">Bookings</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {!r.isApproved ? (
                                                                <button onClick={() => handleApprove(r._id)} className="bg-green-500/10 text-green-400 p-2 rounded-lg hover:bg-green-500/20 transition-all border border-green-500/20"><CheckCircle size={18} /></button>
                                                            ) : (
                                                                <button onClick={() => handleDeleteRestaurant(r._id, r.name)} className="bg-red-500/10 text-red-400 p-2 rounded-lg hover:bg-red-500/20 transition-all border border-red-500/20"><Trash2 size={18} /></button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {restaurants.length === 0 && <div className="text-center py-20 text-zinc-500 font-serif">No restaurants registered yet.</div>}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── APPLICATIONS ──────────────────────────────────────── */}
                            {activeTab === 'applications' && (
                                <div>
                                    <div className="flex justify-between items-center mb-8">
                                        <h2 className="text-2xl font-serif text-white">Owner Applications</h2>
                                        <button onClick={fetchApplications} className="text-zinc-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"><RefreshCw size={16} /></button>
                                    </div>
                                    {loading ? (
                                        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {applications.filter(app => app.status === 'pending').map(app => (
                                                <div key={app._id} className="bg-black/20 border border-white/10 rounded-2xl p-6 hover:border-amber-500/30 transition-all group relative overflow-hidden">
                                                    <div className="flex justify-between items-start mb-6">
                                                        <div>
                                                            <h3 className="text-white font-serif text-lg group-hover:text-amber-500 transition-colors truncate pr-8">{app.restaurantName}</h3>
                                                            <p className="text-zinc-500 text-xs mt-1">{app.location}</p>
                                                        </div>
                                                        <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500"><Store size={20} /></div>
                                                    </div>
                                                    <div className="space-y-3 mb-8">
                                                        <div className="flex items-center text-xs text-zinc-400"><Users size={14} className="mr-2" /> {app.ownerName}</div>
                                                        <div className="flex items-center text-xs text-zinc-400"><IndianRupee size={14} className="mr-2" /> {app.cuisine}</div>
                                                        <div className="flex items-center text-xs text-zinc-400"><Clock size={14} className="mr-2" /> {new Date(app.createdAt).toLocaleDateString()}</div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => setSelectedApp(app)} className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg text-sm transition-colors border border-white/10">Details</button>
                                                        <button onClick={() => handleApprove(app._id)} className="flex-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 py-2 rounded-lg text-sm transition-colors border border-green-500/20">Approve</button>
                                                    </div>
                                                </div>
                                            ))}
                                            {applications.filter(app => app.status === 'pending').length === 0 && <div className="col-span-full text-center py-20 text-zinc-500 bg-white/5 border border-dashed border-white/10 rounded-2xl font-serif">All applications processed.</div>}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── SUPPORT TICKETS ──────────────────────────────────── */}
                            {activeTab === 'support' && (
                                <div>
                                    <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                                        <h2 className="text-2xl font-serif text-white">Support Tickets</h2>
                                        <div className="flex bg-black/40 p-1 rounded-xl border border-white/10">
                                            {['All', 'Open', 'In Progress', 'Resolved'].map(tab => (
                                                <button
                                                    key={tab}
                                                    onClick={() => setTicketFilter(tab)}
                                                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${ticketFilter === tab ? 'bg-amber-500 text-black shadow-[0_4px_12px_rgba(245,158,11,0.3)]' : 'text-zinc-500 hover:text-white'}`}
                                                >
                                                    {tab}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    {loading ? (
                                        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
                                    ) : (
                                        <div className="space-y-4">
                                            {tickets.filter(t => ticketFilter === 'All' || t.status === ticketFilter).map(t => (
                                                <div key={t._id} onClick={() => setSelectedTicket(t)} className="p-5 bg-black/20 border border-white/10 rounded-xl hover:border-white/30 transition-colors cursor-pointer group">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <div className="flex items-center gap-3 mb-1">
                                                                <h4 className="text-white font-medium group-hover:text-amber-400 transition-colors">#{t._id.slice(-6)}</h4>
                                                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${t.status?.toLowerCase() === 'open' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : t.status?.toLowerCase() === 'in-progress' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>{t.status}</span>
                                                            </div>
                                                            <p className="text-xs text-zinc-400"><span className="text-amber-500">{t.subject}</span> • {t.userId?.name || 'User'}</p>
                                                        </div>
                                                        <span className="text-zinc-500 text-xs">{new Date(t.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="text-zinc-400 text-sm line-clamp-1 mt-3 italic">"{t.description}"</p>
                                                    <div className="mt-4 flex justify-between items-center text-xs">
                                                        <span className="text-zinc-600">Last Message: {new Date(t.updatedAt).toLocaleTimeString()}</span>
                                                        <span className="text-amber-500 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                                                            Handle Ticket <ChevronRight size={14} />
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                            {tickets.length === 0 && <div className="text-center py-20 text-zinc-500 font-serif">No support tickets found.</div>}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── PAYMENTS ─────────────────────────────────────────── */}
                            {activeTab === 'payments' && (
                                <div>
                                    <div className="flex justify-between items-center mb-8">
                                        <h2 className="text-2xl font-serif text-white">Platform Payments</h2>
                                        <button onClick={fetchPayments} className="text-zinc-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"><RefreshCw size={16} /></button>
                                    </div>
                                    {loading ? (
                                        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr className="border-b border-white/10 text-zinc-400 text-xs uppercase tracking-wider">
                                                        <th className="pb-4 font-medium">Payment ID / Order ID</th>
                                                        <th className="pb-4 font-medium">User & Restaurant</th>
                                                        <th className="pb-4 font-medium">Amount</th>
                                                        <th className="pb-4 font-medium">Status</th>
                                                        <th className="pb-4 font-medium text-right">Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="text-sm">
                                                    {payments.map(p => (
                                                        <tr key={p._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                            <td className="py-4">
                                                                <div className="text-white font-mono text-[11px] mb-1"><span className="text-zinc-500 mr-2">PAY:</span>{p.razorpayPaymentId || 'PENDING'}</div>
                                                                <div className="text-white font-mono text-[11px]"><span className="text-zinc-500 mr-2">ORD:</span>{p.razorpayOrderId}</div>
                                                            </td>
                                                            <td className="py-4">
                                                                <div className="text-white font-medium">{p.reservationId?.userId?.name || 'Unknown User'}</div>
                                                                <div className="text-xs text-amber-500">{p.reservationId?.restaurantId?.name || 'Unknown Restaurant'}</div>
                                                            </td>
                                                            <td className="py-4 text-green-400 font-medium">{formatRupees(p.amount)}</td>
                                                            <td className="py-4">
                                                                <span className={`px-2 py-1 rounded text-xs ${p.paymentStatus === 'Captured' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                                                    {p.paymentStatus}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 text-zinc-400 text-right text-xs whitespace-nowrap">
                                                                {new Date(p.createdAt).toLocaleString('en-IN')}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {payments.length === 0 && !loading && (
                                                        <tr><td colSpan={5} className="py-12 text-center text-zinc-500">No payments found.</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── RESERVATIONS ─────────────────────────────────────── */}
                            {activeTab === 'reservations' && (
                                <div>
                                    <div className="flex justify-between items-center mb-8">
                                        <h2 className="text-2xl font-serif text-white">Global Booking Registry</h2>
                                        <button onClick={fetchReservations} className="text-zinc-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"><RefreshCw size={16} /></button>
                                    </div>
                                    {loading ? (
                                        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr className="border-b border-white/10 text-zinc-400 text-xs uppercase tracking-wider">
                                                        <th className="pb-4 font-medium">Reservation</th>
                                                        <th className="pb-4 font-medium">Details</th>
                                                        <th className="pb-4 font-medium">Payment</th>
                                                        <th className="pb-4 font-medium">Status</th>
                                                        <th className="pb-4 font-medium text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="text-sm">
                                                    {reservations.map(res => (
                                                        <tr key={res._id || res.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                                            <td className="py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-xl bg-white/5 overflow-hidden flex-shrink-0 border border-white/10 group-hover:border-amber-500/30 transition-colors">
                                                                        <img
                                                                            src={res.userId?.profileImage || `https://ui-avatars.com/api/?name=${res.userId?.name || 'User'}&background=random`}
                                                                            alt="user"
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-white font-medium">{res.userId?.name || 'Guest User'}</div>
                                                                        <div className="text-[10px] text-zinc-500 font-mono uppercase">ID: {res._id?.slice(-8).toUpperCase()}</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="py-4">
                                                                <div className="text-amber-500 font-medium">{res.restaurantId?.name}</div>
                                                                <div className="text-xs text-zinc-400 flex items-center mt-1">
                                                                    <CalendarIcon size={12} className="mr-1.5 opacity-50" />
                                                                    {new Date(res.date).toLocaleDateString()} at {res.time}
                                                                </div>
                                                            </td>
                                                            <td className="py-4">
                                                                <div className="text-white font-medium">{formatRupees(res.totalPaidNow)}</div>
                                                                <div className={`text-[10px] uppercase font-bold tracking-tighter mt-1 ${res.paymentStatus === 'Paid' ? 'text-green-500' : 'text-zinc-500'}`}>
                                                                    {res.paymentStatus || 'Offline'}
                                                                </div>
                                                            </td>
                                                            <td className="py-4">
                                                                <div className="flex flex-col gap-1.5">
                                                                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest w-fit ${res.status === 'confirmed' ? 'bg-green-500/10 text-green-400' :
                                                                            res.status === 'cancelled' ? 'bg-red-500/10 text-red-400' :
                                                                                res.status === 'completed' ? 'bg-blue-500/10 text-blue-400' :
                                                                                    res.status === 'payment_initiated' ? 'bg-amber-500/10 text-amber-500 animate-pulse' :
                                                                                        'bg-zinc-500/10 text-zinc-400'
                                                                        }`}>
                                                                        {res.status?.replace('_', ' ')}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="py-4 text-right">
                                                                <div className="flex justify-end gap-2">
                                                                    {res.status === 'confirmed' && (
                                                                        <button
                                                                            onClick={() => handleUpdateReservationStatus(res._id || res.id, 'completed')}
                                                                            className="p-1.5 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-md border border-green-500/20 transition-all"
                                                                            title="Mark Completed"
                                                                        >
                                                                            <Check size={14} />
                                                                        </button>
                                                                    )}
                                                                    {(res.status === 'confirmed' || res.status === 'payment_initiated') && (
                                                                        <button
                                                                            onClick={() => handleUpdateReservationStatus(res._id || res.id, 'cancelled')}
                                                                            className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-md border border-red-500/20 transition-all"
                                                                            title="Cancel Booking"
                                                                        >
                                                                            <X size={14} />
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        onClick={() => handleDeleteReservation(res._id || res.id)}
                                                                        className="p-1.5 bg-zinc-800 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-md border border-white/5 transition-all"
                                                                        title="Delete Record"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {reservations.length === 0 && (
                                                        <tr><td colSpan={5} className="py-20 text-center text-zinc-500 italic">No bookings found in registry.</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── PLACEHOLDERS ──────────────────────────────────────── */}
                            {(activeTab === 'moderation' || activeTab === 'settings') && (
                                <div className="h-full flex flex-col items-center justify-center text-center py-20">
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6 text-zinc-400">
                                        {activeTab === 'moderation' ? <ShieldAlert size={32} /> : <Settings size={32} />}
                                    </div>
                                    <h3 className="text-xl font-serif text-white mb-2">{activeTab === 'moderation' ? 'Content Moderation' : 'System Configuration'}</h3>
                                    <p className="text-zinc-400 max-w-sm">
                                        {activeTab === 'moderation' ? 'Review flagged comments, photos, and resolve support escalation tickets here.' : 'Manage global platform fees, API keys, and maintenance modes.'}
                                    </p>
                                </div>
                            )}

                            {/* ── PROMOTIONS ──────────────────────────────────────────── */}
                            {activeTab === 'promotions' && (
                                <div>
                                    <div className="flex justify-between items-center mb-8">
                                        <div>
                                            <h2 className="text-2xl font-serif text-white">Promotion Requests</h2>
                                            <p className="text-zinc-400 text-sm mt-1">Review and approve paid restaurant promotions.</p>
                                        </div>
                                        <button onClick={fetchAdminPromotionsData} className="text-zinc-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"><RefreshCw size={16} /></button>
                                    </div>

                                    {loading ? (
                                        <div className="flex justify-center py-20"><RefreshCw className="w-8 h-8 text-white animate-spin" /></div>
                                    ) : (
                                        <div className="space-y-4">
                                            {adminPromotions.map((promo) => (
                                                <div key={promo._id} className="bg-black/30 border border-white/5 rounded-2xl p-6 flex flex-col lg:flex-row justify-between lg:items-center gap-6 hover:border-white/10 transition-colors">
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <h3 className="text-lg font-medium text-white">{promo.restaurantId?.name || 'Unknown Restaurant'}</h3>
                                                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${promo.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : promo.status === 'active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : promo.status === 'expired' ? 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                                                {promo.status}
                                                            </span>
                                                        </div>
                                                        <div className="text-zinc-400 text-sm space-y-1">
                                                            <p><span className="text-zinc-500">Plan:</span> <span className="text-amber-400 font-medium">{promo.promotionType}</span></p>
                                                            <p><span className="text-zinc-500">Duration:</span> {new Date(promo.startDate).toLocaleDateString()} to {new Date(promo.endDate).toLocaleDateString()}</p>
                                                            <p><span className="text-zinc-500">Owner:</span> {promo.ownerId?.email || 'N/A'}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col lg:items-end gap-4">
                                                        <div className="text-left lg:text-right">
                                                            <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mb-1">Paid Amount</p>
                                                            <p className="text-xl font-serif text-white">₹{promo.amount?.toLocaleString()}</p>
                                                            <p className="text-zinc-600 text-[10px] font-mono mt-1">{promo.razorpayPaymentId}</p>
                                                        </div>
                                                        {promo.status === 'pending' && (
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={async () => {
                                                                        try {
                                                                            await api.put(`promotions/${promo._id}/reject`, { adminMessage: 'Management decided to reject this request.' });
                                                                            fetchAdminPromotionsData();
                                                                        } catch (e) {
                                                                            console.error(e);
                                                                        }
                                                                    }}
                                                                    className="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition-colors border border-red-500/20 text-sm font-medium"
                                                                >
                                                                    Reject
                                                                </button>
                                                                <button
                                                                    onClick={async () => {
                                                                        try {
                                                                            await api.put(`promotions/${promo._id}/approve`);
                                                                            fetchAdminPromotionsData();
                                                                        } catch (e) {
                                                                            console.error(e);
                                                                        }
                                                                    }}
                                                                    className="px-4 py-2 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-xl transition-colors border border-green-500/20 text-sm font-medium"
                                                                >
                                                                    Approve
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            {adminPromotions.length === 0 && !loading && (
                                                <div className="text-center py-10">
                                                    <p className="text-zinc-600">No promotion requests found.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
