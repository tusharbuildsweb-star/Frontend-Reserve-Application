import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Star, Heart, Settings, LogOut, Ticket, ChevronRight, MapPin, Clock, Users, MessageSquare, XCircle, AlertTriangle } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchUserReservations, cancelReservation } from '@/app/features/reservationSlice';
import { logout, updateProfile, loadUser } from '@/app/features/authSlice';
import { fetchUserTickets, createTicket } from '@/app/features/supportSlice';
import { fetchUserReviews, deleteReview } from '@/app/features/reviewSlice';
import { fetchNotifications } from '@/app/features/notificationSlice';
import { io } from 'socket.io-client';
import api from '@/services/api';
import ReservationCancelModal from '@/components/common/ReservationCancelModal';
import ReservationRescheduleModal from '@/components/common/ReservationRescheduleModal';
import { useAlert } from '@/context/AlertContext';

const CountdownTimer = ({ targetDate }) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = new Date(targetDate) - new Date();
            if (difference <= 0) return '00:00:00';

            const hours = Math.floor((difference / (1000 * 60 * 60)));
            const minutes = Math.floor((difference / 1000 / 60) % 60);
            const seconds = Math.floor((difference / 1000) % 60);

            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        };

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        setTimeLeft(calculateTimeLeft());
        return () => clearInterval(timer);
    }, [targetDate]);

    return (
        <div className="flex items-center gap-2 bg-[#F5B942]/10 px-3 py-1.5 rounded-lg border border-[#F5B942]/20">
            <Clock size={14} className="text-[#F5B942] animate-pulse" />
            <span className="text-[#F5B942] font-mono font-bold text-sm tracking-tighter">{timeLeft} left</span>
        </div>
    );
};

const UserDashboard = () => {
    const { showAlert } = useAlert();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('reservations');
    const [reservationTab, setReservationTab] = useState('upcoming');
    const { user, loading: authLoading } = useSelector((state) => state.auth);
    const { upcoming: reservations, history: reservationHistory, loading } = useSelector((state) => state.reservations);
    const { tickets, loading: supportLoading } = useSelector((state) => state.support);
    const { list: reviews, loading: reviewsLoading } = useSelector((state) => state.reviews);

    const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
    const [selectedReservation, setSelectedReservation] = useState(null);
    const [favorites, setFavorites] = useState([]);
    const [favoritesLoading, setFavoritesLoading] = useState(false);
    const [recommendations, setRecommendations] = useState([]);
    const [recommendationsLoading, setRecommendationsLoading] = useState(false);
    const [ticketData, setTicketData] = useState({ category: 'Booking Issue', description: '', ticketImage: null });

    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        mobileNumber: user?.mobileNumber || ''
    });
    const [profileImage, setProfileImage] = useState(null);
    const API_BASE = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const [previewImage, setPreviewImage] = useState(user?.profileImage ? `${API_BASE}${user.profileImage}` : null);
    const [updateMessage, setUpdateMessage] = useState({ type: '', text: '' });

    // Change Password State
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

    // Update local state if Redux user updates
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                mobileNumber: user.mobileNumber || ''
            });
            if (user.profileImage) {
                setPreviewImage(`${API_BASE}${user.profileImage}`);
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

    const handleCreateTicket = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('category', ticketData.category);
            formData.append('description', ticketData.description);
            if (ticketData.ticketImage) {
                formData.append('ticketImage', ticketData.ticketImage);
            }
            await dispatch(createTicket(formData)).unwrap();
            setIsTicketModalOpen(false);
            setTicketData({ category: 'Booking Issue', description: '', ticketImage: null });
            dispatch(fetchUserTickets());
        } catch (error) {
            console.error(error);
        }
    };

    const fetchFavorites = async () => {
        setFavoritesLoading(true);
        try {
            const res = await api.get('users/favorites');
            setFavorites(res.data);
        } catch (err) {
            console.error("Failed to fetch favorites", err);
        } finally {
            setFavoritesLoading(false);
        }
    };

    const fetchRecommendations = async () => {
        setRecommendationsLoading(true);
        try {
            const res = await api.get('users/recommendations');
            setRecommendations(res.data);
        } catch (err) {
            console.error("Failed to fetch recommendations", err);
        } finally {
            setRecommendationsLoading(false);
        }
    };

    useEffect(() => {
        dispatch(fetchUserReservations());
        dispatch(fetchUserTickets());
        dispatch(fetchUserReviews());
        fetchFavorites();
        fetchRecommendations();

        if (user?._id) {
            const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
            const socket = io(SOCKET_URL);

            socket.on('ticketUpdated', (ticket) => {
                if (ticket.userId === user._id) {
                    dispatch(fetchUserTickets());
                }
            });

            socket.on('reservationUpdated', () => {
                dispatch(fetchUserReservations());
            });

            // Global update: booking expired to Completed, or cancelled, profile updated, etc.
            socket.on('globalUpdate', () => {
                dispatch(fetchUserReservations());
                dispatch(fetchNotifications());
                dispatch(loadUser());
            });

            return () => socket.disconnect();
        }
    }, [dispatch, user?._id]);

    const handleDeleteReview = (id) => {
        showAlert({
            type: 'warning',
            title: 'Delete Review',
            message: 'Are you sure you want to delete this review?',
            showCancel: true,
            confirmText: 'Delete',
            onConfirm: () => {
                dispatch(deleteReview(id));
            }
        });
    };

    const handleCancelClick = (res) => {
        setSelectedReservation(res);
        setIsCancelModalOpen(true);
    };

    const handleConfirmCancel = async (id) => {
        try {
            await dispatch(cancelReservation(id)).unwrap();
            dispatch(fetchUserReservations());
        } catch (error) {
            showAlert({
                type: 'error',
                title: 'Cancellation Failed',
                message: error || 'Failed to cancel reservation'
            });
        }
    };

    const handleModify = (res) => {
        // Direct users to the restaurant page to pick a new slot
        // In a real app, we might pass state to pre-fill the form
        navigate(`/restaurants/${res.restaurantId._id}`, {
            state: {
                modifying: true,
                oldReservationId: res._id,
                guests: res.guests,
                date: res.date
            }
        });
    };

    const handleToggleFavorite = async (restaurantId) => {
        try {
            await api.post(`users/favorites/${restaurantId}`);
            fetchFavorites();
            showAlert({ type: 'success', title: 'Favorites Updated', message: 'Restaurant removed from favorites.' });
        } catch (err) {
            console.error(err);
        }
    };

    // Countdown Timer Component
    const CountdownTimer = ({ targetDate }) => {
        const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, total: 0 });

        useEffect(() => {
            const timer = setInterval(() => {
                const now = new Date().getTime();
                const distance = new Date(targetDate).getTime() - now;

                if (distance < 0) {
                    clearInterval(timer);
                    setTimeLeft({ hours: 0, minutes: 0, seconds: 0, total: 0 });
                } else {
                    setTimeLeft({
                        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                        seconds: Math.floor((distance % (1000 * 60)) / 1000),
                        total: distance
                    });
                }
            }, 1000);

            return () => clearInterval(timer);
        }, [targetDate]);

        if (timeLeft.total <= 0) return null;

        return (
            <div className="flex items-center gap-2 text-[#F5B942] font-mono text-sm bg-[#F5B942]/10 px-4 py-2 rounded-xl border border-[#F5B942]/20">
                <Clock size={14} className="animate-pulse" />
                <span className="uppercase text-[10px] tracking-widest font-bold mr-2 text-[#F5B942]/60">Arriving In</span>
                <span>{String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}</span>
            </div>
        );
    };

    const nextReservation = reservations?.length > 0
        ? [...reservations].sort((a, b) => new Date(a.bookingDateTime) - new Date(b.bookingDateTime))[0]
        : null;

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
                            <div className="w-28 h-28 rounded-full bg-[#121212] overflow-hidden flex items-center justify-center shadow-[0_0_30px_rgba(245,185,66,0.2)] border-2 border-[#F5B942]/50">
                                {user?.profileImage ? (
                                    <img src={`http://localhost:5000${user.profileImage}`} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-4xl font-serif text-[#F5B942]">{user?.name?.charAt(0) || 'U'}</span>
                                )}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#F5B942] rounded-full flex items-center justify-center border-4 border-zinc-900 shadow-lg">
                                <div className="w-2 h-2 bg-black rounded-full animate-pulse" />
                            </div>
                        </div>
                        <div>
                            <span className="text-[#F5B942] font-medium tracking-[0.2em] uppercase text-xs mb-2 block">
                                Private Member
                            </span>
                            <h1 className="text-4xl md:text-5xl font-serif text-[#F5F5F5] mb-3 tracking-tight">{user?.name}</h1>
                            <div className="flex flex-col md:flex-row md:items-center gap-4">
                                <div className="flex flex-wrap items-center gap-4 text-[#A1A1A1] text-sm">
                                    <span className="flex items-center"><MessageSquare size={14} className="mr-2 text-[#F5F5F5]/40" /> {user?.email}</span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#121212] hidden md:block" />
                                    <span className="flex items-center font-medium text-[#F5B942]/80 tracking-widest uppercase text-[10px]">Joined {new Date(user?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                                </div>
                                {nextReservation && <CountdownTimer targetDate={nextReservation.bookingDateTime} />}
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 md:mt-0 flex gap-4 relative z-10">
                        <button
                            onClick={() => { dispatch(logout()); navigate('/'); }}
                            className="px-6 py-3 bg-white/5 border border-[#1F1F1F] rounded-2xl text-[#A1A1A1] hover:text-red-400 hover:border-red-400/30 hover:bg-red-500/5 transition-all duration-300 flex items-center group font-medium"
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
                                <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#3a3a3a]">Overview</span>
                            </div>
                            <button
                                onClick={() => setActiveTab('reservations')}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group ${activeTab === 'reservations' ? 'bg-[#F5B942] text-black shadow-[0_10px_20px_rgba(245,185,66,0.2)]' : 'text-[#A1A1A1] hover:bg-white/5 hover:text-[#F5F5F5]'}`}
                            >
                                <span className="flex items-center font-semibold"><Calendar size={20} className={`mr-4 ${activeTab === 'reservations' ? 'text-black' : 'text-[#F5B942] group-hover:scale-110 transition-transform'}`} /> Reservations</span>
                                {activeTab === 'reservations' && <ChevronRight size={16} />}
                            </button>
                            <button
                                onClick={() => setActiveTab('favorites')}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group ${activeTab === 'favorites' ? 'bg-[#F5B942] text-black shadow-[0_10px_20px_rgba(245,185,66,0.2)]' : 'text-[#A1A1A1] hover:bg-white/5 hover:text-[#F5F5F5]'}`}
                            >
                                <span className="flex items-center font-semibold"><Heart size={20} className={`mr-4 ${activeTab === 'favorites' ? 'text-black' : 'text-[#F5B942] group-hover:scale-110 transition-transform'}`} /> Favorites</span>
                                {activeTab === 'favorites' && <ChevronRight size={16} />}
                            </button>
                            <button
                                onClick={() => setActiveTab('reviews')}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group ${activeTab === 'reviews' ? 'bg-[#F5B942] text-black shadow-[0_10px_20px_rgba(245,185,66,0.2)]' : 'text-[#A1A1A1] hover:bg-white/5 hover:text-[#F5F5F5]'}`}
                            >
                                <span className="flex items-center font-semibold"><Star size={20} className={`mr-4 ${activeTab === 'reviews' ? 'text-black' : 'text-[#F5B942] group-hover:scale-110 transition-transform'}`} /> My Reviews</span>
                                {activeTab === 'reviews' && <ChevronRight size={16} />}
                            </button>
                            <button
                                onClick={() => setActiveTab('support')}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group ${activeTab === 'support' ? 'bg-[#F5B942] text-black shadow-[0_10px_20px_rgba(245,185,66,0.2)]' : 'text-[#A1A1A1] hover:bg-white/5 hover:text-[#F5F5F5]'}`}
                            >
                                <span className="flex items-center font-semibold"><Ticket size={20} className={`mr-4 ${activeTab === 'support' ? 'text-black' : 'text-[#F5B942] group-hover:scale-110 transition-transform'}`} /> Support</span>
                                {activeTab === 'support' && <ChevronRight size={16} />}
                            </button>
                            <div className="pt-6 mt-4 border-t border-[#1F1F1F] px-4 mb-2">
                                <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#3a3a3a]">Account</span>
                            </div>
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
                            {/* Reservations Tab */}
                            {activeTab === 'reservations' && (
                                <div>
                                    {/* Penalty Banner */}
                                    {user?.penaltyBalance > 0 && (
                                        <div className="mb-6 flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl">
                                            <AlertTriangle size={20} className="text-red-400 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-red-400 font-semibold text-sm">Pending Cancellation Penalty — ₹{user.penaltyBalance}</p>
                                                <p className="text-[#A1A1A1] text-xs mt-0.5">
                                                    This penalty was applied due to a late cancellation (within 2 hours of reservation) and will be automatically added to your next booking's total.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                                        <h2 className="text-2xl font-serif text-[#F5F5F5]">Your Reservations</h2>
                                        <div className="flex bg-[#050505] p-1 rounded-xl border border-[#1F1F1F]">
                                            {['Upcoming', 'History'].map(tab => (
                                                <button
                                                    key={tab}
                                                    onClick={() => setReservationTab(tab.toLowerCase())}
                                                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${reservationTab === tab.toLowerCase() ? 'bg-[#F5B942] text-black' : 'text-[#A1A1A1] hover:text-[#F5F5F5]'}`}
                                                >
                                                    {tab}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        {loading ? (
                                            <p className="text-[#A1A1A1]">Loading your reservations...</p>
                                        ) : (() => {
                                            const displayList = reservationTab === 'upcoming' ? (reservations || []) : (reservationHistory || []);
                                            return displayList.length > 0 ? displayList.map(res => (
                                                <div key={res._id} className="flex flex-col md:flex-row gap-6 p-4 border border-[#1F1F1F] rounded-xl hover:border-[#F5B942]/30 transition-colors bg-[#0B0B0B]">
                                                    <img src={res.restaurantId?.images?.[0] || "https://images.unsplash.com/photo-1544148103-0773bf10d330?q=80&w=2070"} alt={res.restaurantId?.name} className="w-full md:w-48 h-32 object-cover rounded-lg" />
                                                    <div className="flex-1 flex flex-col justify-between py-1">
                                                        <div>
                                                            <div className="flex justify-between items-start mb-2">
                                                                <h3 className="text-xl font-serif text-[#F5F5F5]">{res.restaurantId?.name || 'Restaurant'}</h3>
                                                                <span className={`px-3 py-1 text-xs rounded-full border ${
                                                                    res.status === 'confirmed' ? 'bg-green-500/10 text-green-500 border-green-500/30' :
                                                                    res.status === 'approved' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 animate-pulse' :
                                                                    res.status === 'pending' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                                                                    res.status === 'payment_initiated' ? 'bg-[#F5B942]/10 text-[#F5B942] border-[#F5B942]/30 animate-pulse' :
                                                                    res.status === 'payment_failed' ? 'bg-red-500/10 text-red-500 border-red-500/30' :
                                                                    (res.status === 'cancelled' || res.status === 'rejected') ? 'bg-red-500/5 text-red-400 border-red-500/10' :
                                                                    'bg-white/5 text-[#A1A1A1] border-[#1F1F1F]'}`}>
                                                                    {res.status === 'payment_initiated' ? 'Initializing Payment' : 
                                                                     res.status === 'approved' ? 'Awaiting Payment' :
                                                                     res.status === 'pending' ? 'Awaiting Approval' :
                                                                     res.status.replace('_', ' ')}
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-wrap gap-4 text-sm text-[#A1A1A1]">
                                                                <span className="flex items-center"><Calendar size={14} className="mr-1.5 text-[#F5F5F5]/50" /> {new Date(res.date).toLocaleDateString()}</span>
                                                                <span className="flex items-center"><Clock size={14} className="mr-1.5 text-[#F5F5F5]/50" /> {res.time}</span>
                                                                <span className="flex items-center"><Users size={14} className="mr-1.5 text-[#F5F5F5]/50" /> {res.guests} Guests</span>
                                                            </div>
                                                            {res.selectedPackage?.title && (
                                                                <div className="mt-3 inline-flex items-center px-2.5 py-1 rounded-md bg-[#F5B942]/10 text-xs text-[#F5B942] font-medium border border-[#F5B942]/20">
                                                                    <Star size={12} className="mr-1.5 fill-current" />
                                                                    {res.selectedPackage.title}
                                                                </div>
                                                            )}
                                                            {res.status === 'Confirmed' && (
                                                                <div className="mt-4">
                                                                    <CountdownTimer targetDate={res.bookingDateTime} />
                                                                </div>
                                                            )}
                                                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs text-[#A1A1A1] bg-[#050505] p-3 rounded-lg border border-[#1F1F1F]">
                                                                <div className="flex justify-between">
                                                                    <span>Order ID:</span>
                                                                    <span className="text-[#F5F5F5] font-mono">{res.razorpayOrderId || 'Pending...'}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span>Advance:</span>
                                                                    <span className="text-[#F5F5F5]">₹{res.advancePaid || 0}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span>Total Paid:</span>
                                                                    <span className="text-[#F5B942] font-medium">₹{res.totalPaidNow || 0}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span>Platform Fee:</span>
                                                                    <span className="text-[#F5F5F5]">₹{res.platformFee || 0}</span>
                                                                </div>
                                                                {res.preorderItems?.length > 0 && (
                                                                    <div className="col-span-1 sm:col-span-2 mt-2 pt-2 border-t border-[#1F1F1F] flex justify-between">
                                                                        <span>Preordered Items:</span>
                                                                        <span className="text-[#F5F5F5]">{res.preorderItems.reduce((acc, curr) => acc + (curr.quantity || 1), 0)} items (₹{res.preorderTotal || 0})</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-3 mt-4 flex-wrap">
                                                             {(res.status === 'approved' || res.status === 'payment_initiated' || res.status === 'payment_failed') && (
                                                                <button
                                                                    onClick={() => navigate('/checkout', {
                                                                        state: {
                                                                            restaurantId: res.restaurantId._id,
                                                                            restaurantName: res.restaurantId.name,
                                                                            date: res.date,
                                                                            time: res.time,
                                                                            guests: res.guests,
                                                                            slotId: res.slotId,
                                                                            advanceAmount: res.advancePaid,
                                                                            packageId: res.selectedPackage?.packageId,
                                                                            packageTitle: res.selectedPackage?.title,
                                                                            packagePrice: res.selectedPackage?.totalCost,
                                                                            reservationId: res._id // Link existing reservation
                                                                        }
                                                                    })}
                                                                    className="px-4 py-2 bg-[#F5B942] text-black text-sm rounded-lg font-bold transition-all shadow-lg shadow-[#F5B942]/20"
                                                                >
                                                                    {res.status === 'approved' ? 'Proceed to Payment' : 'Complete Payment'}
                                                                </button>
                                                            )}
                                                            {res.status === 'Completed' && (
                                                                <button onClick={() => navigate(`/reservations/${res._id}/review`)} className="px-4 py-2 bg-[#F5B942]/10 hover:bg-[#F5B942]/20 text-[#F5B942] text-sm rounded-lg transition-colors border border-[#F5B942]/30 flex items-center">
                                                                    <Star size={14} className="mr-1.5" /> Leave Review
                                                                </button>
                                                            )}
                                                            {res.status === 'confirmed' && new Date(res.bookingDateTime) > new Date() && (
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedReservation(res);
                                                                        setIsRescheduleModalOpen(true);
                                                                    }}
                                                                    className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-sm rounded-lg transition-all border border-blue-500/20 hover:border-blue-500/40 flex items-center gap-1.5 font-medium"
                                                                >
                                                                    <Calendar size={14} /> Reschedule
                                                                </button>
                                                            )}
                                                            {(res.status === 'confirmed' || res.status === 'payment_initiated') && (
                                                                <button
                                                                    onClick={() => handleCancelClick(res)}
                                                                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm rounded-lg transition-all border border-red-500/20 hover:border-red-500/40 flex items-center gap-1.5 font-medium"
                                                                >
                                                                    <XCircle size={14} /> Cancel Reservation
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )) : (
                                                <p className="text-[#A1A1A1] text-center py-10 border border-dashed border-[#1F1F1F] rounded-2xl">
                                                    {reservationTab === 'upcoming' ? "You're all caught up. No active reservations." : "No past reservations found."}
                                                </p>
                                            );
                                        })()}
                                    </div>
                                    
                                    {/* Recommendations Section */}
                                    <div className="mt-12 pt-8 border-t border-[#1F1F1F]">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2 bg-[#F5B942]/10 rounded-lg border border-[#F5B942]/20">
                                                <Star className="text-[#F5B942]" size={20} />
                                            </div>
                                            <h2 className="text-2xl font-serif text-[#F5F5F5]">Recommended for You</h2>
                                        </div>
                                        {recommendationsLoading ? (
                                            <p className="text-[#A1A1A1]">Loading recommendations...</p>
                                        ) : recommendations?.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {recommendations.map(restaurant => (
                                                    <div key={restaurant._id} className="bg-[#0B0B0B] border border-[#1F1F1F] rounded-2xl p-4 flex gap-4 hover:border-[#F5B942]/30 transition-all cursor-pointer group" onClick={() => navigate(`/restaurants/${restaurant._id}`)}>
                                                        <img src={restaurant.images?.[0] ? `${API_BASE}${restaurant.images[0]}` : "https://images.unsplash.com/photo-1544148103-0773bf10d330?q=80&w=2070"} alt={restaurant.name} className="w-24 h-24 object-cover rounded-xl" />
                                                        <div className="flex-1 py-1 flex flex-col justify-between">
                                                            <div>
                                                                <h3 className="text-lg font-serif text-[#F5F5F5] group-hover:text-[#F5B942] transition-colors line-clamp-1">{restaurant.name}</h3>
                                                                <p className="text-sm text-[#F5B942] mb-2">{restaurant.cuisine}</p>
                                                            </div>
                                                            <div className="flex items-center text-xs text-[#A1A1A1] gap-3">
                                                                <span className="flex items-center"><Star size={12} className="mr-1 text-[#F5B942] fill-current" /> {restaurant.rating || 'New'}</span>
                                                                <span className="flex items-center"><MapPin size={12} className="mr-1" /> <span className="line-clamp-1">{restaurant.location}</span></span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-[#A1A1A1]">Book more tables to get personalized recommendations!</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Reviews Tab */}
                            {activeTab === 'reviews' && (
                                <div>
                                    <h2 className="text-2xl font-serif text-[#F5F5F5] mb-6">Your Reviews</h2>
                                    <div className="space-y-6">
                                        {reviewsLoading ? (
                                            <p className="text-[#A1A1A1]">Loading your reviews...</p>
                                        ) : reviews?.length > 0 ? (
                                            reviews.map(review => (
                                                <div key={review._id} className="p-6 bg-[#0B0B0B] border border-[#1F1F1F] rounded-2xl group relative hover:border-[#F5B942]/30 transition-all">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="flex gap-4">
                                                            <div className="w-12 h-12 rounded-lg bg-[#121212] overflow-hidden flex-shrink-0">
                                                                <img src={review.restaurantId?.images?.[0] ? `${API_BASE}${review.restaurantId.images[0]}` : "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070"} alt={review.restaurantId?.name} className="w-full h-full object-cover" />
                                                            </div>
                                                            <div>
                                                                <h3 className="text-[#F5F5F5] font-medium group-hover:text-[#F5B942] transition-colors cursor-pointer" onClick={() => navigate(`/restaurants/${review.restaurantId?._id}`)}>{review.restaurantId?.name || 'Restaurant'}</h3>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <div className="flex text-[#F5B942]">
                                                                        {[...Array(5)].map((_, i) => (
                                                                            <Star key={i} size={12} className={i < review.rating ? 'fill-current' : 'text-[#1F1F1F]'} />
                                                                        ))}
                                                                    </div>
                                                                    <span className="text-xs text-[#A1A1A1]">• {new Date(review.createdAt).toLocaleDateString()}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleDeleteReview(review._id)}
                                                            className="p-2 text-[#A1A1A1] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                                        >
                                                            <LogOut size={16} className="rotate-90" title="Delete Review" />
                                                        </button>
                                                    </div>
                                                    <p className="text-[#A1A1A1] text-sm leading-relaxed italic">"{review.comment}"</p>
                                                    {review.images?.length > 0 && (
                                                        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                                                            {review.images.map((img, idx) => (
                                                                <img key={idx} src={`${API_BASE}${img}`} alt="Review" className="w-20 h-20 object-cover rounded-lg border border-[#1F1F1F]" />
                                                            ))}
                                                        </div>
                                                    )}
                                                    {review.ownerReply && (
                                                        <div className="mt-4 p-4 bg-[#F5B942]/5 border-l-2 border-[#F5B942] rounded-r-lg">
                                                            <p className="text-xs text-[#F5B942] font-bold uppercase tracking-wider mb-2">Owner Response</p>
                                                            <p className="text-[#F5F5F5] text-sm italic">"{review.ownerReply.text}"</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-[#A1A1A1] text-center py-10 border border-dashed border-[#1F1F1F] rounded-2xl">You haven't shared any reviews yet.</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Favorites Tab */}
                            {activeTab === 'favorites' && (
                                <div>
                                    <h2 className="text-2xl font-serif text-[#F5F5F5] mb-6">Saved Restaurants</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {favoritesLoading ? (
                                            <div className="col-span-full py-10 text-center text-[#A1A1A1]">Loading your favorites...</div>
                                        ) : favorites.length > 0 ? (
                                            favorites.map(fav => (
                                                <div key={fav._id} className="group relative rounded-xl overflow-hidden border border-[#1F1F1F] hover:border-[#F5B942]/50 transition-all h-64 shadow-lg">
                                                    <img src={fav.images?.[0] ? `${API_BASE}${fav.images[0]}` : "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070"} alt={fav.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent p-6 flex flex-col justify-end">
                                                        <div onClick={() => navigate(`/restaurants/${fav._id}`)} className="cursor-pointer">
                                                            <h3 className="text-xl font-serif text-[#F5F5F5] mb-1 group-hover:text-[#F5B942] transition-colors">{fav.name}</h3>
                                                            <div className="flex items-center text-sm text-[#A1A1A1]">
                                                                <span className="mr-3">{fav.cuisine?.[0] || 'Gourmet'}</span>
                                                                <span className="flex items-center"><MapPin size={12} className="mr-1" /> {fav.location?.city || fav.location?.state}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => handleToggleFavorite(fav._id)} className="absolute top-4 right-4 p-2.5 bg-black/60 backdrop-blur-md rounded-full text-red-500 hover:bg-white/10 transition-colors border border-[#1F1F1F] group/heart">
                                                        <Heart size={20} className="fill-current group-hover/heart:scale-110 transition-transform" />
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="col-span-full py-20 text-center border border-dashed border-[#1F1F1F] rounded-2xl">
                                                <Heart size={40} className="mx-auto text-zinc-800 mb-4" />
                                                <p className="text-[#A1A1A1] font-serif">You haven't saved any restaurants yet.</p>
                                                <button onClick={() => navigate('/restaurants')} className="mt-4 text-[#F5B942] hover:text-[#F5F5F5] transition-colors text-sm font-medium">Explore Restaurants</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}


                            {/* Support Tickets Tab */}
                            {activeTab === 'support' && (
                                <div>
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-2xl font-serif text-[#F5F5F5]">Support Center</h2>
                                        <button onClick={() => setIsTicketModalOpen(true)} className="bg-[#F5B942] text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#F5B942]-hover transition-colors shadow-[0_0_10px_rgba(245,185,66,0.3)]">
                                            New Ticket
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                        {supportLoading ? (
                                            <p className="text-[#A1A1A1]">Loading tickets...</p>
                                        ) : tickets?.length > 0 ? (
                                            tickets.map(ticket => (
                                                <div key={ticket._id} className="p-5 border border-[#1F1F1F] rounded-xl bg-[#0B0B0B] hover:border-white/30 transition-colors">
                                                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                                        <div>
                                                            <div className="flex items-center gap-3 mb-1">
                                                                <h4 className="text-[#F5F5F5] font-medium">{ticket.ticketId}</h4>
                                                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${ticket.status === 'Open' ? 'bg-[#F5B942]/10 text-[#F5B942] border border-[#F5B942]/20' : ticket.status === 'In Progress' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                                                                    {ticket.status}
                                                                </span>
                                                            </div>
                                                            <div className="text-xs text-[#A1A1A1] flex items-center gap-3">
                                                                <span className="text-[#F5B942] font-medium">{ticket.category}</span>
                                                                <span>•</span>
                                                                <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <p className="mt-4 text-[#F5F5F5] text-sm bg-black/30 p-4 rounded-lg">
                                                        {ticket.description}
                                                    </p>
                                                    {ticket.image && (
                                                        <div className="mt-4">
                                                            <a href={`http://localhost:5000${ticket.image}`} target="_blank" rel="noopener noreferrer">
                                                                <img src={`http://localhost:5000${ticket.image}`} alt="Attachment" className="max-w-xs h-32 object-cover rounded-lg border border-[#1F1F1F] hover:opacity-80 transition-opacity" />
                                                            </a>
                                                        </div>
                                                    )}

                                                    {ticket.messages && ticket.messages.length > 1 && (
                                                        <div className="mt-4 pt-4 border-t border-[#1F1F1F] space-y-3">
                                                            <p className="text-[10px] text-[#A1A1A1] uppercase tracking-widest font-bold">Conversation</p>
                                                            {ticket.messages.slice(1).map((msg, i) => (
                                                                <div key={i} className={`p-3 rounded-lg text-sm ${msg.senderId === user?._id ? 'bg-white/5 text-[#F5F5F5] ml-8' : 'bg-[#F5B942]/5 border border-[#F5B942]/10 text-amber-200 mr-8'}`}>
                                                                    <p>{msg.message}</p>
                                                                    <p className="text-[10px] text-[#3a3a3a] mt-1">{new Date(msg.timestamp).toLocaleString()}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-[#A1A1A1] text-center py-10 border border-dashed border-[#1F1F1F] rounded-2xl">No support tickets found.</p>
                                        )}
                                    </div>
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

                                    <form onSubmit={handleProfileUpdate} className="space-y-6 max-w-2xl bg-[#0B0B0B] p-8 rounded-xl border border-[#1F1F1F]">

                                        <div className="flex flex-col md:flex-row items-center gap-6 pb-6 border-b border-[#1F1F1F]">
                                            <div className="w-24 h-24 rounded-full bg-[#121212] overflow-hidden shadow-[0_0_15px_rgba(245,185,66,0.1)] border-2 border-[#1F1F1F] relative group">
                                                {previewImage ? (
                                                    <img src={previewImage} alt="Profile Preview" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-3xl font-serif text-[#A1A1A1]">{user?.name?.charAt(0) || 'U'}</div>
                                                )}
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                                    <span className="text-[#F5F5F5] text-xs font-medium">Change</span>
                                                </div>
                                                <input type="file" onChange={handleImageChange} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-medium text-[#F5F5F5] mb-1">Profile Picture</h3>
                                                <p className="text-sm text-[#A1A1A1]">Upload a new avatar. Recommended size: 256x256px.</p>
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
                                                {authLoading ? 'Saving...' : 'Save Changes'}
                                            </button>
                                        </div>
                                    </form>

                                    <h3 className="text-xl font-serif text-[#F5F5F5] mt-12 mb-6 border-b border-[#1F1F1F] pb-4 flex items-center gap-3">
                                        🔐 Security & Password
                                    </h3>
                                    <form onSubmit={handleChangePassword} className="space-y-5 max-w-2xl bg-[#0B0B0B] p-8 rounded-xl border border-[#1F1F1F]">
                                        <p className="text-sm text-[#A1A1A1]">Regularly updating your password ensures your account remains secure.</p>
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

                        </motion.div>
                    </div>

                </div>
            </div >

            {/* Ticket Modal */}
            {
                isTicketModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-[#0B0B0B] border border-[#1F1F1F] rounded-2xl p-6 w-full max-w-md shadow-2xl"
                        >
                            <h3 className="text-2xl font-serif text-[#F5F5F5] mb-4">Create Support Ticket</h3>
                            <form onSubmit={handleCreateTicket} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#A1A1A1] mb-1">Issue Category</label>
                                    <select
                                        value={ticketData.category}
                                        onChange={(e) => setTicketData({ ...ticketData, category: e.target.value })}
                                        className="w-full bg-black/50 border border-[#1F1F1F] rounded-lg px-4 py-2 text-[#F5F5F5] focus:outline-none focus:border-[#F5B942]"
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
                                    <label className="block text-sm font-medium text-[#A1A1A1] mb-1">Description</label>
                                    <textarea
                                        required
                                        rows="4"
                                        value={ticketData.description}
                                        onChange={(e) => setTicketData({ ...ticketData, description: e.target.value })}
                                        className="w-full bg-black/50 border border-[#1F1F1F] rounded-lg px-4 py-2 text-[#F5F5F5] focus:outline-none focus:border-[#F5B942] resize-none"
                                        placeholder="Provide detailed information..."
                                    ></textarea>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#A1A1A1] mb-1">Attachment (Optional)</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setTicketData({ ...ticketData, ticketImage: e.target.files[0] })}
                                        className="w-full text-sm text-[#A1A1A1] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#F5B942]/10 file:text-[#F5B942] hover:file:bg-[#F5B942]/20"
                                    />
                                </div>
                                <div className="flex gap-4 pt-2">
                                    <button type="button" onClick={() => setIsTicketModalOpen(false)} className="flex-1 py-2 rounded-lg border border-[#1F1F1F] text-[#A1A1A1] hover:text-[#F5F5F5] hover:bg-white/5 transition-colors">Cancel</button>
                                    <button type="submit" disabled={supportLoading} className="flex-1 py-2 rounded-lg bg-[#F5B942] text-black font-medium hover:bg-amber-400 transition-colors disabled:opacity-50">
                                        {supportLoading ? 'Submitting...' : 'Submit Ticket'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )
            }
            <ReservationCancelModal
                isOpen={isCancelModalOpen}
                onClose={() => {
                    setIsCancelModalOpen(false);
                    setSelectedReservation(null);
                }}
                onConfirm={handleConfirmCancel}
                reservation={selectedReservation}
            />
            <ReservationRescheduleModal
                isOpen={isRescheduleModalOpen}
                onClose={() => {
                    setIsRescheduleModalOpen(false);
                    setSelectedReservation(null);
                }}
                reservation={selectedReservation}
                onRescheduleSuccess={() => {
                    dispatch(fetchUserReservations());
                    setIsRescheduleModalOpen(false);
                    setSelectedReservation(null);
                }}
            />
        </div >
    );
};

export default UserDashboard;
