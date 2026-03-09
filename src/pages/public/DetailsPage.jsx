import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, Star, Heart, Share2, Users, Calendar, ChefHat, Info, Loader2, ShieldAlert, Phone, Mail, Utensils } from 'lucide-react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRestaurantById, clearCurrentRestaurant } from '../../app/features/restaurantSlice';
import { toggleFavorite } from '../../app/features/authSlice';
import { fetchPackagesByRestaurant } from '../../app/features/packageSlice';
import { fetchPublicSlots, clearPublicSlots } from '../../app/features/timeSlotSlice';
import { addReview } from '../../app/features/reviewSlice';
import { io } from 'socket.io-client';
import api from '../../services/api';
import { restaurantService } from '../../services/restaurant.service';
import ReservationCancelModal from '@/components/common/ReservationCancelModal';
import RestaurantCard from '@/components/cards/RestaurantCard';

import { useAlert } from '@/context/AlertContext';

const DetailsPage = () => {
    const { showAlert } = useAlert();
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { currentRestaurant: restaurant, loading, error } = useSelector((state) => state.restaurants);
    const { list: packages, loading: packLoading } = useSelector((state) => state.packages);
    const { publicSlots, loading: slotLoading } = useSelector((state) => state.timeSlots);
    const { isAuthenticated, user } = useSelector((state) => state.auth);

    // Duplicate booking check state
    const [existingBooking, setExistingBooking] = useState(null);
    const [isSelectedFull, setIsSelectedFull] = useState(false);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingChecked, setBookingChecked] = useState(false);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

    const [activeTab, setActiveTab] = useState('menu');
    const [guests, setGuests] = useState(2);
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [selectedPackage, setSelectedPackage] = useState("");
    const [liveCrowd, setLiveCrowd] = useState(null);

    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState("");
    const [foodRating, setFoodRating] = useState(0);
    const [ambienceRating, setAmbienceRating] = useState(0);
    const [staffRating, setStaffRating] = useState(0);
    const { loading: reviewLoading } = useSelector((state) => state.reviews);

    // Live reviews state
    const [liveReviews, setLiveReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [avgRating, setAvgRating] = useState(0);

    // Live menu state
    const [liveMenu, setLiveMenu] = useState({});
    const [menuLoading, setMenuLoading] = useState(false);

    // Recommendations state
    const [recommendations, setRecommendations] = useState([]);
    const [recLoading, setRecLoading] = useState(false);

    const dateRef = useRef(date);
    const guestsRef = useRef(guests);
    const activeTabRef = useRef(activeTab);
    const [showFloatingBtn, setShowFloatingBtn] = useState(false);
    const headerRef = useRef(null);

    const isFavorite = user?.favorites?.includes(id);

    useEffect(() => { dateRef.current = date; }, [date]);
    useEffect(() => { guestsRef.current = guests; }, [guests]);
    useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);

    // Show floating reserve button when user scrolls past the header on mobile
    useEffect(() => {
        const handleScroll = () => {
            if (headerRef.current) {
                const rect = headerRef.current.getBoundingClientRect();
                setShowFloatingBtn(rect.bottom < 0);
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const checkDuplicate = useCallback(async () => {
        if (isAuthenticated && id) {
            try {
                const res = await api.get(`reservations/restaurant/${id}/check`);
                if (res.data.hasBooking) {
                    setExistingBooking(res.data.booking);
                } else {
                    setExistingBooking(null);
                }
            } catch (err) {
                console.error("Failed to check duplicate booking", err);
            } finally {
                setBookingChecked(true);
            }
        } else {
            setBookingChecked(true);
        }
    }, [isAuthenticated, id]);

    useEffect(() => {
        checkDuplicate();
    }, [checkDuplicate]);

    const handleCancelBooking = async () => {
        if (!existingBooking) return;
        setIsCancelModalOpen(true);
    };

    const handleConfirmCancel = async (bookingId) => {
        setCancelLoading(true);
        try {
            await api.put(`reservations/${bookingId}/cancel`);
            showAlert({
                type: 'success',
                title: 'Success',
                message: 'Reservation cancelled successfully.'
            });
            setExistingBooking(null);
            checkDuplicate(); // refresh
        } catch (error) {
            console.error(error);
            showAlert({
                type: 'error',
                title: 'Error',
                message: 'Failed to cancel reservation.'
            });
        } finally {
            setCancelLoading(false);
        }
    };

    const fetchLiveMenu = useCallback(async (restaurantId) => {
        if (!restaurantId) return;
        setMenuLoading(true);
        try {
            const res = await api.get(`menu/${restaurantId}`);
            const grouped = {};
            res.data.forEach(item => {
                if (item.isAvailable === false || item.status === 'Inactive') return;
                const cat = item.category || 'Specials';
                if (!grouped[cat]) grouped[cat] = [];
                grouped[cat].push(item);
            });
            setLiveMenu(grouped);
        } catch (e) {
            console.error('Failed to fetch menu', e);
        } finally {
            setMenuLoading(false);
        }
    }, []);

    const fetchLiveReviews = useCallback(async (restaurantId) => {
        if (!restaurantId) return;
        setReviewsLoading(true);
        try {
            const res = await api.get(`reviews/${restaurantId}`);
            setLiveReviews(res.data);
            if (res.data.length > 0) {
                const avg = res.data.reduce((acc, r) => acc + r.rating, 0) / res.data.length;
                setAvgRating(parseFloat(avg.toFixed(1)));
            } else {
                setAvgRating(0);
            }
        } catch (e) {
            console.error('Failed to fetch reviews', e);
        } finally {
            setReviewsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (id) {
            dispatch(fetchRestaurantById(id));
            dispatch(fetchPackagesByRestaurant(id));

            // Fetch similar restaurants
            setRecLoading(true);
            restaurantService.getRecommendations(id)
                .then(data => setRecommendations(data))
                .catch(err => console.error("Failed to fetch recommendations:", err))
                .finally(() => setRecLoading(false));

            // Reset state on ID change (e.g. clicking a recommendation)
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setActiveTab('menu');
        }
        return () => {
            dispatch(clearCurrentRestaurant());
            dispatch(clearPublicSlots());
        };
    }, [dispatch, id]);

    useEffect(() => {
        if (date && id) {
            dispatch(fetchPublicSlots({ restaurantId: id, date, partySize: guests }));
            setTime("");
            setSelectedSlotId("");
        } else {
            dispatch(clearPublicSlots());
        }
    }, [date, id, guests, dispatch]);

    const [selectedSlotId, setSelectedSlotId] = useState("");

    useEffect(() => {
        if (restaurant?._id) {
            fetchLiveReviews(restaurant._id);
        }
    }, [restaurant?._id, fetchLiveReviews]);

    useEffect(() => {
        if (activeTab === 'menu' && restaurant?._id) {
            fetchLiveMenu(restaurant._id);
        }
    }, [activeTab, restaurant?._id, fetchLiveMenu]);

    const [searchParams] = useSearchParams();
    const reservationRef = useRef(null);

    useEffect(() => {
        if (searchParams.get('book') === 'true' && !loading && restaurant) {
            setTimeout(() => {
                reservationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 500);
        }
    }, [searchParams, loading, restaurant]);

    useEffect(() => {
        if (restaurant?._id) {
            setLiveCrowd(restaurant.crowd || '0%');

            const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
            const socket = io(SOCKET_URL);

            socket.emit('joinRestaurant', restaurant._id);

            socket.on('crowdUpdated', (data) => {
                if (data.restaurantId === restaurant._id) {
                    setLiveCrowd(data.crowdLevel);
                }
            });

            // Real-time review sync
            socket.on('reviewUpdated', (data) => {
                if (data.restaurantId === restaurant._id.toString()) {
                    fetchLiveReviews(restaurant._id);
                    dispatch(fetchRestaurantById(restaurant._id)); // refresh rating in header
                }
            });

            // Real-time slot sync
            socket.on('slotUpdated', (data) => {
                if (data.restaurantId === restaurant._id.toString() && dateRef.current) {
                    dispatch(fetchPublicSlots({ restaurantId: restaurant._id, date: dateRef.current, partySize: guestsRef.current }));
                }
            });

            // Real-time menu sync
            socket.on('menuUpdated', (data) => {
                if (data.restaurantId === restaurant._id.toString() && activeTabRef.current === 'menu') {
                    fetchLiveMenu(restaurant._id);
                }
            });

            // Real-time restaurant sync
            socket.on('restaurantUpdated', (data) => {
                if (data.restaurantId === restaurant._id.toString()) {
                    dispatch(fetchRestaurantById(restaurant._id));
                }
            });

            socket.on('reservationUpdated', () => {
                checkDuplicate();
            });

            return () => {
                socket.disconnect();
            };
        }
    }, [restaurant?._id, restaurant?.crowd, fetchLiveReviews, fetchLiveMenu, dispatch, checkDuplicate]);

    const [editingReviewId, setEditingReviewId] = useState(null);

    const handleAddReview = async (e) => {
        e.preventDefault();
        try {
            if (editingReviewId) {
                // Update existing review
                await reviewService.updateReview(editingReviewId, {
                    rating: reviewRating,
                    comment: reviewComment,
                    foodRating,
                    ambienceRating,
                    staffRating
                });
                showAlert({
                    type: 'success',
                    title: 'Review Updated',
                    message: 'Your review has been successfully updated.'
                });
            } else {
                // Add new review
                await dispatch(addReview({
                    restaurantId: restaurant._id,
                    rating: reviewRating,
                    comment: reviewComment,
                    foodRating,
                    ambienceRating,
                    staffRating
                })).unwrap();
                showAlert({
                    type: 'success',
                    title: 'Review Posted',
                    message: 'Thank you! Your review has been successfully posted.'
                });
            }

            setIsReviewModalOpen(false);
            setEditingReviewId(null);
            setReviewComment('');
            setReviewRating(5);
            showAlert({
                type: 'success',
                title: 'Review Posted',
                message: 'Thank you! Your review has been successfully posted.'
            });
            // Immediately refresh reviews + restaurant rating
            fetchLiveReviews(restaurant._id);
            dispatch(fetchRestaurantById(id));
        } catch (error) {
            showAlert({ type: 'error', title: 'Error', message: error.response?.data?.message || error || 'Failed to process review' });
        }
    };

    const handleEditClick = (review) => {
        setEditingReviewId(review._id);
        setReviewRating(review.rating || 5);
        setReviewComment(review.comment || '');
        setFoodRating(review.foodRating || 0);
        setIsReviewModalOpen(true);
    };

    const handleFavoriteClick = async () => {
        if (!isAuthenticated) {
            navigate('/login', { state: { returnTo: `/restaurants/${id}` } });
            return;
        }
        try {
            await dispatch(toggleFavorite(id));
            showAlert({ type: 'success', title: 'Favorites Updated', message: isFavorite ? 'Restaurant removed from favorites' : 'Restaurant added to favorites' });
        } catch (err) {
            showAlert({ type: 'error', title: 'Error', message: 'Failed to update favorites' });
        }
    };

    if (loading) {
        return (
            <div className="w-full min-h-screen bg-zinc-950 flex items-center justify-center pt-20">
                <div className="flex flex-col items-center">
                    <ChefHat className="w-12 h-12 text-amber-500 animate-pulse mb-4" />
                    <p className="text-zinc-400 font-light tracking-wider">Preparing your table...</p>
                </div>
            </div>
        );
    }

    if (error || !restaurant) {
        return (
            <div className="w-full min-h-screen bg-zinc-950 flex flex-col items-center justify-center pt-20">
                <h2 className="text-2xl text-white font-serif mb-2">Restaurant Unavailable</h2>
                <p className="text-zinc-400 mb-6">{error || 'Could not find the requested restaurant.'}</p>
                <button onClick={() => navigate('/restaurants')} className="text-amber-500 border border-amber-500 px-6 py-2 rounded-lg hover:bg-amber-500 hover:text-black transition-colors">
                    Explore Other Venues
                </button>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col min-h-screen bg-zinc-950 pt-20 pb-16">

            {/* Image Gallery */}
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 h-[50vh] min-h-[400px] rounded-2xl overflow-hidden">
                    <div className="md:col-span-2 h-full">
                        <img src={restaurant.images?.[0] || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80'} alt="Main" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 cursor-pointer" />
                    </div>
                    <div className="hidden md:flex flex-col gap-2 h-full">
                        <img src={restaurant.images?.[1] || 'https://images.unsplash.com/photo-1544148103-0773bf10d330?q=80'} alt="Gallery 1" className="w-full h-1/2 object-cover hover:scale-105 transition-transform duration-700 cursor-pointer" />
                        <img src={restaurant.images?.[2] || 'https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80'} alt="Gallery 2" className="w-full h-1/2 object-cover hover:scale-105 transition-transform duration-700 cursor-pointer" />
                    </div>
                    <div className="hidden md:flex flex-col gap-2 h-full relative">
                        <img src={restaurant.images?.[3] || 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80'} alt="Gallery 3" className="w-full h-1/2 object-cover hover:scale-105 transition-transform duration-700 cursor-pointer" />
                        <div className="w-full h-1/2 relative group cursor-pointer">
                            <img src={restaurant.images?.[0] || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80'} alt="Gallery 4" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <span className="text-white font-medium flex items-center"><Star className="w-4 h-4 mr-2" /> View More</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-10" ref={headerRef}>
                <div className="flex flex-col-reverse lg:flex-row gap-12">

                    {/* Left Column (Details) — order-2 on mobile so reservation panel shows first */}
                    <div className="w-full lg:w-2/3 order-2 lg:order-1">

                        {/* Header Details */}
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h1 className="text-4xl md:text-5xl font-serif text-white mb-3">{restaurant.name}</h1>
                                <div className="flex items-center text-zinc-400 text-sm flex-wrap gap-4">
                                    <span className="flex items-center text-amber-500"><Star size={16} className="mr-1 fill-current" /> {avgRating || Number(restaurant.rating || 0).toFixed(1)} <span className="text-zinc-400 ml-1">({liveReviews?.length || restaurant.reviewCount || 0} Reviews)</span></span>
                                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.name + " " + restaurant.location)}`} target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-amber-500 transition-colors cursor-pointer" title="View on Google Maps">
                                        <MapPin size={16} className="mr-1" /> {restaurant.location}
                                    </a>
                                    <span className="flex items-center"><ChefHat size={16} className="mr-1" /> {restaurant.cuisine}</span>
                                </div>
                                {restaurant.ambienceTags?.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-4">
                                        {restaurant.ambienceTags.map((tag, i) => (
                                            <span key={i} className="px-3 py-1 text-[10px] uppercase tracking-widest font-medium" style={{ background: 'rgba(245,185,66,0.1)', border: '1px solid rgba(245,185,66,0.2)', borderRadius: 20, color: '#F5B942' }}>
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <button className="p-3 bg-zinc-900 border border-white/10 rounded-full text-white hover:text-amber-500 hover:border-amber-500/50 transition-colors">
                                    <Share2 size={20} />
                                </button>
                                <button
                                    onClick={handleFavoriteClick}
                                    className={`p-3 rounded-full transition-colors border ${isFavorite ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' : 'bg-zinc-900 border-white/10 text-white hover:text-red-500 hover:border-red-500/50'}`}>
                                    <Heart size={20} className={isFavorite ? 'fill-current' : ''} />
                                </button>
                            </div>
                        </div>

                        {/* Crowd Status Glow Widget */}
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 bg-black/40 border border-white/10 p-6 rounded-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                            <div className="relative z-10 flex items-center gap-6">
                                <div className="relative flex items-center justify-center w-14 h-14 bg-black rounded-full border border-green-500/30">
                                    <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-20 animate-ping"></span>
                                    <span className="text-green-400 font-serif font-bold text-xl drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]">{liveCrowd || 'Wait'}</span>
                                </div>
                                <div>
                                    <h4 className="text-white font-medium text-lg mb-0.5">Live Occupancy Tracking</h4>
                                    <div className="flex items-center text-zinc-400">
                                        <MapPin size={18} className="mr-2 text-zinc-500" />
                                        <span>{restaurant.location}</span>
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.name + ' ' + restaurant.location)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="ml-4 flex items-center gap-1 text-xs text-amber-500 hover:text-amber-400 transition-colors bg-amber-500/10 px-2 py-1 rounded-full border border-amber-500/20"
                                        >
                                            <MapPin size={12} />
                                            Navigate in Google Maps
                                        </a>
                                    </div>
                                    <span className="text-zinc-400 flex items-center"><Clock size={14} className="mr-1 mt-0.5" /> Est Wait: {restaurant.wait || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-xs text-zinc-400 mb-6 opacity-70 flex items-center justify-end">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5 animate-pulse"></div>
                            Updated just now via Socket
                        </div>

                        {/* Description */}
                        <div className="mb-12">
                            <h3 className="text-2xl font-serif text-white mb-4">About</h3>
                            <p className="text-zinc-400 leading-relaxed font-light mb-8">{restaurant.description}</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-zinc-900/40 p-8 rounded-2xl border border-white/5">
                                <div>
                                    <h4 className="text-amber-500 text-xs uppercase tracking-widest font-bold mb-4">Working Hours</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between text-zinc-300">
                                            <span className="font-light">Monday - Friday</span>
                                            <span>{restaurant.workingHours?.weekday || '11:00 AM - 11:00 PM'}</span>
                                        </div>
                                        <div className="flex justify-between text-zinc-300">
                                            <span className="font-light">Saturday - Sunday</span>
                                            <span>{restaurant.workingHours?.weekend || '10:00 AM - 12:00 AM'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-amber-500 text-xs uppercase tracking-widest font-bold mb-4">Contact Info</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2 text-zinc-300">
                                            <Phone size={14} className="text-zinc-500" />
                                            <span>{restaurant.contactNumber || '+91 98765 43210'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-zinc-300">
                                            <Mail size={14} className="text-zinc-500" />
                                            <span className="truncate">{restaurant.email || `concierge@${restaurant.name?.toLowerCase().replace(/\s/g, '')}.com`}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tabs content: Menu, Packages, Reviews */}
                        <div className="border-b border-white/10 mb-8 flex gap-8">
                            <button
                                onClick={() => setActiveTab('menu')}
                                className={`pb-4 px-2 text-lg font-medium transition-colors relative ${activeTab === 'menu' ? 'text-amber-500' : 'text-zinc-400 hover:text-white'}`}
                            >
                                Sample Menu
                                {activeTab === 'menu' && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500" />}
                            </button>
                            <button
                                onClick={() => setActiveTab('packages')}
                                className={`pb-4 px-2 text-lg font-medium transition-colors relative ${activeTab === 'packages' ? 'text-amber-500' : 'text-zinc-400 hover:text-white'}`}
                            >
                                Experiences & Packages
                                {activeTab === 'packages' && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500" />}
                            </button>
                            <button
                                onClick={() => setActiveTab('reviews')}
                                className={`pb-4 px-2 text-lg font-medium transition-colors relative ${activeTab === 'reviews' ? 'text-amber-500' : 'text-zinc-400 hover:text-white'}`}
                            >
                                Reviews
                                {activeTab === 'reviews' && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500" />}
                            </button>
                        </div>

                        {/* Menu Tab */}
                        {activeTab === 'menu' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                {menuLoading ? (
                                    <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 text-amber-500 animate-spin" /></div>
                                ) : Object.keys(liveMenu).length > 0 ? (
                                    Object.keys(liveMenu).map(category => (
                                        <div key={category}>
                                            <h4 className="text-sm font-bold text-amber-500 mb-4 uppercase tracking-[2px] border-l-2 border-amber-500 pl-3">{category}</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {liveMenu[category].slice(0, 6).map((item, idx) => (
                                                    <div key={idx}
                                                        className="bg-zinc-900/40 border border-white/5 p-3 rounded-lg flex items-center justify-between group hover:border-[#F5B942]/20 transition-all"
                                                    >
                                                        <div className="flex-1 pr-4">
                                                            <div className="flex justify-between items-baseline mb-0.5">
                                                                <span className="text-zinc-100 font-medium text-sm">{item.name}</span>
                                                                <span className="text-amber-500 text-xs font-bold">{item.price}</span>
                                                            </div>
                                                            <p className="text-[11px] text-zinc-500 font-light truncate max-w-[200px]">{item.desc || item.description}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                                        <ChefHat size={32} className="mb-3 opacity-20" />
                                        <p className="text-sm font-light italic">Refining offerings...</p>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'packages' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                                {packLoading ? (
                                    <p className="text-zinc-500 text-center py-10 text-xs">Loading experiences...</p>
                                ) : packages && packages.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {packages.map(pkg => (
                                            <div key={pkg._id} className="bg-zinc-900/40 border border-white/5 p-4 rounded-xl hover:border-amber-500/20 transition-all group">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="text-sm font-bold text-white group-hover:text-amber-500 transition-colors uppercase tracking-tight">{pkg.title}</h4>
                                                    <span className="text-[#F5B942] font-black text-xs">₹{pkg.basePrice}</span>
                                                </div>
                                                <p className="text-[11px] text-zinc-500 font-light line-clamp-2 mb-4 leading-relaxed">{pkg.description}</p>

                                                <button
                                                    onClick={() => { setSelectedPackage(pkg._id.toString()); window.scrollTo({ top: 400, behavior: 'smooth' }); }}
                                                    className="w-full py-2 bg-[#F5B942]/5 border border-[#F5B942]/20 text-[#F5B942] hover:bg-[#F5B942] hover:text-black transition-all rounded-lg font-bold text-[10px] uppercase tracking-widest"
                                                >
                                                    Book Experience
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-zinc-500 italic text-sm py-10 text-center">No curated packages available.</p>
                                )}
                            </motion.div>
                        )}

                        {/* Reviews Tab */}
                        {activeTab === 'reviews' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <div className="flex items-center justify-between mb-6 bg-white/[0.02] p-4 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-6">
                                        <div className="text-center">
                                            <div className="text-3xl font-serif text-white leading-none">{avgRating || restaurant.rating || 0}</div>
                                            <div className="text-[10px] text-amber-500 uppercase font-black tracking-widest mt-1">Rating</div>
                                        </div>
                                        <div className="h-8 w-px bg-white/10"></div>
                                        <div className="text-center">
                                            <div className="text-xl font-serif text-white leading-none">{liveReviews.length}</div>
                                            <div className="text-[10px] text-zinc-500 uppercase font-medium tracking-widest mt-1">Reviews</div>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsReviewModalOpen(true)} className="px-5 py-2 bg-amber-500 text-black text-xs font-black uppercase tracking-widest rounded-lg hover:shadow-[0_0_20px_rgba(245,185,66,0.2)] transition-all">Write Review</button>
                                </div>

                                {reviewsLoading ? (
                                    <div className="flex justify-center py-12">
                                        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {liveReviews.length > 0 ? (
                                            liveReviews.slice(0, 4).map(review => {
                                                const API_BASE = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
                                                return (
                                                    <div key={review._id} className="bg-zinc-900 border border-white/5 p-4 rounded-xl hover:border-amber-500/10 transition-colors">
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-white/5 overflow-hidden flex-shrink-0">
                                                                    <img
                                                                        src={review.profileImage || (review.userId?.profileImage ? `${API_BASE}${review.userId.profileImage}` : `https://api.dicebear.com/7.x/adventurer/svg?seed=${review.userName || 'Guest'}`)}
                                                                        alt={review.userName || 'Guest'}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <span className="text-white text-xs font-bold block leading-tight">{review.userName || review.userId?.name || 'Guest'}</span>
                                                                    <span className="text-[9px] text-zinc-500 font-mono">{new Date(review.createdAt).toLocaleDateString()}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1 bg-amber-500/10 px-1.5 py-0.5 rounded text-amber-500">
                                                                <Star className="w-2.5 h-2.5 fill-current" />
                                                                <span className="text-[10px] font-black">{review.rating}</span>
                                                            </div>
                                                        </div>
                                                        <p className="text-zinc-400 text-[11px] font-light leading-relaxed line-clamp-2 italic mb-3">"{review.comment}"</p>
                                                        {isAuthenticated && user?._id === (review.userId?._id || review.userId) && (
                                                            <button
                                                                onClick={() => handleEditClick(review)}
                                                                className="text-[9px] text-[#F5B942] uppercase font-bold tracking-widest hover:underline"
                                                            >
                                                                Edit
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="col-span-full text-center py-10">
                                                <p className="text-zinc-600 text-xs italic font-light italic">No stories shared yet.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </div>

                    {/* Right Column (Sticky Reservation Card) — order-1 on mobile so it appears first */}
                    <div className="w-full lg:w-1/3 relative order-1 lg:order-2" ref={reservationRef}>
                        {existingBooking ? (
                            <div className="sticky top-28 bg-zinc-900 border border-green-500/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(74,222,128,0.15)] flex flex-col justify-between min-h-[400px]">
                                <div>
                                    <div className="text-center mb-6 border-b border-white/10 pb-4">
                                        <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Info className="w-6 h-6 text-green-400" />
                                        </div>
                                        <h3 className="text-xl font-serif text-white">You Already Have a Booking</h3>
                                    </div>

                                    <div className="space-y-3 mb-6 bg-black/40 p-4 rounded-xl border border-white/5">
                                        <p className="text-sm flex justify-between"><span className="text-zinc-400">Restaurant</span><span className="text-white font-medium text-right max-w-[60%] truncate">{existingBooking.restaurantName}</span></p>
                                        <p className="text-sm flex justify-between"><span className="text-zinc-400">Date</span><span className="text-white font-medium">{new Date(existingBooking.date).toLocaleDateString()}</span></p>
                                        <p className="text-sm flex justify-between"><span className="text-zinc-400">Time</span><span className="text-white font-medium">{existingBooking.time}</span></p>
                                        <p className="text-sm flex justify-between"><span className="text-zinc-400">Guests</span><span className="text-white font-medium">{existingBooking.guests}</span></p>
                                        <p className="text-sm flex justify-between"><span className="text-amber-500 font-medium tracking-wide">₹{existingBooking.totalAmount}</span></p>
                                        <p className="text-sm flex justify-between mt-2 pt-2 border-t border-white/10"><span className="text-zinc-400">Booking ID</span><span className="text-zinc-300 font-mono text-[10px] break-all max-w-[60%] text-right">{existingBooking.bookingId}</span></p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 mt-auto">
                                    <button onClick={() => navigate('/dashboard')} className="w-full py-3 bg-amber-500 text-black font-semibold rounded-xl hover:bg-amber-400 transition-colors shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                                        View in Dashboard
                                    </button>
                                    <button
                                        onClick={handleCancelBooking}
                                        disabled={cancelLoading}
                                        className="w-full py-3 bg-transparent border border-white/10 text-zinc-400 font-medium rounded-xl hover:text-red-400 hover:border-red-500/30 transition-all disabled:opacity-50"
                                    >
                                        {cancelLoading ? 'Cancelling...' : 'Cancel Booking'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="sticky top-28 border rounded-[18px] shadow-2xl flex flex-col max-h-[calc(100vh-8rem)]" style={{ background: 'rgba(18,18,18,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <div className="p-6 pb-0 shrink-0">
                                    <h3 className="text-2xl font-serif text-white mb-4 text-center border-b pb-4" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>Make a Reservation</h3>
                                </div>

                                <div className="px-6 pb-2 overflow-y-auto custom-scrollbar flex-1 space-y-5">
                                    {/* Guests */}
                                    <div className="bg-black/40 border border-white/10 rounded-xl p-3 flex items-center cursor-pointer hover:border-amber-500/50 transition-colors">
                                        <Users className="text-amber-500 mr-4 ml-2" size={20} />
                                        <div className="flex-1">
                                            <span className="block text-xs text-zinc-400 uppercase tracking-wider mb-1">Party Size</span>
                                            <select
                                                value={guests}
                                                onChange={(e) => setGuests(e.target.value)}
                                                className="w-full bg-transparent text-white font-medium focus:outline-none cursor-pointer appearance-none"
                                            >
                                                {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n} className="bg-zinc-900">{n} {n === 1 ? 'Guest' : 'Guests'}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Date */}
                                    <div
                                        className="bg-black/40 border border-white/10 rounded-xl p-3 flex items-center cursor-pointer hover:border-amber-500/50 transition-colors"
                                        onClick={() => document.getElementById('reservation-date-input')?.showPicker()}
                                    >
                                        <Calendar className="text-amber-500 mr-4 ml-2" size={20} />
                                        <div className="flex-1">
                                            <span className="block text-xs text-zinc-400 uppercase tracking-wider mb-1">Date</span>
                                            <input
                                                id="reservation-date-input"
                                                type="date"
                                                value={date}
                                                min={new Date().toISOString().split('T')[0]}
                                                onChange={(e) => setDate(e.target.value)}
                                                className="w-full bg-transparent text-white focus:outline-none cursor-pointer"
                                                style={{ colorScheme: 'dark' }}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                    </div>

                                    {/* Time Slot Selection */}
                                    <div className="bg-black/40 border border-white/10 rounded-xl p-4">
                                        <div className="flex items-center mb-3">
                                            <Clock className="text-amber-500 mr-3" size={20} />
                                            <span className="text-xs text-zinc-400 uppercase tracking-wider font-medium">Select Time Slot</span>
                                        </div>

                                        {!date ? (
                                            <p className="text-sm text-zinc-500 text-center py-2">Please select a date first</p>
                                        ) : slotLoading ? (
                                            <div className="flex justify-center py-2">
                                                <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                                            </div>
                                        ) : publicSlots?.length > 0 ? (
                                            <div className="grid grid-cols-2 gap-2 mt-2">
                                                {publicSlots.map((slot, index) => {
                                                    const isFull = !slot.isAvailable || slot.remaining <= 0;
                                                    const isSelected = selectedSlotId === slot._id;
                                                    return (
                                                        <button
                                                            key={slot._id || index}
                                                            onClick={() => {
                                                                if (!isFull || (isFull && isAuthenticated)) {
                                                                    setSelectedSlotId(slot._id);
                                                                    setTime(slot.time);
                                                                    setIsSelectedFull(isFull);
                                                                } else {
                                                                    navigate('/login', { state: { returnTo: `/restaurants/${id}` } });
                                                                }
                                                            }}
                                                            className={`py-3 px-2 rounded-lg text-sm font-medium transition-all flex flex-col items-center gap-0.5 ${isSelected
                                                                ? 'bg-amber-500 text-black shadow-[0_0_12px_rgba(212,175,55,0.5)]'
                                                                : isFull
                                                                    ? 'bg-zinc-900 text-zinc-400 border border-white/10 hover:border-amber-500/30 cursor-pointer'
                                                                    : 'bg-zinc-800 text-white hover:bg-zinc-700 border border-white/10 hover:border-amber-500/40'
                                                                }`}
                                                        >
                                                            <span className="font-semibold">{slot.time}</span>
                                                            <span className={`text-xs ${isSelected ? 'text-black/70' : isFull ? 'text-amber-500/70' : 'text-zinc-400'}`}>
                                                                {isFull ? 'Waitlist' : `${slot.remaining} left`}
                                                            </span>
                                                            {slot.tableTypeLabel && (
                                                                <span className={`text-[10px] font-normal ${isSelected ? 'text-black/60' : 'text-zinc-500'}`}>
                                                                    {slot.tableTypeLabel}
                                                                </span>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-zinc-500 text-center py-2">No slots available for this date.</p>
                                        )}
                                    </div>

                                    {/* Step 4: Optional Add-ons */}
                                    {packages && packages.length > 0 && (
                                        <div className="mt-6 pt-6 border-t border-white/10">
                                            <div className="flex items-center mb-4">
                                                <Star className="text-amber-500 mr-3" size={20} />
                                                <span className="text-xs text-zinc-400 uppercase tracking-wider font-medium">Enhance Your Reservation (Optional)</span>
                                            </div>
                                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                                {packages.map(pkg => {
                                                    const totalPkgCost = (pkg.basePrice || pkg.price || 0) + (pkg.decorationCost || 0);
                                                    const maxCap = pkg.maxCapacity || pkg.maxPeople || 99;
                                                    const isDisabled = guests > maxCap;
                                                    const isSelected = selectedPackage === pkg._id.toString();

                                                    return (
                                                        <div
                                                            key={pkg._id}
                                                            onClick={() => { if (!isDisabled) setSelectedPackage(isSelected ? "" : pkg._id.toString()) }}
                                                            className={`p-4 rounded-xl border transition-all ${isDisabled ? 'bg-zinc-900/50 border-white/5 opacity-50 cursor-not-allowed' : isSelected ? 'bg-amber-500/10 border-amber-500 cursor-pointer shadow-[0_0_15px_rgba(212,175,55,0.1)]' : 'bg-black/40 border-white/10 hover:border-white/30 cursor-pointer'}`}
                                                        >
                                                            <div className="flex justify-between items-start mb-2">
                                                                <h5 className="text-white font-medium text-sm flex items-center">
                                                                    {pkg.title}
                                                                    {pkg.type && <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 text-[10px] uppercase font-bold tracking-wider">{pkg.type}</span>}
                                                                </h5>
                                                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-amber-500 bg-amber-500' : 'border-zinc-500'}`}>
                                                                    {isSelected && <div className="w-2 h-2 rounded-full bg-black"></div>}
                                                                </div>
                                                            </div>
                                                            <p className="text-zinc-400 font-light text-xs mb-3">{pkg.description || pkg.desc}</p>
                                                            <div className="flex justify-between items-center text-xs">
                                                                <span className="text-zinc-500 flex items-center">
                                                                    <Users size={12} className="mr-1" /> Max {maxCap} guests
                                                                </span>
                                                                <span className="text-amber-500 font-semibold px-2 py-1 bg-amber-500/10 rounded-md">
                                                                    ₹{totalPkgCost}
                                                                </span>
                                                            </div>
                                                            {isSelected && (
                                                                <div className="mt-3 pt-3 border-t border-white/5 flex items-start gap-2 text-[10px] text-amber-500/80 leading-tight">
                                                                    <ShieldAlert size={12} className="shrink-0" />
                                                                    <p><b>Refund Policy:</b> Cancel before 12 hours for a full refund. No refund thereafter.</p>
                                                                </div>
                                                            )}
                                                            {isDisabled && <p className="text-red-400 text-[10px] mt-2">Party size exceeds maximum capacity.</p>}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 pt-4 shrink-0 rounded-b-[18px] z-10" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(12,12,12,0.9)' }}>
                                    <button
                                        onClick={async () => {
                                            if (!isAuthenticated) {
                                                navigate('/login', { state: { returnTo: `/restaurants/${id}`, message: 'Please sign in to reserve a table.' } });
                                                return;
                                            }
                                            if (!date) {
                                                showAlert({ type: 'warning', title: 'Date Required', message: 'Please select a reservation date before continuing.' });
                                                return;
                                            }
                                            if (!selectedSlotId || !time) {
                                                showAlert({ type: 'warning', title: 'Time Slot Required', message: 'Please select an available time slot.' });
                                                return;
                                            }

                                            // If joining waitlist
                                            if (isSelectedFull) {
                                                try {
                                                    setBookingLoading(true);
                                                    const waitRes = await api.post('reservations/waitlist', {
                                                        restaurantId: restaurant._id,
                                                        date,
                                                        time,
                                                        guests
                                                    });
                                                    showAlert({
                                                        type: 'success',
                                                        title: 'Joined Waitlist',
                                                        message: waitRes.data.message || 'We will notify you if a table becomes available!'
                                                    });
                                                } catch (err) {
                                                    showAlert({
                                                        type: 'error',
                                                        title: 'Waitlist Failed',
                                                        message: err.response?.data?.message || 'Failed to join waitlist.'
                                                    });
                                                } finally {
                                                    setBookingLoading(false);
                                                }
                                                return;
                                            }

                                            const pkgObj = packages?.find(p => p._id.toString() === selectedPackage);
                                            let finalPackagePrice = 0;
                                            if (pkgObj) {
                                                const guestTier = pkgObj.guestOptions?.find(opt => opt.guests === parseInt(guests));
                                                finalPackagePrice = guestTier ? guestTier.price : (pkgObj.basePrice || pkgObj.price || 0);
                                                finalPackagePrice += (pkgObj.decorationCost || 0);
                                            }

                                            navigate('/checkout', {
                                                state: {
                                                    restaurantId: restaurant._id,
                                                    restaurantName: restaurant.name,
                                                    date,
                                                    time,
                                                    guests,
                                                    slotId: selectedSlotId,
                                                    packageId: selectedPackage || null,
                                                    packageTitle: pkgObj?.title,
                                                    packagePrice: finalPackagePrice,
                                                    advanceAmount: pkgObj?.advanceAmount || 0
                                                }
                                            });
                                        }}
                                        disabled={bookingLoading}
                                        className="w-full font-semibold py-[14px] rounded-[10px] transition-all mt-4 disabled:opacity-50 flex items-center justify-center gap-2"
                                        style={{ height: 52, background: 'linear-gradient(135deg, #F5B942, #D69E2E)', color: '#050505', boxShadow: '0 4px 16px rgba(245,185,66,0.25)' }}
                                        onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.1)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(245,185,66,0.4)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(245,185,66,0.25)'; }}
                                    >
                                        {bookingLoading ? (
                                            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            isSelectedFull ? 'Join Waitlist' : (selectedPackage ? 'Book Package' : 'Find Table')
                                        )}
                                    </button>

                                    <p className="text-center text-xs text-zinc-400 mt-4">
                                        You will not be charged yet.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Review Modal */}
            {isReviewModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar relative"
                    >
                        <button onClick={() => { setIsReviewModalOpen(false); setEditingReviewId(null); }} className="absolute top-6 right-6 text-zinc-400 hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                        <h3 className="text-2xl font-serif text-white mb-4 pr-10">{editingReviewId ? 'Edit Your Experience' : 'Rate & Review'}</h3>
                        <form onSubmit={handleAddReview} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">Overall Rating</label>
                                <div className="flex gap-2 mb-4">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setReviewRating(star)}
                                            className={`p-1 transition-colors ${reviewRating >= star ? 'text-amber-500' : 'text-zinc-600'}`}
                                        >
                                            <Star className="w-8 h-8 fill-current" />
                                        </button>
                                    ))}
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    {['food', 'ambience', 'staff'].map(cat => (
                                        <div key={cat}>
                                            <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">{cat}</label>
                                            <input
                                                type="number"
                                                min="0" max="10"
                                                placeholder="0-10"
                                                className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-white text-xs"
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value);
                                                    if (cat === 'food') setFoodRating(val);
                                                    if (cat === 'ambience') setAmbienceRating(val);
                                                    if (cat === 'staff') setStaffRating(val);
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">Share your experience</label>
                                <textarea
                                    required
                                    rows="4"
                                    value={reviewComment}
                                    onChange={(e) => setReviewComment(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 resize-none"
                                    placeholder="What did you love? What could be better?"
                                ></textarea>
                            </div>
                            <div className="flex gap-4 pt-4 border-t border-white/10 mt-6">
                                <button type="button" onClick={() => { setIsReviewModalOpen(false); setEditingReviewId(null); }} className="flex-1 py-3 rounded-xl border border-white/10 text-zinc-400 hover:text-white transition-colors font-medium">Cancel</button>
                                <button type="submit" disabled={reviewLoading} className="flex-1 py-3 rounded-xl bg-amber-500 text-black font-semibold hover:bg-amber-400 transition-colors shadow-[0_0_15px_rgba(212,175,55,0.2)] disabled:opacity-50">
                                    {reviewLoading ? 'Submitting...' : (editingReviewId ? 'Update Review' : 'Post Review')}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Recommendations Section */}
            {!recLoading && recommendations.length > 0 && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-24 mb-10">
                    <div className="flex items-center gap-3 mb-8">
                        <Star className="text-amber-500 w-6 h-6" />
                        <h2 className="text-3xl font-serif text-white">Similar Restaurants You Might Like</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {recommendations.map(restaurant => (
                            <RestaurantCard key={restaurant._id} restaurant={restaurant} />
                        ))}
                    </div>
                </div>
            )}

            <ReservationCancelModal
                isOpen={isCancelModalOpen}
                onClose={() => setIsCancelModalOpen(false)}
                onConfirm={handleConfirmCancel}
                reservation={existingBooking ? { ...existingBooking, _id: existingBooking.bookingId } : null}
            />

            {/* Floating Reserve Button — Mobile Only */}
            <AnimatePresence>
                {showFloatingBtn && !existingBooking && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="lg:hidden fixed bottom-6 left-4 right-4 z-50"
                    >
                        <button
                            onClick={() => reservationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                            className="w-full flex items-center justify-center gap-3 py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-2xl shadow-[0_8px_30px_rgba(212,175,55,0.4)] active:scale-95 transition-all text-base"
                        >
                            <Utensils size={20} />
                            Reserve a Table
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DetailsPage;
