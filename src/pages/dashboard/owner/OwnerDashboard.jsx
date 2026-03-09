import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, CalendarDays, UtensilsCrossed, MessageSquare, Settings, LogOut, TrendingUp, Users, DollarSign, ChevronRight, Edit2, Trash2, Plus, Gift, Check, X, Star, Loader2, RefreshCw, ShieldAlert, CreditCard, Clock } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOwnerRestaurant, updateRestaurant } from '@/app/features/restaurantSlice';
import { fetchPackagesByRestaurant, createPackage, deletePackage } from '@/app/features/packageSlice';
import { fetchOwnerReservations, updateReservationStatus, approveReservation, rejectReservation } from '@/app/features/reservationSlice';
import { fetchOwnerSlots, createSlot, deleteSlot } from '@/app/features/timeSlotSlice';
import { logout, updateProfile, loadUser } from '@/app/features/authSlice';
import { fetchUserTickets } from '@/app/features/supportSlice';
import { fetchNotifications } from '@/app/features/notificationSlice';
import { fetchOwnerPromotions, createPromotion } from '@/app/features/promotionSlice';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '@/services/api';

import { useAlert } from '@/context/AlertContext';

const OwnerDashboard = () => {
    const { showAlert } = useAlert();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('analytics');
    const { user, loading: authLoading } = useSelector((state) => state.auth);
    const { currentRestaurant: restaurant, loading: restLoading } = useSelector((state) => state.restaurants);
    const { list: packages, loading: packLoading, successMessage } = useSelector((state) => state.packages);
    const { list: reservations, loading: resLoading } = useSelector((state) => state.reservations);
    const { ownerSlots, loading: slotLoading } = useSelector((state) => state.timeSlots);
    const { ownerList: promotions, loading: promoLoading } = useSelector((state) => state.promotions);

    const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
    const [newPackage, setNewPackage] = useState({
        title: '',
        basePrice: '',
        description: '',
        maxCapacity: 2,
        isAvailable: true,
        decorationDetails: '',
        hasBuffet: false,
        guestOptions: [{ guests: 2, price: 0 }],
        advanceAmount: 0
    });

    const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
    const defaultCapacity = { twoSeater: 0, fourSeater: 0, sixSeater: 0, groupTable: 0 };
    const [newSlot, setNewSlot] = useState({ date: '', time: '', capacity: { ...defaultCapacity } });

    const handleRenewSubscription = async () => {
        if (!restaurant) return;
        setIsRenewing(true);
        try {
            const { data: orderData } = await api.post('subscriptions/order', { restaurantId: restaurant._id });

            const options = {
                key: orderData.key,
                amount: orderData.amount,
                currency: "INR",
                name: "Reserve SaaS",
                description: "Weekly Subscription Renewal",
                order_id: orderData.orderId,
                handler: async (response) => {
                    try {
                        await api.post('subscriptions/verify', {
                            ...response,
                            restaurantId: restaurant._id
                        });
                        showAlert({ type: 'success', title: 'Success', message: 'Subscription renewed successfully!' });
                        dispatch(fetchOwnerRestaurant()); // refresh
                    } catch (err) {
                        showAlert({ type: 'error', title: 'Verification Failed', message: 'Payment verification failed' });
                    }
                },
                theme: { color: "#F59E0B" }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error) {
            showAlert({ type: 'error', title: 'Error', message: 'Failed to initiate renewal' });
        } finally {
            setIsRenewing(false);
        }
    };

    // Reviews state
    const [ownerReviews, setOwnerReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState('');

    const fetchOwnerReviews = useCallback(async (restaurantId) => {
        if (!restaurantId) return;
        setReviewsLoading(true);
        try {
            const res = await api.get(`reviews/${restaurantId}`);
            setOwnerReviews(res.data);
        } catch (e) { console.error('Failed to fetch reviews', e); }
        finally { setReviewsLoading(false); }
    }, []);

    const handleDeleteReview = (reviewId) => {
        showAlert({
            type: 'warning',
            title: 'Delete Review',
            message: 'Are you sure you want to delete this review?',
            showCancel: true,
            confirmText: 'Delete',
            onConfirm: async () => {
                try {
                    await api.delete(`reviews/${reviewId}`);
                    setOwnerReviews(prev => prev.filter(r => r._id !== reviewId));
                    showAlert({ type: 'success', title: 'Success', message: 'Review deleted successfully!' });
                } catch (e) {
                    showAlert({ type: 'error', title: 'Error', message: 'Failed to delete review: ' + (e.response?.data?.message || e.message) });
                }
            }
        });
    };

    const handlePostReply = async (reviewId) => {
        if (!replyText.trim()) return;
        try {
            await api.put(`reviews/${reviewId}/reply`, { replyText });
            setOwnerReviews(prev => prev.map(r => r._id === reviewId ? { ...r, ownerReply: replyText } : r));
            setReplyingTo(null);
            setReplyText('');
            showAlert({ type: 'success', title: 'Success', message: 'Reply posted successfully!' });
        } catch (e) {
            showAlert({ type: 'error', title: 'Error', message: 'Failed to post reply' });
        }
    };

    // Profile Settings State
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        mobileNumber: user?.mobileNumber || ''
    });
    const [profileImage, setProfileImage] = useState(null);
    const [previewImage, setPreviewImage] = useState(user?.profileImage ? `http://localhost:5000${user.profileImage}` : null);
    const [updateMessage, setUpdateMessage] = useState({ type: '', text: '' });

    // Analytics state
    const [analytics, setAnalytics] = useState(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);

    // Restaurant Profile State
    const [restProfile, setRestProfile] = useState({
        name: '',
        cuisine: '',
        location: '',
        workingHours: { weekday: '', weekend: '' }
    });

    useEffect(() => {
        if (restaurant) {
            setRestProfile({
                name: restaurant.name || '',
                cuisine: restaurant.cuisine || '',
                location: restaurant.location || '',
                workingHours: restaurant.workingHours || { weekday: '11:00 AM - 11:00 PM', weekend: '11:00 AM - 12:00 AM' }
            });
        }
    }, [restaurant]);

    const handleSaveRestProfile = async (e) => {
        e.preventDefault();
        setUpdateMessage({ type: '', text: '' });
        try {
            await dispatch(updateRestaurant({ id: restaurant._id, data: restProfile })).unwrap();
            setUpdateMessage({ type: 'success', text: 'Restaurant profile updated successfully!' });
        } catch (error) {
            setUpdateMessage({ type: 'error', text: 'Failed to update restaurant profile: ' + (error?.message || error) });
        }
    };

    const fetchAnalytics = useCallback(async () => {
        setAnalyticsLoading(true);
        try {
            const res = await api.get('owner/analytics');
            setAnalytics(res.data);
        } catch (e) {
            console.error('Failed to fetch analytics', e);
        } finally {
            setAnalyticsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (restaurant?._id) {
            fetchAnalytics();
        }
    }, [restaurant?._id, fetchAnalytics]);

    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

    // Subscription Renewal State
    const [isRenewing, setIsRenewing] = useState(false);
    const [subscriptionHistory, setSubscriptionHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const fetchSubscriptionHistory = useCallback(async () => {
        if (!restaurant?._id) return;
        setHistoryLoading(true);
        try {
            const res = await api.get(`subscriptions/history/${restaurant._id}`);
            setSubscriptionHistory(res.data);
        } catch (e) {
            console.error('Failed to fetch subscription history', e);
        } finally {
            setHistoryLoading(false);
        }
    }, [restaurant?._id]);

    useEffect(() => {
        if (activeTab === 'subscription' && restaurant?._id) {
            fetchSubscriptionHistory();
        }
    }, [activeTab, restaurant?._id, fetchSubscriptionHistory]);

    // Update local state if Redux user updates
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                mobileNumber: user.mobileNumber || ''
            });
            if (user.profileImage) {
                setPreviewImage(`http://localhost:5000${user.profileImage}`);
            }
        }
    }, [user]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfileImage(file);
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setUpdateMessage({ type: '', text: '' });

        const data = new FormData();
        data.append('name', formData.name);
        data.append('email', formData.email);
        data.append('mobileNumber', formData.mobileNumber);
        if (profileImage) {
            data.append('profileImage', profileImage);
        }

        try {
            await dispatch(updateProfile(data)).unwrap();
            setUpdateMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error) {
            setUpdateMessage({ type: 'error', text: error || 'Failed to update profile.' });
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPasswordMsg({ type: '', text: '' });

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            return setPasswordMsg({ type: 'error', text: 'New passwords do not match!' });
        }

        try {
            await api.post('auth/change-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            setPasswordMsg({ type: 'success', text: 'Password changed successfully!' });
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            setPasswordMsg({ type: 'error', text: error.response?.data?.message || 'Failed to change password.' });
        }
    };

    const [tableConfig, setTableConfig] = useState({
        twoSeaterTables: 0, fourSeaterTables: 0, sixSeaterTables: 0, groupTables: 0
    });
    const [tableConfigMsg, setTableConfigMsg] = useState({ type: '', text: '' });

    useEffect(() => {
        if (restaurant?.tableConfig) {
            setTableConfig({
                twoSeaterTables: restaurant.tableConfig.twoSeaterTables || 0,
                fourSeaterTables: restaurant.tableConfig.fourSeaterTables || 0,
                sixSeaterTables: restaurant.tableConfig.sixSeaterTables || 0,
                groupTables: restaurant.tableConfig.groupTables || 0,
            });
        }
    }, [restaurant]);

    const handleSaveTableConfig = async (e) => {
        e.preventDefault();
        if (!restaurant?._id) return;
        setTableConfigMsg({ type: '', text: '' });
        try {
            await dispatch(updateRestaurant({ id: restaurant._id, data: { tableConfig } })).unwrap();
            await dispatch(fetchOwnerRestaurant()).unwrap();
            setTableConfigMsg({ type: 'success', text: 'Table configuration saved!' });
        } catch (err) {
            setTableConfigMsg({ type: 'error', text: err || 'Failed to save table config.' });
        }
    };

    useEffect(() => {
        if (!restaurant) {
            dispatch(fetchOwnerRestaurant());
        } else if (restaurant._id) {
            dispatch(fetchPackagesByRestaurant(restaurant._id));
            dispatch(fetchOwnerReservations());
            dispatch(fetchOwnerSlots());
            dispatch(fetchOwnerPromotions());
        }
    }, [dispatch, restaurant]);

    useEffect(() => {
        if (activeTab === 'reviews' && restaurant?._id) {
            fetchOwnerReviews(restaurant._id);
        }
    }, [activeTab, restaurant?._id, fetchOwnerReviews]);

    const activeTabRef = useRef(activeTab);
    useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);

    useEffect(() => {
        if (restaurant?._id) {
            const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
            const socket = io(SOCKET_URL);

            socket.emit('joinRestaurant', restaurant._id);

            socket.on('reservationUpdated', (data) => {
                if (data.restaurantId === restaurant._id.toString()) {
                    dispatch(fetchOwnerReservations());
                }
            });

            // Real-time: new booking just confirmed by a guest
            socket.on('newReservation', (data) => {
                const myId = restaurant.ownerId?.toString?.() || '';
                if (
                    data.restaurantId?.toString() === restaurant._id.toString() ||
                    (myId && data.ownerId?.toString() === myId)
                ) {
                    dispatch(fetchOwnerReservations());
                }
            });

            socket.on('slotUpdated', (data) => {
                if (data.restaurantId === restaurant._id.toString()) {
                    dispatch(fetchOwnerSlots());
                }
            });

            socket.on('ticketCreated', () => {
                if (activeTabRef.current === 'support') dispatch(fetchUserTickets());
            });

            socket.on('ticketUpdated', () => {
                if (activeTabRef.current === 'support') dispatch(fetchUserTickets());
            });

            socket.on('reviewUpdated', (data) => {
                // For simplicity just matching ID
                if (data.restaurantId === restaurant._id.toString() && activeTabRef.current === 'reviews') {
                    fetchOwnerReviews(restaurant._id);
                }
            });

            socket.on('globalUpdate', () => {
                dispatch(fetchOwnerRestaurant());
                dispatch(fetchOwnerReservations());
                dispatch(fetchOwnerSlots());
                dispatch(fetchNotifications());
                dispatch(fetchOwnerPromotions());
                dispatch(loadUser());
                if (activeTabRef.current === 'support') dispatch(fetchUserTickets());
            });

            return () => socket.disconnect();
        }
    }, [restaurant?._id, dispatch, fetchOwnerReviews]);

    const handleCreatePackage = async () => {
        if (restaurant?._id) {
            try {
                await dispatch(createPackage({ ...newPackage, restaurantId: restaurant._id })).unwrap();
                await dispatch(fetchPackagesByRestaurant(restaurant._id)).unwrap(); // Force refresh list
                setIsPackageModalOpen(false);
                setNewPackage({
                    title: '',
                    basePrice: '',
                    description: '',
                    maxCapacity: 2,
                    isAvailable: true,
                    decorationDetails: '',
                    hasBuffet: false,
                    guestOptions: [{ guests: 2, price: 0 }],
                    advanceAmount: 0
                });
                showAlert({ type: 'success', title: 'Success', message: 'Package created successfully!' });
            } catch (error) {
                showAlert({ type: 'error', title: 'Error', message: 'Failed to create package: ' + error });
            }
        }
    };

    const handleDeletePackage = (id) => {
        showAlert({
            type: 'warning',
            title: 'Delete Package',
            message: 'Are you sure you want to delete this package?',
            showCancel: true,
            confirmText: 'Delete',
            onConfirm: async () => {
                try {
                    await dispatch(deletePackage(id)).unwrap();
                    showAlert({ type: 'success', title: 'Success', message: 'Package deleted successfully!' });
                } catch (error) {
                    showAlert({ type: 'error', title: 'Error', message: 'Failed to delete package: ' + error });
                }
            }
        });
    };

    const handleCreateSlot = async () => {
        if (restaurant?._id) {
            // Validation: Ensure capacities don't exceed restaurant's defined tables
            const config = restaurant.tableConfig || {};
            const { twoSeater, fourSeater, sixSeater, groupTable } = newSlot.capacity;

            if (twoSeater > (config.twoSeaterTables || 0)) {
                showAlert({ type: 'warning', title: 'Capacity Exceeded', message: `Cannot set 2-seater capacity to ${twoSeater}. Your restaurant only has ${config.twoSeaterTables || 0} such tables.` });
                return;
            }
            if (fourSeater > (config.fourSeaterTables || 0)) {
                showAlert({ type: 'warning', title: 'Capacity Exceeded', message: `Cannot set 4-seater capacity to ${fourSeater}. Your restaurant only has ${config.fourSeaterTables || 0} such tables.` });
                return;
            }
            if (sixSeater > (config.sixSeaterTables || 0)) {
                showAlert({ type: 'warning', title: 'Capacity Exceeded', message: `Cannot set 6-seater capacity to ${sixSeater}. Your restaurant only has ${config.sixSeaterTables || 0} such tables.` });
                return;
            }
            if (groupTable > (config.groupTables || 0)) {
                showAlert({ type: 'warning', title: 'Capacity Exceeded', message: `Cannot set Group Table capacity to ${groupTable}. Your restaurant only has ${config.groupTables || 0} such tables.` });
                return;
            }

            if (!twoSeater && !fourSeater && !sixSeater && !groupTable) {
                showAlert({ type: 'warning', title: 'Capacity Required', message: "Please set capacity for at least one table type." });
                return;
            }

            try {
                await dispatch(createSlot({ ...newSlot, restaurantId: restaurant._id })).unwrap();
                setIsSlotModalOpen(false);
                setNewSlot({ date: '', time: '', capacity: { twoSeater: 0, fourSeater: 0, sixSeater: 0, groupTable: 0 } });
                showAlert({ type: 'success', title: 'Success', message: 'Slot created successfully!' });
            } catch (error) {
                showAlert({ type: 'error', title: 'Error', message: "Failed to create slot: " + error });
            }
        }
    };

    const handleDeleteSlot = async (id) => {
        showAlert({
            type: 'warning',
            title: 'Delete Slot',
            message: 'Are you sure you want to delete this slot? Active bookings may cause an error.',
            showCancel: true,
            confirmText: 'Delete',
            onConfirm: async () => {
                try {
                    await dispatch(deleteSlot(id)).unwrap();
                    showAlert({ type: 'success', title: 'Success', message: 'Slot deleted successfully!' });
                } catch (error) {
                    showAlert({ type: 'error', title: 'Error', message: "Cannot delete slot: " + error });
                }
            }
        });
    };

    // Real Analytics Data based on reservations and restaurant
    const activeReservations = reservations?.filter(r => r.status !== 'Cancelled') || [];
    const totalBookings = activeReservations.length;
    const totalGuests = activeReservations.reduce((sum, r) => sum + (r.guests || 0), 0);
    const totalRevenue = activeReservations.reduce((sum, r) => sum + (r.totalPaidNow || 0) + (r.status === 'Completed' ? (r.remainingAmount || 0) : 0), 0);

    // Real Analytics Data based on reservations and backend analytics
    const stats = [
        { label: "Monthly Revenue", value: `₹${analytics?.monthlyRevenue?.toLocaleString('en-IN') || 0}`, increase: "Live", icon: DollarSign },
        { label: "Total Reservations", value: analytics?.totalReservations?.toString() || "0", increase: "Active", icon: CalendarDays },
        { label: "Peak Booking Time", value: analytics?.peakBookingTime || "N/A", increase: "Popular", icon: Clock },
        { label: "Average Rating", value: restaurant?.rating?.toString() || "0", increase: "Live", icon: Star }
    ];

    // Menu State and Logic
    const [localMenu, setLocalMenu] = useState([]);
    const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
    const [newItem, setNewItem] = useState({ category: 'Starters', name: '', price: '₹0', description: '', status: 'Active', isAvailable: true });
    const [editingItemId, setEditingItemId] = useState(null); // for inline edit
    const [menuSaveMsg, setMenuSaveMsg] = useState({ type: '', text: '' });

    const MENU_CATEGORIES = ['Starters', 'Main Course', 'Mains', 'Tiffin & Breakfast', 'Street Snacks', 'Desserts', 'Drinks', 'Specials'];

    useEffect(() => {
        if (restaurant?.menu) {
            const flatMenu = [];
            let idCounter = 1;
            Object.keys(restaurant.menu).forEach(cat => {
                if (Array.isArray(restaurant.menu[cat])) {
                    restaurant.menu[cat].forEach(item => {
                        flatMenu.push({ ...item, id: idCounter++, category: cat });
                    });
                }
            });
            setLocalMenu(flatMenu);
        }
    }, [restaurant]);

    const handleSaveMenu = async () => {
        if (!restaurant) return;
        setMenuSaveMsg({ type: '', text: '' });
        const groupedMenu = {};
        localMenu.forEach(item => {
            if (!groupedMenu[item.category]) groupedMenu[item.category] = [];
            const { id, category, ...rest } = item;
            // Clean price: remove ₹ and non-numeric chars
            if (typeof rest.price === 'string') {
                rest.price = Number(rest.price.replace(/[^\d.]/g, '')) || 0;
            }
            groupedMenu[item.category].push(rest);
        });
        try {
            await dispatch(updateRestaurant({ id: restaurant._id, data: { menu: groupedMenu } })).unwrap();
            await dispatch(fetchOwnerRestaurant()).unwrap();
            setEditingItemId(null);
            setMenuSaveMsg({ type: 'success', text: '✅ Menu saved & published to site in real-time!' });
            setTimeout(() => setMenuSaveMsg({ type: '', text: '' }), 4000);
        } catch (error) {
            setMenuSaveMsg({ type: 'error', text: 'Failed to save menu: ' + (error?.message || error) });
        }
    };

    const handleAddMenuItem = () => {
        if (!newItem.name.trim()) return;
        setLocalMenu(prev => [...prev, { ...newItem, id: Date.now(), isAvailable: true }]);
        setIsMenuModalOpen(false);
        setNewItem({ category: 'Starters', name: '', price: '₹0', description: '', status: 'Active', isAvailable: true });
    };

    // Add item AND immediately save+publish to backend
    const handleAddAndSave = async () => {
        if (!newItem.name.trim()) return;
        const updatedMenu = [...localMenu, { ...newItem, id: Date.now(), isAvailable: true }];
        setLocalMenu(updatedMenu);
        setIsMenuModalOpen(false);
        setNewItem({ category: 'Starters', name: '', price: '₹0', description: '', status: 'Active', isAvailable: true });
        // Immediately persist
        if (!restaurant) return;
        setMenuSaveMsg({ type: '', text: '' });
        const groupedMenu = {};
        updatedMenu.forEach(item => {
            if (!groupedMenu[item.category]) groupedMenu[item.category] = [];
            const { id, category, ...rest } = item;
            if (typeof rest.price === 'string') {
                rest.price = Number(rest.price.replace(/[^\d.]/g, '')) || 0;
            }
            groupedMenu[item.category].push(rest);
        });
        try {
            await dispatch(updateRestaurant({ id: restaurant._id, data: { menu: groupedMenu } })).unwrap();
            await dispatch(fetchOwnerRestaurant()).unwrap();
            setMenuSaveMsg({ type: 'success', text: '✅ Item added & published!' });
            setTimeout(() => setMenuSaveMsg({ type: '', text: '' }), 3000);
        } catch (error) {
            setMenuSaveMsg({ type: 'error', text: 'Item added locally but save failed: ' + (error?.message || error) });
        }
    };

    const handleDeleteMenuItem = (id) => {
        setLocalMenu(localMenu.filter(item => item.id !== id));
        if (editingItemId === id) setEditingItemId(null);
    };

    const handleUpdateMenuItem = (id, field, value) => {
        setLocalMenu(localMenu.map(item => item.id === id ? { ...item, [field]: value } : item));
    };


    // Support Tickets State
    const [tickets, setTickets] = useState([]);
    const [ticketsLoading, setTicketsLoading] = useState(false);
    const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
    const [newTicket, setNewTicket] = useState({ category: 'Booking Issue', description: '' });

    const fetchTickets = useCallback(async () => {
        setTicketsLoading(true);
        try {
            const res = await api.get('support/user');
            setTickets(res.data);
        } catch (e) { console.error('Failed to fetch tickets', e); }
        finally { setTicketsLoading(false); }
    }, []);

    useEffect(() => {
        if (activeTab === 'support') {
            fetchTickets();
        }
    }, [activeTab, fetchTickets]);

    const handleCreateTicket = async () => {
        if (!newTicket.description) return;
        try {
            const formData = new FormData();
            formData.append('category', newTicket.category);
            formData.append('description', newTicket.description);
            if (newTicket.ticketImage) {
                formData.append('ticketImage', newTicket.ticketImage);
            }

            await api.post('support', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            fetchTickets();
            setIsTicketModalOpen(false);
            setNewTicket({ category: 'Booking Issue', description: '' });
        } catch (e) {
            showAlert({ type: 'error', title: 'Error', message: 'Failed to create ticket: ' + (e.response?.data?.message || e.message) });
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] pt-32 pb-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Dashboard Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12 flex flex-col md:flex-row items-center md:items-start justify-between bg-[#0B0B0B]/40 backdrop-blur-xl border border-[#1F1F1F] rounded-3xl p-10 shadow-2xl relative overflow-hidden group"
                >
                    {/* Decorative Background Element */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#F5B942]/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none group-hover:bg-[#F5B942]/10 transition-all duration-700" />

                    <div className="flex items-center gap-8 relative z-10">
                        <div className="relative">
                            <div className="w-28 h-28 rounded-3xl bg-[#121212] overflow-hidden flex items-center justify-center shadow-[0_0_30px_rgba(245,185,66,0.2)] border-2 border-[#F5B942]/50 transform rotate-3 group-hover:rotate-0 transition-transform duration-500">
                                {user?.profileImage ? (
                                    <img src={`http://localhost:5000${user.profileImage}`} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-4xl font-serif text-[#F5B942]">{user?.name?.charAt(0) || 'O'}</span>
                                )}
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#F5B942] rounded-2xl flex items-center justify-center border-4 border-zinc-900 shadow-lg transform -rotate-6">
                                <UtensilsCrossed size={18} className="text-black" />
                            </div>
                        </div>
                        <div>
                            <span className="text-[#F5B942] font-medium tracking-[0.2em] uppercase text-[10px] mb-2 block bg-[#F5B942]/10 w-fit px-3 py-1 rounded-full border border-[#F5B942]/20">
                                Exclusive Partner
                            </span>
                            <h1 className="text-4xl md:text-5xl font-serif text-[#F5F5F5] mb-3 tracking-tight">{restaurant?.name || 'Your Establishment'}</h1>
                            <div className="flex flex-wrap items-center gap-4 text-[#A1A1A1] text-sm">
                                <span className="flex items-center"><Users size={14} className="mr-2 text-[#F5F5F5]/40" /> {user?.name}</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-[#121212] hidden md:block" />
                                <span className="flex items-center text-green-400/90 font-medium tracking-widest uppercase text-[10px]">
                                    <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
                                    Live & Accepting Bookings
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 md:mt-0 flex gap-4 relative z-10">
                        <button
                            onClick={() => { dispatch(logout()); navigate('/'); }}
                            className="px-6 py-4 bg-white/5 border border-[#1F1F1F] rounded-2xl text-[#A1A1A1] hover:text-red-400 hover:border-red-400/30 hover:bg-red-500/5 transition-all duration-300 flex items-center group font-medium"
                        >
                            <LogOut size={16} className="mr-3 transform group-hover:-translate-x-1 transition-transform" /> Sign Out
                        </button>
                    </div>
                </motion.div>

                <div className="flex flex-col lg:flex-row gap-10">

                    {/* Sidebar Navigation */}
                    <div className="w-full lg:w-1/4">
                        <div className="bg-[#0B0B0B]/50 backdrop-blur-xl border border-[#1F1F1F] rounded-3xl p-5 sticky top-32 space-y-2 shadow-2xl">
                            <div className="px-4 py-2 mb-2">
                                <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#3a3a3a]">Enterprise</span>
                            </div>
                            <button
                                onClick={() => setActiveTab('analytics')}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group ${activeTab === 'analytics' ? 'bg-[#F5B942] text-black shadow-[0_10px_20px_rgba(245,185,66,0.2)]' : 'text-[#A1A1A1] hover:bg-white/5 hover:text-[#F5F5F5]'}`}
                            >
                                <span className="flex items-center font-semibold"><BarChart3 size={20} className={`mr-4 ${activeTab === 'analytics' ? 'text-black' : 'text-[#F5B942] group-hover:scale-110 transition-transform'}`} /> Analytics</span>
                                {activeTab === 'analytics' && <ChevronRight size={16} />}
                            </button>
                            <button
                                onClick={() => setActiveTab('reservations')}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group ${activeTab === 'reservations' ? 'bg-[#F5B942] text-black shadow-[0_10px_20px_rgba(245,185,66,0.2)]' : 'text-[#A1A1A1] hover:bg-white/5 hover:text-[#F5F5F5]'}`}
                            >
                                <span className="flex items-center font-semibold"><CalendarDays size={20} className={`mr-4 ${activeTab === 'reservations' ? 'text-black' : 'text-[#F5B942] group-hover:scale-110 transition-transform'}`} /> Reservations</span>
                                {activeTab === 'reservations' && <ChevronRight size={16} />}
                            </button>
                            <button
                                onClick={() => setActiveTab('menu')}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group ${activeTab === 'menu' ? 'bg-[#F5B942] text-black shadow-[0_10px_20px_rgba(245,185,66,0.2)]' : 'text-[#A1A1A1] hover:bg-white/5 hover:text-[#F5F5F5]'}`}
                            >
                                <span className="flex items-center font-semibold"><UtensilsCrossed size={20} className={`mr-4 ${activeTab === 'menu' ? 'text-black' : 'text-[#F5B942] group-hover:scale-110 transition-transform'}`} /> Menu & Slots</span>
                                {activeTab === 'menu' && <ChevronRight size={16} />}
                            </button>
                            <button
                                onClick={() => setActiveTab('reviews')}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group ${activeTab === 'reviews' ? 'bg-[#F5B942] text-black shadow-[0_10px_20px_rgba(245,185,66,0.2)]' : 'text-[#A1A1A1] hover:bg-white/5 hover:text-[#F5F5F5]'}`}
                            >
                                <span className="flex items-center font-semibold"><MessageSquare size={20} className={`mr-4 ${activeTab === 'reviews' ? 'text-black' : 'text-[#F5B942] group-hover:scale-110 transition-transform'}`} /> Reviews & Management</span>
                                {activeTab === 'reviews' && <ChevronRight size={16} />}
                            </button>
                            <button
                                onClick={() => setActiveTab('promotions')}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group ${activeTab === 'promotions' ? 'bg-[#F5B942] text-black shadow-[0_10px_20px_rgba(245,185,66,0.2)]' : 'text-[#A1A1A1] hover:bg-white/5 hover:text-[#F5F5F5]'}`}
                            >
                                <span className="flex items-center font-semibold"><Star size={20} className={`mr-4 ${activeTab === 'promotions' ? 'text-black' : 'text-[#F5B942] group-hover:scale-110 transition-transform'}`} /> Promotions</span>
                                {activeTab === 'promotions' && <ChevronRight size={16} />}
                            </button>

                            <div className="pt-6 mt-4 border-t border-[#1F1F1F] px-4 mb-2">
                                <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#3a3a3a]">Operations</span>
                            </div>
                            <button
                                onClick={() => setActiveTab('subscription')}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group ${activeTab === 'subscription' ? 'bg-[#121212] text-[#F5B942] border border-[#F5B942]/20 shadow-lg' : 'text-[#A1A1A1] hover:bg-white/5 hover:text-[#F5F5F5]'}`}
                            >
                                <span className="flex items-center font-semibold"><CreditCard size={20} className="mr-4 text-[#A1A1A1] group-hover:text-[#F5B942] transition-colors" /> Subscription</span>
                                {activeTab === 'subscription' && <div className="w-2 h-2 rounded-full bg-[#F5B942] animate-pulse" />}
                            </button>
                            <button
                                onClick={() => setActiveTab('support')}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group ${activeTab === 'support' ? 'bg-[#121212] text-[#F5F5F5] border border-[#1F1F1F]' : 'text-[#A1A1A1] hover:bg-white/5 hover:text-[#F5F5F5]'}`}
                            >
                                <span className="flex items-center font-semibold"><ShieldAlert size={20} className="mr-4 text-[#A1A1A1] group-hover:text-[#F5B942] transition-colors" /> Support</span>
                                {activeTab === 'support' && <ChevronRight size={16} />}
                            </button>
                            <button
                                onClick={() => setActiveTab('settings')}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group ${activeTab === 'settings' ? 'bg-[#121212] text-[#F5F5F5] border border-[#1F1F1F]' : 'text-[#A1A1A1] hover:bg-white/5 hover:text-[#F5F5F5]'}`}
                            >
                                <span className="flex items-center font-semibold"><Settings size={20} className="mr-4 text-[#A1A1A1] group-hover:text-[#F5B942] transition-colors" /> Settings</span>
                                {activeTab === 'settings' && <ChevronRight size={16} />}
                            </button>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="w-full lg:w-3/4">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4 }}
                            className="bg-[#0B0B0B]/40 backdrop-blur-xl border border-[#1F1F1F] rounded-3xl p-10 min-h-[600px] shadow-2xl"
                        >

                            {/* Analytics Tab */}
                            {activeTab === 'analytics' && (
                                <div>
                                    <h2 className="text-2xl font-serif text-[#F5F5F5] mb-8">Analytics Overview</h2>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                                        {stats.map((stat, idx) => (
                                            <div key={idx} className="bg-[#0B0B0B] border border-[#1F1F1F] p-6 rounded-xl hover:border-[#F5B942]/30 transition-colors">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="p-3 bg-white/5 rounded-lg text-[#F5B942]">
                                                        <stat.icon size={20} />
                                                    </div>
                                                    <span className="flex items-center text-green-400 text-sm bg-green-400/10 px-2 py-1 rounded-md">
                                                        <TrendingUp size={14} className="mr-1" /> {stat.increase}
                                                    </span>
                                                </div>
                                                <h3 className="text-[#A1A1A1] font-medium text-sm mb-1">{stat.label}</h3>
                                                <p className="text-3xl font-serif text-[#F5F5F5]">{stat.value}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                        <div className="bg-[#0B0B0B] border border-[#1F1F1F] p-6 rounded-xl h-64 flex flex-col">
                                            <h3 className="text-[#F5F5F5] font-medium text-sm mb-4 flex items-center gap-2">
                                                <UtensilsCrossed size={16} className="text-[#F5B942]" /> Popular Menu Items
                                            </h3>
                                            <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                                                {analytics?.popularItems?.length > 0 ? (
                                                    analytics.popularItems.map((item, idx) => (
                                                        <div key={idx} className="flex justify-between items-center text-sm">
                                                            <span className="text-[#F5F5F5]">{item._id}</span>
                                                            <span className="text-[#F5B942] font-medium font-mono">{item.count} orders</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="h-full flex flex-col items-center justify-center text-[#A1A1A1] italic text-xs">
                                                        <p>No popular items data yet.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="bg-[#0B0B0B] border border-[#1F1F1F] p-6 rounded-xl h-64 flex items-center justify-center">
                                            <p className="text-[#A1A1A1] italic font-light">Interactive Revenue Chart Placeholder</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Reservations Tab */}
                            {activeTab === 'reservations' && (
                                <div>
                                    <div className="flex justify-between items-center mb-8">
                                        <h2 className="text-2xl font-serif text-[#F5F5F5]">Live Reservations</h2>
                                        <button className="bg-white/10 text-[#F5F5F5] px-4 py-2 rounded-lg text-sm hover:bg-white/20 transition-colors">Export CSV</button>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="border-b border-[#1F1F1F] text-[#A1A1A1] text-sm uppercase tracking-wider">
                                                    <th className="pb-4 font-medium">ID/Order</th>
                                                    <th className="pb-4 font-medium">Guest</th>
                                                    <th className="pb-4 font-medium">Date/Time</th>
                                                    <th className="pb-4 font-medium">Add-Ons</th>
                                                    <th className="pb-4 font-medium">Billing</th>
                                                    <th className="pb-4 font-medium">Status</th>
                                                    <th className="pb-4 font-medium text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-sm">
                                                {resLoading ? (
                                                    <tr><td colSpan="7" className="text-center py-4 text-[#A1A1A1]">Loading reservations...</td></tr>
                                                ) : reservations?.length > 0 ? (
                                                    reservations.map(res => (
                                                        <tr key={res._id} className="border-b border-[#1F1F1F] hover:bg-white/5 transition-colors group">
                                                            <td className="py-4 text-[#F5F5F5] font-mono">
                                                                <div>{res._id.slice(-6).toUpperCase()}</div>
                                                                <div className="text-[10px] text-[#A1A1A1]">{res.razorpayOrderId || 'No Order ID'}</div>
                                                            </td>
                                                            <td className="py-4 text-[#F5F5F5] font-medium">{res.userId?.name || 'Guest'}</td>
                                                            <td className="py-4 text-[#A1A1A1]">
                                                                <div>{new Date(res.date).toLocaleDateString()}</div>
                                                                <div className="text-[#F5B942] text-xs mt-0.5">{res.time} • {res.guests} Pax</div>
                                                            </td>
                                                            <td className="py-4">
                                                                {res.selectedPackage?.title ? (
                                                                    <div className="text-[10px] text-[#F5B942] bg-[#F5B942]/10 inline-block px-1.5 py-0.5 rounded border border-[#F5B942]/20 mb-1">
                                                                        ★ {res.selectedPackage.title}
                                                                    </div>
                                                                ) : <div className="text-xs text-[#A1A1A1]">-</div>}
                                                                {res.preorderItems?.length > 0 && (
                                                                    <div className="text-[10px] text-[#A1A1A1]">
                                                                        +{res.preorderItems.reduce((acc, curr) => acc + (curr.quantity || 1), 0)} preorders
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="py-4 text-xs">
                                                                <div className="text-[#A1A1A1]">Paid: <span className="text-green-400">₹{res.totalPaidNow || 0}</span></div>
                                                                <div className="text-[#A1A1A1]">Rem: <span className="text-[#F5F5F5]">₹{res.remainingAmount || 0}</span></div>
                                                            </td>
                                                            <td className="py-4">
                                                                <span className={`px-2 py-1 rounded text-xs border ${res.status === 'confirmed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                                    res.status === 'payment_initiated' ? 'bg-[#F5B942]/10 text-[#F5B942] border-[#F5B942]/20 animate-pulse' :
                                                                        res.status === 'approved' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                                            res.status === 'pending' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20 animate-pulse' :
                                                                                res.status === 'payment_failed' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                                                    res.status === 'cancelled' || res.status === 'rejected' ? 'bg-red-500/5 text-red-400 border-red-500/10' :
                                                                                        'bg-white/5 text-[#A1A1A1] border-[#1F1F1F]'}`}>
                                                                    {res.status === 'payment_initiated' ? 'Awaiting Payment' : res.status.replace('_', ' ')}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                                                {res.status === 'confirmed' && (
                                                                    <div className="flex gap-2 justify-end">
                                                                        <button onClick={() => dispatch(updateReservationStatus({ id: res._id, status: 'completed' }))} className="text-[#A1A1A1] hover:text-green-400 transition-colors text-xs">Mark Completed</button>
                                                                        <button onClick={() => dispatch(updateReservationStatus({ id: res._id, status: 'cancelled' }))} className="text-red-400 hover:text-red-300 transition-colors text-xs">Cancel</button>
                                                                    </div>
                                                                )}
                                                                {res.status === 'pending' && (
                                                                    <div className="flex gap-2 justify-end">
                                                                        <button onClick={() => dispatch(approveReservation(res._id))} className="text-green-400 hover:text-green-300 bg-green-500/10 hover:bg-green-500/20 px-2 py-1 rounded transition-colors text-xs font-medium border border-green-500/20">Approve</button>
                                                                        <button onClick={() => dispatch(rejectReservation(res._id))} className="text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded transition-colors text-xs font-medium border border-red-500/20">Reject</button>
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr><td colSpan="7" className="text-center py-4 text-[#A1A1A1]">No recent reservations found.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Menu Manager Tab */}
                            {activeTab === 'menu' && (
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-2xl font-serif text-[#F5F5F5]">Menu Manager</h2>
                                        <div className="flex gap-4">
                                            <button onClick={() => setIsMenuModalOpen(true)} className="bg-[#F5B942] text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-400 transition-colors flex items-center shadow-[0_0_10px_rgba(245,185,66,0.3)]">
                                                <Plus size={16} className="mr-1" /> Add Item
                                            </button>
                                            <button onClick={handleSaveMenu} disabled={restLoading} className="bg-[#121212] text-[#F5F5F5] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1F1F1F] transition-colors flex items-center border border-[#1F1F1F] disabled:opacity-50">
                                                Save & Publish
                                            </button>
                                        </div>
                                    </div>

                                    {menuSaveMsg.text && (
                                        <div className={`mb-4 p-3 rounded-lg text-sm ${menuSaveMsg.type === 'success' ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
                                            {menuSaveMsg.text}
                                        </div>
                                    )}

                                    <p className="text-xs text-[#A1A1A1] mb-6">Click the <span className="text-[#F5B942]">✏ Edit</span> icon on any item to edit it inline. Press <span className="text-[#F5B942]">Save & Publish</span> to push changes to the site in real-time.</p>

                                    {/* Group by category for display */}
                                    <div className="space-y-6">
                                        {localMenu.length > 0 ? (
                                            MENU_CATEGORIES.concat(
                                                [...new Set(localMenu.map(i => i.category))].filter(c => !MENU_CATEGORIES.includes(c))
                                            ).map(cat => {
                                                const items = localMenu.filter(i => i.category === cat);
                                                if (items.length === 0) return null;
                                                return (
                                                    <div key={cat}>
                                                        <h3 className="text-sm font-semibold text-[#F5B942] uppercase tracking-widest mb-3 border-l-2 border-[#F5B942] pl-3">{cat}</h3>
                                                        <div className="space-y-3">
                                                            {items.map(item => (
                                                                <div key={item.id} className={`border rounded-xl transition-all ${editingItemId === item.id ? 'border-[#F5B942]/50 bg-[#F5B942]/5 p-5' : 'border-[#1F1F1F] bg-[#0B0B0B] p-4 hover:border-white/30'}`}>
                                                                    {editingItemId === item.id ? (
                                                                        // ── Inline Edit Mode ──────────────────────────────
                                                                        <div className="space-y-3">
                                                                            <div className="flex gap-3">
                                                                                <input
                                                                                    type="text"
                                                                                    value={item.name}
                                                                                    onChange={e => handleUpdateMenuItem(item.id, 'name', e.target.value)}
                                                                                    className="flex-1 bg-[#050505] border border-zinc-700 px-3 py-2 rounded-lg text-[#F5F5F5] text-sm"
                                                                                    placeholder="Item name"
                                                                                />
                                                                                <input
                                                                                    type="text"
                                                                                    value={item.price}
                                                                                    onChange={e => handleUpdateMenuItem(item.id, 'price', e.target.value)}
                                                                                    className="w-28 bg-[#050505] border border-zinc-700 px-3 py-2 rounded-lg text-[#F5B942] text-sm"
                                                                                    placeholder="₹0"
                                                                                />
                                                                            </div>
                                                                            <textarea
                                                                                value={item.description || ''}
                                                                                onChange={e => handleUpdateMenuItem(item.id, 'description', e.target.value)}
                                                                                rows={2}
                                                                                className="w-full bg-[#050505] border border-zinc-700 px-3 py-2 rounded-lg text-[#F5F5F5] text-sm resize-none"
                                                                                placeholder="Description"
                                                                            />
                                                                            <div className="flex gap-3">
                                                                                <select
                                                                                    value={item.category}
                                                                                    onChange={e => handleUpdateMenuItem(item.id, 'category', e.target.value)}
                                                                                    className="flex-1 bg-[#050505] border border-zinc-700 px-3 py-2 rounded-lg text-[#F5F5F5] text-sm"
                                                                                >
                                                                                    {MENU_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                                                </select>
                                                                                <select
                                                                                    value={item.status || 'Active'}
                                                                                    onChange={e => handleUpdateMenuItem(item.id, 'status', e.target.value)}
                                                                                    className="w-32 bg-[#050505] border border-zinc-700 px-3 py-2 rounded-lg text-[#F5F5F5] text-sm"
                                                                                >
                                                                                    <option value="Active">Active</option>
                                                                                    <option value="Inactive">Inactive</option>
                                                                                </select>
                                                                                <button
                                                                                    onClick={() => setEditingItemId(null)}
                                                                                    className="px-4 py-2 bg-[#F5B942] text-black rounded-lg text-sm font-medium hover:bg-amber-400 transition-colors"
                                                                                >
                                                                                    Done
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        // ── View Mode ─────────────────────────────────────
                                                                        <div className="flex items-center justify-between">
                                                                            <div className="flex-1 min-w-0 pr-4">
                                                                                <div className="flex items-center gap-3 mb-1">
                                                                                    <h4 className="text-[#F5F5F5] font-medium truncate">{item.name}</h4>
                                                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${(item.status || 'Active') === 'Active' ? 'text-green-400 border-green-500/30 bg-green-500/10' : 'text-red-400 border-red-500/30 bg-red-500/10'}`}>
                                                                                        {item.status || 'Active'}
                                                                                    </span>
                                                                                </div>
                                                                                {item.description && (
                                                                                    <p className="text-xs text-[#A1A1A1] truncate">{item.description}</p>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex items-center gap-4 flex-shrink-0">
                                                                                <span className="text-[#F5B942] font-serif text-sm">{item.price}</span>
                                                                                <div className="flex gap-2">
                                                                                    <button
                                                                                        onClick={() => setEditingItemId(item.id)}
                                                                                        className="p-2 bg-[#F5B942]/10 rounded hover:bg-[#F5B942]/20 text-[#F5B942] transition-colors"
                                                                                        title="Edit item"
                                                                                    >
                                                                                        <Edit2 size={13} />
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => handleDeleteMenuItem(item.id)}
                                                                                        className="p-2 bg-red-500/10 rounded hover:bg-red-500/20 text-red-500 transition-colors"
                                                                                        title="Delete item"
                                                                                    >
                                                                                        <Trash2 size={13} />
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="text-center py-16 text-[#A1A1A1]">
                                                <UtensilsCrossed className="w-12 h-12 text-[#1F1F1F] mx-auto mb-3" />
                                                <p className="mb-1">No menu items added yet.</p>
                                                <p className="text-xs">Click "+ Add Item" to start building your menu.</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* ── Add Menu Item OVERLAY MODAL ─────────────────────────── */}
                                    {isMenuModalOpen && (
                                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setIsMenuModalOpen(false); }}>
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="bg-[#0B0B0B] border border-[#F5B942]/20 rounded-2xl p-8 w-full max-w-md mx-4 shadow-[0_0_40px_rgba(212,175,55,0.15)]"
                                            >
                                                <div className="flex justify-between items-center mb-6">
                                                    <h3 className="text-xl font-serif text-[#F5F5F5]">Add Menu Item</h3>
                                                    <button onClick={() => setIsMenuModalOpen(false)} className="text-[#A1A1A1] hover:text-[#F5F5F5] transition-colors">
                                                        <X size={20} />
                                                    </button>
                                                </div>
                                                <div className="flex flex-col gap-4">
                                                    <div>
                                                        <label className="block text-xs text-[#A1A1A1] uppercase tracking-wider mb-1">Item Name *</label>
                                                        <input
                                                            type="text"
                                                            autoFocus
                                                            placeholder="e.g. Chicken Biryani"
                                                            value={newItem.name}
                                                            onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                                            className="w-full bg-[#050505] border border-zinc-700 focus:border-[#F5B942]/50 p-3 rounded-lg text-[#F5F5F5] outline-none transition-colors"
                                                        />
                                                    </div>
                                                    <div className="flex gap-3">
                                                        <div className="flex-1">
                                                            <label className="block text-xs text-[#A1A1A1] uppercase tracking-wider mb-1">Category</label>
                                                            <select
                                                                value={newItem.category}
                                                                onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                                                                className="w-full bg-[#050505] border border-zinc-700 focus:border-[#F5B942]/50 p-3 rounded-lg text-[#F5F5F5] outline-none"
                                                            >
                                                                {MENU_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                            </select>
                                                        </div>
                                                        <div className="w-32">
                                                            <label className="block text-xs text-[#A1A1A1] uppercase tracking-wider mb-1">Price</label>
                                                            <input
                                                                type="text"
                                                                placeholder="₹200"
                                                                value={newItem.price}
                                                                onChange={e => setNewItem({ ...newItem, price: e.target.value })}
                                                                className="w-full bg-[#050505] border border-zinc-700 focus:border-[#F5B942]/50 p-3 rounded-lg text-[#F5F5F5] outline-none transition-colors"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-[#A1A1A1] uppercase tracking-wider mb-1">Description</label>
                                                        <textarea
                                                            placeholder="Brief description of the dish..."
                                                            value={newItem.description}
                                                            onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                                                            rows={3}
                                                            className="w-full bg-[#050505] border border-zinc-700 focus:border-[#F5B942]/50 p-3 rounded-lg text-[#F5F5F5] outline-none resize-none transition-colors"
                                                        />
                                                    </div>
                                                    <div className="flex gap-3 pt-2">
                                                        <button
                                                            onClick={handleAddAndSave}
                                                            disabled={!newItem.name.trim()}
                                                            className="flex-1 bg-[#F5B942] hover:bg-amber-400 text-black font-semibold py-3 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                                        >
                                                            Add &amp; Publish
                                                        </button>
                                                        <button
                                                            onClick={handleAddMenuItem}
                                                            disabled={!newItem.name.trim()}
                                                            className="flex-1 bg-[#121212] hover:bg-[#1F1F1F] text-[#F5F5F5] py-3 rounded-xl transition-all border border-[#1F1F1F] disabled:opacity-40 disabled:cursor-not-allowed"
                                                        >
                                                            Add Only
                                                        </button>
                                                    </div>
                                                    <p className="text-xs text-[#A1A1A1] text-center">
                                                        <span className="text-[#F5B942]">Add &amp; Publish</span> saves immediately to the site.
                                                        <br /><span className="text-[#3a3a3a]">Add Only</span> stages it — use <em>Save &amp; Publish</em> button when done editing.
                                                    </p>
                                                </div>
                                            </motion.div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Packages Manager Tab */}
                            {activeTab === 'packages' && (
                                <div>
                                    <div className="flex justify-between items-center mb-8">
                                        <h2 className="text-2xl font-serif text-[#F5F5F5]">Experiences & Packages</h2>
                                        <button onClick={() => setIsPackageModalOpen(true)} className="bg-[#F5B942] text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#F5B942]-hover transition-colors flex items-center shadow-[0_0_10px_rgba(245,185,66,0.3)]">
                                            <Plus size={16} className="mr-1" /> Add Package
                                        </button>
                                    </div>

                                    {successMessage && (
                                        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg">
                                            {successMessage}
                                        </div>
                                    )}

                                    {packLoading ? (
                                        <p className="text-[#A1A1A1]">Loading packages...</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {packages?.length > 0 ? packages.map(item => (
                                                <div key={item._id} className="flex items-center justify-between p-4 bg-[#0B0B0B] border border-[#1F1F1F] rounded-xl hover:border-white/30 transition-colors">
                                                    <div>
                                                        <h4 className="text-[#F5F5F5] font-medium mb-1">{item.title}</h4>
                                                        <div className="flex items-center text-xs text-[#A1A1A1] gap-4">
                                                            <span className={item.isAvailable ? 'text-green-400' : 'text-red-400'}>{item.isAvailable ? 'Active' : 'Inactive'}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-6">
                                                        <span className="text-[#F5B942] font-serif">₹{item.basePrice}</span>
                                                        <div className="flex gap-2">
                                                            <button onClick={() => handleDeletePackage(item._id)} className="p-2 bg-red-500/10 rounded hover:bg-red-500/20 text-red-500 transition-colors"><Trash2 size={14} /></button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )) : (
                                                <p className="text-[#A1A1A1]">No packages defined for this restaurant.</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Add Package Modal (Simplified inline) */}
                                    {isPackageModalOpen && (
                                        <div className="mt-8 border-t border-[#1F1F1F] pt-8">
                                            <h3 className="text-xl font-serif text-[#F5F5F5] mb-4">Create New Package</h3>
                                            <div className="flex flex-col gap-4 max-w-lg">
                                                <input type="text" placeholder="Package Title" value={newPackage.title} onChange={e => setNewPackage({ ...newPackage, title: e.target.value })} className="bg-[#050505] border border-zinc-700 p-3 rounded-lg text-[#F5F5F5]" />
                                                <div className="flex gap-4">
                                                    <input type="number" placeholder="Base Price (₹)" value={newPackage.basePrice} onChange={e => setNewPackage({ ...newPackage, basePrice: e.target.value })} className="w-1/2 bg-[#050505] border border-zinc-700 p-3 rounded-lg text-[#F5F5F5]" />
                                                    <input type="number" placeholder="Max Capacity" value={newPackage.maxCapacity} onChange={e => setNewPackage({ ...newPackage, maxCapacity: e.target.value })} className="w-1/2 bg-[#050505] border border-zinc-700 p-3 rounded-lg text-[#F5F5F5]" />
                                                </div>
                                                <textarea placeholder="Description" value={newPackage.description} onChange={e => setNewPackage({ ...newPackage, description: e.target.value })} className="bg-[#050505] border border-zinc-700 p-3 rounded-lg text-[#F5F5F5] h-24"></textarea>

                                                <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-[#1F1F1F]">
                                                    <h4 className="text-xs font-bold text-[#F5B942] uppercase tracking-widest">Pricing & Guests</h4>
                                                    <div className="flex gap-4">
                                                        <div className="w-full">
                                                            <label className="block text-[10px] text-[#A1A1A1] mb-1 uppercase tracking-wider">Advance Booking Amount (₹)</label>
                                                            <input type="number" placeholder="e.g. 500" value={newPackage.advanceAmount} onChange={e => setNewPackage({ ...newPackage, advanceAmount: e.target.value })} className="w-full bg-[#050505] border border-zinc-700 p-2 rounded-lg text-[#F5F5F5] text-sm" />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="block text-[10px] text-[#A1A1A1] uppercase tracking-wider">Tiered Guest Options</label>
                                                        {newPackage.guestOptions.map((opt, idx) => (
                                                            <div key={idx} className="flex gap-2 items-center">
                                                                <input type="number" placeholder="Guests" value={opt.guests} onChange={e => {
                                                                    const updated = [...newPackage.guestOptions];
                                                                    updated[idx].guests = parseInt(e.target.value) || 0;
                                                                    setNewPackage({ ...newPackage, guestOptions: updated });
                                                                }} className="w-1/2 bg-[#050505] border border-zinc-700 p-2 rounded-lg text-[#F5F5F5] text-sm" />
                                                                <input type="number" placeholder="Price (₹)" value={opt.price} onChange={e => {
                                                                    const updated = [...newPackage.guestOptions];
                                                                    updated[idx].price = parseInt(e.target.value) || 0;
                                                                    setNewPackage({ ...newPackage, guestOptions: updated });
                                                                }} className="w-1/2 bg-[#050505] border border-zinc-700 p-2 rounded-lg text-[#F5F5F5] text-sm" />
                                                                <button onClick={() => {
                                                                    const updated = newPackage.guestOptions.filter((_, i) => i !== idx);
                                                                    setNewPackage({ ...newPackage, guestOptions: updated });
                                                                }} className="text-red-500 p-1 hover:bg-red-500/10 rounded"><X size={14} /></button>
                                                            </div>
                                                        ))}
                                                        <button onClick={() => setNewPackage({ ...newPackage, guestOptions: [...newPackage.guestOptions, { guests: 2, price: 0 }] })} className="text-[10px] text-[#F5B942] font-bold uppercase py-1 px-2 border border-[#F5B942]/30 rounded flex items-center gap-1 hover:bg-[#F5B942]/10 transition-colors">
                                                            <Plus size={10} /> Add Tier
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-[#1F1F1F]">
                                                    <div>
                                                        <label className="block text-xs text-[#A1A1A1] mb-1">Decoration Details</label>
                                                        <input type="text" placeholder="e.g. Balloons, Flowers, Lighting" value={newPackage.decorationDetails} onChange={e => setNewPackage({ ...newPackage, decorationDetails: e.target.value })} className="w-full bg-[#050505] border border-zinc-700 p-2 rounded-lg text-[#F5F5F5]" />
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <input type="checkbox" id="hasBuffet" checked={newPackage.hasBuffet} onChange={e => setNewPackage({ ...newPackage, hasBuffet: e.target.checked })} className="w-4 h-4 accent-amber-500" />
                                                        <label htmlFor="hasBuffet" className="text-sm text-[#F5F5F5]">Includes Buffet</label>
                                                    </div>
                                                </div>
                                                <div className="flex gap-4">
                                                    <button onClick={handleCreatePackage} className="bg-[#F5B942] text-black px-6 py-2 rounded-lg font-medium">Save Package</button>
                                                    <button onClick={() => setIsPackageModalOpen(false)} className="bg-[#121212] text-[#F5F5F5] px-6 py-2 rounded-lg">Cancel</button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Slot Manager Tab */}
                            {activeTab === 'slots' && (
                                <div>
                                    <div className="flex justify-between items-center mb-8">
                                        <h2 className="text-2xl font-serif text-[#F5F5F5]">Slot Manager</h2>
                                        <button onClick={() => setIsSlotModalOpen(true)} className="bg-[#F5B942] text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#F5B942]-hover transition-colors flex items-center shadow-[0_0_10px_rgba(245,185,66,0.3)]">
                                            <Plus size={16} className="mr-1" /> Create Slot
                                        </button>
                                    </div>

                                    {slotLoading ? (
                                        <p className="text-[#A1A1A1]">Loading slots...</p>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            {ownerSlots?.length > 0 ? (
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="text-left text-xs text-[#A1A1A1] uppercase tracking-wider border-b border-[#1F1F1F]">
                                                            <th className="pb-3 font-medium">Date</th>
                                                            <th className="pb-3 font-medium">Time</th>
                                                            <th className="pb-3 font-medium text-center">2S Cap</th>
                                                            <th className="pb-3 font-medium text-center">4S Cap</th>
                                                            <th className="pb-3 font-medium text-center">6S Cap</th>
                                                            <th className="pb-3 font-medium text-center">Grp Cap</th>
                                                            <th className="pb-3 font-medium text-center">Booked (2/4/6/G)</th>
                                                            <th className="pb-3 font-medium text-center">Status</th>
                                                            <th className="pb-3 font-medium text-right">Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-white/5">
                                                        {ownerSlots.map(slot => {
                                                            const cap = slot.capacity || {};
                                                            const bkd = slot.booked || {};
                                                            const totalBooked = (bkd.twoSeater || 0) + (bkd.fourSeater || 0) + (bkd.sixSeater || 0) + (bkd.groupTable || 0);
                                                            return (
                                                                <tr key={slot._id} className="hover:bg-white/[0.02] transition-colors">
                                                                    <td className="py-4 text-[#F5F5F5] whitespace-nowrap">
                                                                        {new Date(slot.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                    </td>
                                                                    <td className="py-4">
                                                                        <span className="text-[#F5B942] font-semibold">{slot.time}</span>
                                                                    </td>
                                                                    <td className="py-4 text-center text-[#F5F5F5]">{cap.twoSeater || 0}</td>
                                                                    <td className="py-4 text-center text-[#F5F5F5]">{cap.fourSeater || 0}</td>
                                                                    <td className="py-4 text-center text-[#F5F5F5]">{cap.sixSeater || 0}</td>
                                                                    <td className="py-4 text-center text-[#F5F5F5]">{cap.groupTable || 0}</td>
                                                                    <td className="py-4 text-center text-[#A1A1A1] text-xs">
                                                                        {bkd.twoSeater || 0}/{bkd.fourSeater || 0}/{bkd.sixSeater || 0}/{bkd.groupTable || 0}
                                                                    </td>
                                                                    <td className="py-4 text-center">
                                                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${slot.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                                                            {slot.isActive ? 'Active' : 'Inactive'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-4 text-right">
                                                                        <button
                                                                            onClick={() => handleDeleteSlot(slot._id)}
                                                                            disabled={totalBooked > 0}
                                                                            title={totalBooked > 0 ? 'Cannot delete: has bookings' : 'Delete Slot'}
                                                                            className="p-2 bg-red-500/10 rounded hover:bg-red-500/20 text-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                                        >
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            ) : (
                                                <div className="text-center py-12 text-[#A1A1A1]">
                                                    <p className="mb-2">No slots created yet.</p>
                                                    <p className="text-xs">Click "+ Create Slot" to add your first booking slot.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Create Slot Modal (Inline) */}
                                    {isSlotModalOpen && (
                                        <div className="mt-8 border-t border-[#1F1F1F] pt-8">
                                            <h3 className="text-xl font-serif text-[#F5F5F5] mb-4">Create Booking Slot</h3>
                                            <div className="flex flex-col gap-5 max-w-2xl">
                                                <div className="flex gap-4">
                                                    <div className="w-1/2">
                                                        <label className="block text-xs text-[#A1A1A1] uppercase tracking-wider mb-1">Date</label>
                                                        <input type="date" value={newSlot.date} onChange={e => setNewSlot({ ...newSlot, date: e.target.value })} className="w-full bg-[#050505] border border-zinc-700 p-3 rounded-lg text-[#F5F5F5]" style={{ colorScheme: 'dark' }} />
                                                    </div>
                                                    <div className="w-1/2">
                                                        <label className="block text-xs text-[#A1A1A1] uppercase tracking-wider mb-1">Time</label>
                                                        <input type="time" value={newSlot.time} onChange={e => setNewSlot({ ...newSlot, time: e.target.value })} className="w-full bg-[#050505] border border-zinc-700 p-3 rounded-lg text-[#F5F5F5]" style={{ colorScheme: 'dark' }} />
                                                    </div>
                                                </div>

                                                <p className="text-xs text-[#A1A1A1] -mb-2">Set capacity per table type. Leave at 0 to disable that table size for this slot.</p>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs text-[#A1A1A1] uppercase tracking-wider mb-1">2-Seater Tables</label>
                                                        <input type="number" min="0" placeholder="0" value={newSlot.capacity.twoSeater}
                                                            onChange={e => setNewSlot({ ...newSlot, capacity: { ...newSlot.capacity, twoSeater: parseInt(e.target.value) || 0 } })}
                                                            className="w-full bg-[#050505] border border-zinc-700 p-3 rounded-lg text-[#F5F5F5]" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-[#A1A1A1] uppercase tracking-wider mb-1">4-Seater Tables</label>
                                                        <input type="number" min="0" placeholder="0" value={newSlot.capacity.fourSeater}
                                                            onChange={e => setNewSlot({ ...newSlot, capacity: { ...newSlot.capacity, fourSeater: parseInt(e.target.value) || 0 } })}
                                                            className="w-full bg-[#050505] border border-zinc-700 p-3 rounded-lg text-[#F5F5F5]" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-[#A1A1A1] uppercase tracking-wider mb-1">6-Seater Tables</label>
                                                        <input type="number" min="0" placeholder="0" value={newSlot.capacity.sixSeater}
                                                            onChange={e => setNewSlot({ ...newSlot, capacity: { ...newSlot.capacity, sixSeater: parseInt(e.target.value) || 0 } })}
                                                            className="w-full bg-[#050505] border border-zinc-700 p-3 rounded-lg text-[#F5F5F5]" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-[#A1A1A1] uppercase tracking-wider mb-1">Group Tables (7+)</label>
                                                        <input type="number" min="0" placeholder="0" value={newSlot.capacity.groupTable}
                                                            onChange={e => setNewSlot({ ...newSlot, capacity: { ...newSlot.capacity, groupTable: parseInt(e.target.value) || 0 } })}
                                                            className="w-full bg-[#050505] border border-zinc-700 p-3 rounded-lg text-[#F5F5F5]" />
                                                    </div>
                                                </div>

                                                <div className="flex gap-4 mt-2">
                                                    <button onClick={handleCreateSlot} className="bg-[#F5B942] text-black px-6 py-2 rounded-lg font-medium">Create Slot</button>
                                                    <button onClick={() => setIsSlotModalOpen(false)} className="bg-[#121212] text-[#F5F5F5] px-6 py-2 rounded-lg">Cancel</button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Reviews Placeholders */}
                            {activeTab === 'reviews' && (
                                <div>
                                    <h3 className="text-xl font-serif text-[#F5F5F5] mb-6">Customer Reviews</h3>
                                    {reviewsLoading ? <Loader2 className="animate-spin text-[#F5B942] mx-auto" /> : (
                                        <div className="space-y-6">
                                            {ownerReviews.length > 0 ? ownerReviews.map(review => (
                                                <div key={review._id} className="bg-[#0B0B0B] border border-[#1F1F1F] p-6 rounded-2xl hover:border-white/20 transition-all">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="flex gap-4">
                                                            <div className="w-12 h-12 rounded-xl bg-[#121212] flex items-center justify-center text-[#F5B942] font-bold border border-[#1F1F1F]">
                                                                {review.userId?.name?.charAt(0) || 'U'}
                                                            </div>
                                                            <div>
                                                                <h4 className="text-[#F5F5F5] font-medium">{review.userId?.name || 'Anonymous User'}</h4>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <div className="flex text-[#F5B942]">
                                                                        {[...Array(5)].map((_, i) => <Star key={i} size={12} fill={i < review.rating ? 'currentColor' : 'none'} className={i < review.rating ? 'text-[#F5B942]' : 'text-[#3a3a3a]'} />)}
                                                                    </div>
                                                                    <span className="text-[10px] text-[#A1A1A1] uppercase tracking-widest">{new Date(review.createdAt).toLocaleDateString()}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button onClick={() => handleDeleteReview(review._id)} className="text-[#A1A1A1] hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                                                    </div>
                                                    <p className="text-[#A1A1A1] text-sm leading-relaxed mb-6 bg-white/5 p-4 rounded-xl italic">"{review.comment}"</p>

                                                    {review.ownerReply ? (
                                                        <div className="bg-[#F5B942]/5 border-l-2 border-[#F5B942] p-4 rounded-r-xl ml-4">
                                                            <p className="text-[10px] text-[#F5B942] font-bold uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                                                <UtensilsCrossed size={12} /> Your Response
                                                            </p>
                                                            <p className="text-amber-200/80 text-sm leading-relaxed">{review.ownerReply}</p>
                                                        </div>
                                                    ) : (
                                                        <div className="ml-4">
                                                            {replyingTo === review._id ? (
                                                                <div className="space-y-3">
                                                                    <textarea
                                                                        value={replyText}
                                                                        onChange={e => setReplyText(e.target.value)}
                                                                        placeholder="Write your professional response..."
                                                                        className="w-full bg-[#050505] border border-[#1F1F1F] rounded-xl p-4 text-sm text-[#F5F5F5] focus:border-[#F5B942] outline-none h-24"
                                                                    />
                                                                    <div className="flex gap-2">
                                                                        <button onClick={() => handlePostReply(review._id)} className="bg-[#F5B942] text-black px-4 py-2 rounded-lg text-xs font-bold hover:bg-amber-400 transition-colors">Post Reply</button>
                                                                        <button onClick={() => { setReplyingTo(null); setReplyText(''); }} className="bg-white/5 text-[#A1A1A1] px-4 py-2 rounded-lg text-xs hover:bg-white/10 transition-colors">Cancel</button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <button onClick={() => setReplyingTo(review._id)} className="text-[#F5B942] hover:text-[#F5B942] text-xs font-bold flex items-center gap-2 group">
                                                                    <MessageSquare size={14} className="group-hover:scale-110 transition-transform" /> Reply to client
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )) : (
                                                <div className="text-center py-10">
                                                    <MessageSquare size={48} className="text-zinc-800 mx-auto mb-4" />
                                                    <p className="text-[#A1A1A1]">No reviews yet for your restaurant.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Settings Tab */}
                            {activeTab === 'settings' && (
                                <div>
                                    <h2 className="text-2xl font-serif text-[#F5F5F5] mb-6 flex items-center"><Settings className="mr-3 text-[#F5B942]" /> Account Settings</h2>

                                    {updateMessage.text && (
                                        <div className={`mb-6 p-4 rounded-lg font-medium ${updateMessage.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}>
                                            {updateMessage.text}
                                        </div>
                                    )}

                                    {/* Restaurant Profile Section */}
                                    <h3 className="text-xl font-serif text-[#F5F5F5] mb-6 border-b border-[#1F1F1F] pb-4 flex items-center gap-3">
                                        🏢 Restaurant Profile
                                    </h3>
                                    <form onSubmit={handleSaveRestProfile} className="space-y-6 max-w-2xl bg-[#0B0B0B] p-8 rounded-xl border border-[#1F1F1F] mb-12">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-[#A1A1A1] mb-2">Restaurant Name</label>
                                                <input
                                                    type="text"
                                                    value={restProfile.name}
                                                    onChange={(e) => setRestProfile({ ...restProfile, name: e.target.value })}
                                                    className="w-full bg-[#050505] border border-[#1F1F1F] rounded-lg px-4 py-3 text-[#F5F5F5] focus:outline-none focus:border-[#F5B942] transition-colors"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-[#A1A1A1] mb-2">Cuisine Type</label>
                                                <input
                                                    type="text"
                                                    value={restProfile.cuisine}
                                                    onChange={(e) => setRestProfile({ ...restProfile, cuisine: e.target.value })}
                                                    className="w-full bg-[#050505] border border-[#1F1F1F] rounded-lg px-4 py-3 text-[#F5F5F5] focus:outline-none focus:border-[#F5B942] transition-colors"
                                                    placeholder="e.g. Italian, Indian Fusion"
                                                    required
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-[#A1A1A1] mb-2">Location / Address</label>
                                                <input
                                                    type="text"
                                                    value={restProfile.location}
                                                    onChange={(e) => setRestProfile({ ...restProfile, location: e.target.value })}
                                                    className="w-full bg-[#050505] border border-[#1F1F1F] rounded-lg px-4 py-3 text-[#F5F5F5] focus:outline-none focus:border-[#F5B942] transition-colors"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-4">
                                            <h4 className="text-sm font-medium text-[#F5B942] flex items-center gap-2">
                                                <Clock size={16} /> Working Hours
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-white/5 rounded-xl border border-[#1F1F1F]">
                                                <div>
                                                    <label className="block text-xs text-[#A1A1A1] uppercase tracking-widest mb-2 font-bold">Weekdays (Mon-Fri)</label>
                                                    <input
                                                        type="text"
                                                        value={restProfile.workingHours.weekday}
                                                        onChange={(e) => setRestProfile({
                                                            ...restProfile,
                                                            workingHours: { ...restProfile.workingHours, weekday: e.target.value }
                                                        })}
                                                        placeholder="e.g. 11:00 AM - 11:00 PM"
                                                        className="w-full bg-[#050505] border border-[#1F1F1F] rounded-lg px-4 py-2 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#F5B942]"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-[#A1A1A1] uppercase tracking-widest mb-2 font-bold">Weekends (Sat-Sun)</label>
                                                    <input
                                                        type="text"
                                                        value={restProfile.workingHours.weekend}
                                                        onChange={(e) => setRestProfile({
                                                            ...restProfile,
                                                            workingHours: { ...restProfile.workingHours, weekend: e.target.value }
                                                        })}
                                                        placeholder="e.g. 11:00 AM - 12:00 AM"
                                                        className="w-full bg-[#050505] border border-[#1F1F1F] rounded-lg px-4 py-2 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#F5B942]"
                                                    />
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-[#A1A1A1]">Format: "HH:MM AM/PM - HH:MM AM/PM" or "Closed"</p>
                                        </div>

                                        <div className="pt-4 flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={restLoading}
                                                className="bg-[#F5B942] text-black px-8 py-3 rounded-lg font-medium hover:bg-amber-400 transition-colors shadow-[0_0_15px_rgba(212,175,55,0.3)] disabled:opacity-50"
                                            >
                                                {restLoading ? 'Saving...' : 'Update Restaurant Details'}
                                            </button>
                                        </div>
                                    </form>

                                    <h3 className="text-xl font-serif text-[#F5F5F5] mb-6 border-b border-[#1F1F1F] pb-4 flex items-center gap-3">
                                        👤 Personal Profile
                                    </h3>

                                    <form onSubmit={handleProfileUpdate} className="space-y-6 max-w-2xl bg-[#0B0B0B] p-8 rounded-xl border border-[#1F1F1F]">

                                        <div className="flex flex-col md:flex-row items-center gap-6 pb-6 border-b border-[#1F1F1F]">
                                            <div className="w-24 h-24 rounded-xl bg-[#121212] overflow-hidden shadow-[0_0_15px_rgba(245,185,66,0.1)] border-2 border-[#1F1F1F] relative group">
                                                {previewImage ? (
                                                    <img src={previewImage} alt="Profile Preview" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-3xl font-serif text-[#A1A1A1]">{user?.name?.charAt(0) || 'O'}</div>
                                                )}
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                                    <span className="text-[#F5F5F5] text-xs font-medium">Change</span>
                                                </div>
                                                <input type="file" onChange={handleImageChange} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-medium text-[#F5F5F5] mb-1">Owner Photo</h3>
                                                <p className="text-sm text-[#A1A1A1]">Upload a professional avatar or logo. Recommended size: 256x256px.</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-[#A1A1A1] mb-2">Full Name</label>
                                                <input
                                                    type="text"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    className="w-full bg-[#050505] border border-[#1F1F1F] rounded-lg px-4 py-3 text-[#F5F5F5] focus:outline-none focus:border-[#F5B942] transition-colors"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-[#A1A1A1] mb-2">Email Address</label>
                                                <input
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    className="w-full bg-[#050505] border border-[#1F1F1F] rounded-lg px-4 py-3 text-[#F5F5F5] focus:outline-none focus:border-[#F5B942] transition-colors"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-[#A1A1A1] mb-2">Mobile Number</label>
                                                <input
                                                    type="tel"
                                                    value={formData.mobileNumber}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val.startsWith('+91 ')) setFormData({ ...formData, mobileNumber: val });
                                                        else if (val === '+91' || val.length < 4) setFormData({ ...formData, mobileNumber: '+91 ' });
                                                        else setFormData({ ...formData, mobileNumber: val });
                                                    }}
                                                    className="w-full bg-[#050505] border border-[#1F1F1F] rounded-lg px-4 py-3 text-[#F5F5F5] focus:outline-none focus:border-[#F5B942] transition-colors"
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-4 flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={authLoading}
                                                className="bg-[#F5B942] text-black px-8 py-3 rounded-lg font-medium hover:bg-amber-400 transition-colors shadow-[0_0_15px_rgba(212,175,55,0.3)] disabled:opacity-50"
                                            >
                                                {authLoading ? 'Saving...' : 'Save Profile Changes'}
                                            </button>
                                        </div>
                                    </form>

                                    {/* Table Configuration Section */}
                                    <h3 className="text-xl font-serif text-[#F5F5F5] mt-12 mb-6 border-b border-[#1F1F1F] pb-4 flex items-center gap-3">
                                        🪑 Table Configuration
                                    </h3>
                                    <form onSubmit={handleSaveTableConfig} className="space-y-5 max-w-2xl bg-[#0B0B0B] p-8 rounded-xl border border-[#1F1F1F]">
                                        <p className="text-sm text-[#A1A1A1]">Define how many tables of each type your restaurant has. Booking slots use this to match customers to the right table.</p>
                                        {tableConfigMsg.text && (
                                            <div className={`p-3 rounded-lg text-sm font-medium ${tableConfigMsg.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                                {tableConfigMsg.text}
                                            </div>
                                        )}
                                        <div className="grid grid-cols-2 gap-5">
                                            {[
                                                { key: 'twoSeaterTables', label: '2-Seater Tables', hint: 'Party of 1–2' },
                                                { key: 'fourSeaterTables', label: '4-Seater Tables', hint: 'Party of 3–4' },
                                                { key: 'sixSeaterTables', label: '6-Seater Tables', hint: 'Party of 5–6' },
                                                { key: 'groupTables', label: 'Group Tables (7+)', hint: 'Large parties' },
                                            ].map(({ key, label, hint }) => (
                                                <div key={key}>
                                                    <label className="block text-sm font-medium text-[#A1A1A1] mb-1">{label}</label>
                                                    <input
                                                        type="number" min="0"
                                                        value={tableConfig[key]}
                                                        onChange={e => setTableConfig({ ...tableConfig, [key]: parseInt(e.target.value) || 0 })}
                                                        className="w-full bg-[#050505] border border-[#1F1F1F] rounded-lg px-4 py-3 text-[#F5F5F5] focus:outline-none focus:border-[#F5B942] transition-colors"
                                                    />
                                                    <p className="text-xs text-[#3a3a3a] mt-1">{hint}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="pt-2 flex items-center justify-between">
                                            <span className="text-sm text-[#A1A1A1]">
                                                Total tables: <span className="text-[#F5B942] font-semibold">
                                                    {(tableConfig.twoSeaterTables || 0) + (tableConfig.fourSeaterTables || 0) + (tableConfig.sixSeaterTables || 0) + (tableConfig.groupTables || 0)}
                                                </span>
                                            </span>
                                            <button type="submit" disabled={restLoading}
                                                className="bg-[#F5B942] text-black px-8 py-3 rounded-lg font-medium hover:bg-amber-400 transition-colors shadow-[0_0_15px_rgba(212,175,55,0.3)] disabled:opacity-50"
                                            >
                                                {restLoading ? 'Saving...' : 'Save Table Config'}
                                            </button>
                                        </div>
                                    </form>

                                    <h3 className="text-xl font-serif text-[#F5F5F5] mt-12 mb-6 border-b border-[#1F1F1F] pb-4 flex items-center gap-3">
                                        🔐 Security & Password
                                    </h3>
                                    <form onSubmit={handleChangePassword} className="space-y-5 max-w-2xl bg-[#0B0B0B] p-8 rounded-xl border border-[#1F1F1F]">
                                        <p className="text-sm text-[#A1A1A1]">Regularly updating your password ensures your restaurant account remains secure.</p>
                                        {passwordMsg.text && (
                                            <div className={`p-3 rounded-lg text-sm font-medium ${passwordMsg.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}>
                                                {passwordMsg.text}
                                            </div>
                                        )}
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-[#A1A1A1] mb-1">Current Password</label>
                                                <input
                                                    type="password"
                                                    value={passwordData.currentPassword}
                                                    onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                                    className="w-full bg-[#050505] border border-[#1F1F1F] rounded-lg px-4 py-3 text-[#F5F5F5] focus:outline-none focus:border-[#F5B942] transition-colors"
                                                    required
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-[#A1A1A1] mb-1">New Password</label>
                                                    <input
                                                        type="password"
                                                        value={passwordData.newPassword}
                                                        onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                        className="w-full bg-[#050505] border border-[#1F1F1F] rounded-lg px-4 py-3 text-[#F5F5F5] focus:outline-none focus:border-[#F5B942] transition-colors"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-[#A1A1A1] mb-1">Confirm New Password</label>
                                                    <input
                                                        type="password"
                                                        value={passwordData.confirmPassword}
                                                        onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                        className="w-full bg-[#050505] border border-[#1F1F1F] rounded-lg px-4 py-3 text-[#F5F5F5] focus:outline-none focus:border-[#F5B942] transition-colors"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="pt-2 flex justify-end">
                                            <button type="submit"
                                                className="bg-white/10 text-[#F5F5F5] px-8 py-3 rounded-lg font-medium hover:bg-white/20 transition-colors border border-[#1F1F1F]"
                                            >
                                                Update Password
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* Support Tab Content */}
                            {activeTab === 'support' && (
                                <div>
                                    <div className="flex justify-between items-center mb-8">
                                        <div>
                                            <h2 className="text-2xl font-serif text-[#F5F5F5]">Partner Support</h2>
                                            <p className="text-[#A1A1A1] text-sm mt-1">Need help with your restaurant or bookings? Raise a ticket.</p>
                                        </div>
                                        <button
                                            onClick={() => setIsTicketModalOpen(true)}
                                            className="bg-[#F5B942] text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-400 transition-colors flex items-center shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                                        >
                                            <Plus size={16} className="mr-1" /> Raise Ticket
                                        </button>
                                    </div>

                                    {ticketsLoading ? (
                                        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-[#F5B942] animate-spin" /></div>
                                    ) : tickets.length === 0 ? (
                                        <div className="text-center py-20 bg-[#0B0B0B] rounded-2xl border border-[#1F1F1F]">
                                            <ShieldAlert size={40} className="text-[#1F1F1F] mx-auto mb-4" />
                                            <p className="text-[#A1A1A1]">No support tickets yet. We're here to help if you encounter any issues.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {tickets.map(ticket => (
                                                <div key={ticket._id} className="bg-[#0B0B0B] border border-[#1F1F1F] rounded-xl p-6 hover:border-white/30 transition-colors">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div>
                                                            <div className="flex items-center gap-3 mb-1">
                                                                <span className="text-[#F5F5F5] font-medium">{ticket.ticketId}</span>
                                                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${ticket.status === 'Open' ? 'bg-[#F5B942]/10 text-[#F5B942] border border-[#F5B942]/20' : ticket.status === 'In Progress' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                                                                    {ticket.status}
                                                                </span>
                                                            </div>
                                                            <h4 className="text-[#F5B942] text-sm font-medium">{ticket.category}</h4>
                                                        </div>
                                                        <span className="text-[#A1A1A1] text-xs">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="text-[#A1A1A1] text-sm bg-black/30 p-4 rounded-lg mb-4">{ticket.description}</p>

                                                    {ticket.image && (
                                                        <div className="mb-4">
                                                            <a href={`http://localhost:5000${ticket.image}`} target="_blank" rel="noopener noreferrer">
                                                                <img src={`http://localhost:5000${ticket.image}`} alt="Attachment" className="max-w-xs h-32 object-cover rounded-lg border border-[#1F1F1F] hover:opacity-80 transition-opacity" />
                                                            </a>
                                                        </div>
                                                    )}

                                                    {ticket.messages && ticket.messages.length > 1 && (
                                                        <div className="mt-4 pt-4 border-t border-[#1F1F1F] space-y-3">
                                                            <p className="text-[10px] text-[#A1A1A1] uppercase tracking-widest font-bold">Responses</p>
                                                            {ticket.messages.slice(1).map((msg, i) => (
                                                                <div key={i} className={`p-3 rounded-lg text-sm ${msg.senderId === user?._id ? 'bg-white/5 text-[#F5F5F5] ml-8' : 'bg-[#F5B942]/5 border border-[#F5B942]/10 text-amber-200 mr-8'}`}>
                                                                    <p>{msg.message}</p>
                                                                    <p className="text-[10px] text-[#3a3a3a] mt-1">{new Date(msg.timestamp).toLocaleString()}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Raise Ticket Modal Overlay */}
                                    {isTicketModalOpen && (
                                        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#0B0B0B] border border-[#1F1F1F] rounded-2xl p-8 max-w-lg w-full shadow-2xl">
                                                <h3 className="text-2xl font-serif text-[#F5F5F5] mb-6">Raise Support Ticket</h3>
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-xs text-[#A1A1A1] uppercase tracking-widest mb-1 font-medium">Issue Category</label>
                                                        <select
                                                            value={newTicket.category}
                                                            onChange={e => setNewTicket({ ...newTicket, category: e.target.value })}
                                                            className="w-full bg-[#050505] border border-[#1F1F1F] rounded-xl px-4 py-3 text-[#F5F5F5] focus:outline-none focus:border-[#F5B942]"
                                                        >
                                                            <option value="Booking Issue">Booking Issue</option>
                                                            <option value="Payment Issue">Payment Issue</option>
                                                            <option value="Restaurant Complaint">Restaurant Complaint</option>
                                                            <option value="Platform Bug">Platform Bug</option>
                                                            <option value="Refund Request">Refund Request</option>
                                                            <option value="General Inquiry">General Inquiry</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-[#A1A1A1] uppercase tracking-widest mb-1 font-medium">Describe your issue</label>
                                                        <textarea
                                                            value={newTicket.description}
                                                            onChange={e => setNewTicket({ ...newTicket, description: e.target.value })}
                                                            placeholder="Please provide details..."
                                                            className="w-full bg-[#050505] border border-[#1F1F1F] rounded-xl px-4 py-3 text-[#F5F5F5] focus:outline-none focus:border-[#F5B942] h-32"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-[#A1A1A1] uppercase tracking-widest mb-1 font-medium">Attachment (Optional)</label>
                                                        <input
                                                            type="file"
                                                            onChange={e => setNewTicket({ ...newTicket, ticketImage: e.target.files[0] })}
                                                            accept="image/*"
                                                            className="w-full bg-[#050505] border border-[#1F1F1F] rounded-xl px-4 py-3 text-[#F5F5F5] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#F5B942]/10 file:text-[#F5B942] hover:file:bg-[#F5B942]/20 text-sm"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex gap-3 mt-8">
                                                    <button onClick={() => setIsTicketModalOpen(false)} className="flex-1 px-4 py-3 bg-white/5 text-[#F5F5F5] rounded-xl hover:bg-white/10 transition-colors border border-[#1F1F1F]">Cancel</button>
                                                    <button onClick={handleCreateTicket} className="flex-1 px-4 py-3 bg-[#F5B942] text-black rounded-xl font-medium hover:bg-amber-400 transition-colors shadow-[0_0_15px_rgba(212,175,55,0.3)]">Submit Ticket</button>
                                                </div>
                                            </motion.div>
                                        </div>
                                    )}
                                </div>
                            )}


                            {activeTab === 'subscription' && (
                                <div>
                                    <div className="flex justify-between items-center mb-8">
                                        <h2 className="text-2xl font-serif text-[#F5F5F5]">Restaurant Subscription</h2>
                                        <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${restaurant?.subscriptionStatus === 'active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                            {restaurant?.subscriptionStatus?.toUpperCase() || 'INACTIVE'}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                                        <div className="bg-[#0B0B0B] border border-[#1F1F1F] p-6 rounded-2xl md:col-span-2">
                                            <h3 className="text-[#A1A1A1] font-medium text-xs uppercase tracking-widest mb-6 pb-2 border-b border-[#1F1F1F]">Current Plan Details</h3>
                                            <div className="space-y-6">
                                                <div className="flex justify-between items-end">
                                                    <div>
                                                        <p className="text-[#F5B942] text-sm font-medium mb-1">Premium Partner Plan</p>
                                                        <p className="text-2xl font-serif text-[#F5F5F5]">₹1,000 <span className="text-[#A1A1A1] text-sm font-sans">/ month</span></p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[#A1A1A1] text-xs uppercase tracking-widest mb-1">Expires On</p>
                                                        <p className="text-[#F5F5F5] font-medium">{restaurant?.subscriptionExpiresAt ? new Date(restaurant.subscriptionExpiresAt).toLocaleDateString() : 'N/A'}</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 pt-4">
                                                    <div className="p-4 bg-white/5 rounded-xl border border-[#1F1F1F]">
                                                        <p className="text-[#A1A1A1] text-[10px] uppercase font-bold mb-2">Bookings Allowed</p>
                                                        <p className="text-[#F5F5F5] font-serif">Unlimited</p>
                                                    </div>
                                                    <div className="p-4 bg-white/5 rounded-xl border border-[#1F1F1F]">
                                                        <p className="text-[#A1A1A1] text-[10px] uppercase font-bold mb-2">Platform Fee</p>
                                                        <p className="text-[#F5F5F5] font-serif">₹100 / booking</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-[#F5B942]/5 border border-[#F5B942]/20 p-6 rounded-2xl flex flex-col justify-between">
                                            <div>
                                                <div className="w-12 h-12 bg-[#F5B942]/20 rounded-xl flex items-center justify-center text-[#F5B942] mb-4">
                                                    <CreditCard size={24} />
                                                </div>
                                                <h3 className="text-[#F5F5F5] font-serif text-lg mb-2">Quick Renewal</h3>
                                                <p className="text-[#A1A1A1] text-xs leading-relaxed">Ensure uninterrupted service and keep your restaurant visible to thousands of customers.</p>
                                            </div>
                                            <button
                                                onClick={handleRenewSubscription}
                                                disabled={isRenewing}
                                                className="w-full py-3 bg-[#F5B942] text-black rounded-xl font-bold text-sm hover:bg-amber-400 transition-colors shadow-[0_0_20px_rgba(245,185,66,0.2)] mt-6 disabled:opacity-50"
                                            >
                                                {isRenewing ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Renew Now'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-[#0B0B0B] border border-[#1F1F1F] p-6 rounded-2xl">
                                        <h3 className="text-[#A1A1A1] font-medium text-xs uppercase tracking-widest mb-6 pb-2 border-b border-[#1F1F1F]">Payment History</h3>
                                        {historyLoading ? (
                                            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[#F5B942]" /></div>
                                        ) : subscriptionHistory.length > 0 ? (
                                            <div className="space-y-4">
                                                {subscriptionHistory.map((payment) => (
                                                    <div key={payment._id} className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-[#1F1F1F]">
                                                        <div>
                                                            <p className="text-[#F5F5F5] text-sm font-medium">Monthly Subscription Renewal</p>
                                                            <p className="text-[#A1A1A1] text-[10px]">{new Date(payment.createdAt).toLocaleString()}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-emerald-500 text-sm font-bold">₹{payment.amount.toLocaleString()}</p>
                                                            <p className="text-[#A1A1A1] text-[10px] font-mono">{payment.razorpayPaymentId}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-10">
                                                <p className="text-[#3a3a3a] text-sm italic">No recent transactions found on the dashboard.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'promotions' && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center mb-8">
                                        <h2 className="text-2xl font-serif text-[#F5F5F5]">Promote Your Restaurant</h2>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                                        {[
                                            { type: 'Recommended', price: 500, desc: 'Appear in Recommended section for 7 days' },
                                            { type: 'Featured', price: 1500, desc: 'Featured tag and rank boost for 15 days' },
                                            { type: 'Top Homepage', price: 3000, desc: 'Hero section placement for 30 days' }
                                        ].map((plan, idx) => (
                                            <div key={idx} className="bg-[#0B0B0B] border border-[#1F1F1F] p-6 rounded-2xl flex flex-col justify-between hover:border-[#F5B942]/50 transition-colors">
                                                <div>
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <Star className="text-[#F5B942]" size={24} />
                                                        <h3 className="text-lg font-serif text-[#F5F5F5]">{plan.type}</h3>
                                                    </div>
                                                    <p className="text-2xl font-bold text-[#F5B942] mb-2">₹{plan.price}</p>
                                                    <p className="text-[#A1A1A1] text-sm mb-6">{plan.desc}</p>
                                                </div>
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            const orderRes = await api.post('promotions/payment-order', { amount: plan.price });
                                                            const { id: rzpOrderId, amount, currency } = orderRes.data;
                                                            const options = {
                                                                key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_zHnC7K1561t7qK',
                                                                amount: amount,
                                                                currency: currency || 'INR',
                                                                name: 'Tableo Promotions',
                                                                description: `${plan.type} Plan`,
                                                                order_id: rzpOrderId,
                                                                handler: async function (response) {
                                                                    const durationMap = { 'Recommended': 7, 'Featured': 15, 'Top Homepage': 30 };
                                                                    const days = durationMap[plan.type] || 7;
                                                                    const startDate = new Date();
                                                                    const endDate = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);
                                                                    
                                                                    await dispatch(createPromotion({
                                                                        restaurantId: restaurant._id,
                                                                        promotionType: plan.type,
                                                                        startDate,
                                                                        endDate,
                                                                        amount: plan.price,
                                                                        razorpay_order_id: response.razorpay_order_id,
                                                                        razorpay_payment_id: response.razorpay_payment_id,
                                                                        razorpay_signature: response.razorpay_signature
                                                                    })).unwrap();
                                                                },
                                                                prefill: { name: user?.name, email: user?.email, contact: user?.mobileNumber || '' },
                                                                theme: { color: '#f59e0b' }
                                                            };
                                                            const rzp = new window.Razorpay(options);
                                                            rzp.open();
                                                        } catch (err) {
                                                            console.error("Failed promotion initialization", err);
                                                        }
                                                    }}
                                                    className="w-full py-3 bg-[#F5B942]/10 text-[#F5B942] border border-[#F5B942]/30 rounded-xl font-bold text-sm hover:bg-[#F5B942] hover:text-black transition-colors"
                                                >
                                                    Buy Now
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="bg-[#0B0B0B] border border-[#1F1F1F] p-6 rounded-2xl">
                                        <h3 className="text-[#A1A1A1] font-medium text-xs uppercase tracking-widest mb-6 pb-2 border-b border-[#1F1F1F]">Promotion History</h3>
                                        {promoLoading ? (
                                            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[#F5B942]" /></div>
                                        ) : promotions && promotions.length > 0 ? (
                                            <div className="space-y-4">
                                                {promotions.map((promo) => (
                                                    <div key={promo._id} className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-[#1F1F1F]">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <p className="text-[#F5F5F5] text-sm font-medium">{promo.promotionType} Plan</p>
                                                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${promo.status === 'active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : promo.status === 'expired' ? 'bg-zinc-500/10 text-[#A1A1A1] border border-zinc-500/20' : promo.status === 'rejected' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-[#F5B942]/10 text-[#F5B942] border border-[#F5B942]/20'}`}>
                                                                    {promo.status}
                                                                </span>
                                                            </div>
                                                            <p className="text-[#A1A1A1] text-[10px]">
                                                                {new Date(promo.startDate).toLocaleDateString()} to {new Date(promo.endDate).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[#F5B942] text-sm font-bold">₹{promo.amount.toLocaleString()}</p>
                                                            {promo.adminMessage && promo.status === 'rejected' && (
                                                                <p className="text-red-400 text-[10px] mt-1 italic">Reason: {promo.adminMessage}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-10">
                                                <p className="text-[#3a3a3a] text-sm italic">You haven't purchased any promotions yet.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                        </motion.div>
                    </div>

                </div>
            </div >
        </div >
    );
};

export default OwnerDashboard;
