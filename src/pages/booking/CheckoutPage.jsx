import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Calendar, Clock, Users, ArrowLeft, CreditCard, ChefHat, CheckCircle, Star, AlertCircle } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { createReservation, clearReservationMessages } from '../../app/features/reservationSlice';
import api from '../../services/api';
import { useAlert } from '@/context/AlertContext';

const CheckoutPage = () => {
    const { showAlert } = useAlert();
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [step, setStep] = useState(1); // 1: Pre-order, 2: Payment
    const [selectedMeals, setSelectedMeals] = useState([]);
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    const [paymentError, setPaymentError] = useState(null);
    const [confirmedDetails, setConfirmedDetails] = useState(null);
    const [waitlistStatus, setWaitlistStatus] = useState('idle'); // idle | loading | success | error
    const [waitlistMessage, setWaitlistMessage] = useState('');

    const { loading: isProcessing, error, successMessage, currentReservation } = useSelector((state) => state.reservations);
    const { user, isAuthenticated } = useSelector((state) => state.auth);

    const reservationData = location.state;

    // Redirect if direct access without reservation data or not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/login" replace state={{ returnTo: '/checkout', reservationData }} />;
    }
    if (!reservationData) {
        return <Navigate to="/" replace />;
    }

    // Live Menu for Pre-booking
    const [liveMenu, setLiveMenu] = useState([]);
    const [menuLoading, setMenuLoading] = useState(true);

    useEffect(() => {
        const fetchMenu = async () => {
            if (!reservationData?.restaurantId) return;
            try {
                const res = await api.get(`menu/${reservationData.restaurantId}`);
                if (Array.isArray(res.data)) {
                    const availableItems = res.data.filter(item => item.isAvailable !== false && item.status !== 'Inactive');
                    setLiveMenu(availableItems);
                } else {
                    setLiveMenu([]);
                }
            } catch (e) {
                console.error("Failed to load menu", e);
            } finally {
                setMenuLoading(false);
            }
        };
        fetchMenu();
    }, [reservationData?.restaurantId]);

    // Check if confirming existing reservation (Skip Step 1 pre-order)
    useEffect(() => {
        if (reservationData?.reservationId && step === 1) {
            setStep(2);
        }
    }, [reservationData, step]);

    // Load Razorpay Script
    useEffect(() => {
        const loadRazorpayScript = () => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            document.body.appendChild(script);
        };
        loadRazorpayScript();
    }, []);

    const adjustQuantity = (meal, delta) => {
        const exists = selectedMeals.find(m => (m.id || m._id) === (meal.id || meal._id));
        if (exists) {
            const newQ = (exists.quantity || 1) + delta;
            if (newQ <= 0) {
                setSelectedMeals(selectedMeals.filter(m => (m.id || m._id) !== (meal.id || meal._id)));
            } else {
                setSelectedMeals(selectedMeals.map(m => (m.id || m._id) === (meal.id || meal._id) ? { ...m, quantity: newQ } : m));
            }
        } else if (delta > 0) {
            setSelectedMeals([...selectedMeals, { ...meal, quantity: 1 }]);
        }
    };

    // Billing logic
    const tableCount = Math.ceil((Number(reservationData.guests) || 1) / 4);
    const advancePaid = (reservationData.advanceAmount > 0) ? Number(reservationData.advanceAmount) : (tableCount * 200);
    const platformFee = 100; // Fixed ₹100 platform fee as per requirement
    const packageCost = Number(reservationData.packagePrice) || 0;
    const pendingPenalty = Number(user?.penaltyBalance) || 0; // Prior-cancellation penalty

    const preorderTotal = selectedMeals.reduce((sum, meal) => {
        const priceNum = typeof meal.price === 'string' ? Number(meal.price.replace(/[^0-9.]/g, '')) : (meal.price || 0);
        return sum + (priceNum * (meal.quantity || 1));
    }, 0);

    const totalOrderAmount = advancePaid + packageCost + preorderTotal + platformFee + pendingPenalty;

    const handleRequestReservation = async () => {
        setPaymentError(null);

        const payload = {
            restaurantId: reservationData.restaurantId,
            date: reservationData.date,
            time: reservationData.time,
            guests: reservationData.guests,
            slotId: reservationData.slotId,
            advancePaid,
            platformFee,
            preorderTotal,
            totalPaidNow: totalOrderAmount,
            preorderItems: selectedMeals.map(m => ({
                name: m.name,
                price: typeof m.price === 'string' ? Number(m.price.replace(/[^0-9.]/g, '')) : (m.price || 0),
                quantity: m.quantity || 1
            }))
        };

        if (reservationData.packageId) {
            payload.selectedPackage = {
                packageId: reservationData.packageId,
                title: reservationData.packageTitle,
                totalCost: packageCost
            };
        }

        try {
            setPaymentProcessing(true);
            const resAction = await dispatch(createReservation(payload)).unwrap();
            setConfirmedDetails({ orderId: `REQ-${resAction._id.substring(0, 8).toUpperCase()}` });
            setPaymentProcessing(false);
            setStep(3);
            dispatch(clearReservationMessages());

        } catch (err) {
            setPaymentProcessing(false);
            setPaymentError(err.message || 'Error initializing request.');
        }
    };

    const handlePayment = async () => {
        setPaymentError(null);
        setPaymentProcessing(true);

        try {
            const orderRes = await api.post('payment/create-order', {
                reservationId: reservationData.reservationId,
                amount: totalOrderAmount
            });

            const { id: rzpOrderId, amount, currency } = orderRes.data;

            if (!rzpOrderId) throw new Error("Could not initialize payment order.");

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_zHnC7K1561t7qK',
                amount: amount,
                currency: currency || 'INR',
                name: 'Tableo',
                description: `Confirm table at ${reservationData.restaurantName}`,
                order_id: rzpOrderId,
                handler: async function (response) {
                    try {
                        const verified = await api.post('payment/verify', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            reservationId: reservationData.reservationId
                        });

                        setConfirmedDetails({ orderId: verified.data?.orderId || reservationData.reservationId });
                        setPaymentProcessing(false);
                        setStep(3);
                    } catch (err) {
                        setPaymentProcessing(false);
                        setPaymentError('Payment verification failed.');
                    }
                },
                prefill: {
                    name: user?.name,
                    email: user?.email,
                    contact: user?.mobileNumber || ''
                },
                theme: { color: '#f59e0b' },
                modal: {
                    ondismiss: function () {
                        setPaymentProcessing(false);
                        api.put(`reservations/${reservationData.reservationId}/status`, { status: 'payment_failed' }).catch(console.error);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                setPaymentProcessing(false);
                setPaymentError(response.error.description);
                api.put(`reservations/${reservationData.reservationId}/status`, { status: 'payment_failed' }).catch(console.error);
            });
            rzp.open();

        } catch (error) {
            setPaymentProcessing(false);
            setPaymentError(error.response?.data?.message || 'Failed to initialize payment.');
        }
    };

    const handleJoinWaitlist = async () => {
        setWaitlistStatus('loading');
        setWaitlistMessage('');
        try {
            const payload = {
                restaurantId: reservationData.restaurantId,
                date: reservationData.date,
                time: reservationData.time,
                guests: reservationData.guests
            };
            const response = await api.post('reservations/waitlist', payload);
            setWaitlistStatus('success');
            setWaitlistMessage(response.data.message || 'Successfully joined the waitlist!');
        } catch (err) {
            setWaitlistStatus('error');
            setWaitlistMessage(err.response?.data?.message || 'Failed to join waitlist. Please try again.');
        }
    };

    if (step === 3) {
        return (
            <div className="min-h-screen bg-zinc-950 pt-32 pb-16 flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-zinc-900 border border-amber-500/30 rounded-2xl p-10 max-w-md w-full text-center shadow-[0_0_50px_rgba(212,175,55,0.15)]"
                >
                    <CheckCircle className="w-20 h-20 text-amber-500 mx-auto mb-6" />
                    <h2 className="text-3xl font-serif text-white mb-2">
                        {reservationData?.reservationId ? 'Payment Successful' : 'Reservation Requested'}
                    </h2>
                    <p className="text-zinc-400 font-light mb-6">
                        {reservationData?.reservationId 
                            ? 'Your reservation is now fully confirmed.' 
                            : 'Your request has been sent to the restaurant owner for approval.'}
                    </p>
                    {confirmedDetails && (
                        <p className="text-amber-500/80 font-mono text-sm mb-6">Request ID: {confirmedDetails.orderId}</p>
                    )}
                    <div className="bg-black/30 p-6 rounded-xl text-left border border-white/5 mb-8 space-y-3">
                        <p className="text-zinc-400 font-light flex justify-between">
                            <span>Restaurant:</span>
                            <span className="text-white font-medium">{reservationData.restaurantName}</span>
                        </p>
                        <p className="text-zinc-400 font-light flex justify-between">
                            <span>Date & Time:</span>
                            <span className="text-white font-medium">{reservationData.date} at {reservationData.time}</span>
                        </p>
                        <p className="text-zinc-400 font-light flex justify-between">
                            <span>Guests:</span>
                            <span className="text-white font-medium">{reservationData.guests} Persons</span>
                        </p>
                        {confirmedDetails?.tableSize && (
                            <p className="text-zinc-400 font-light flex justify-between">
                                <span>Table Size:</span>
                                <span className="text-white font-medium capitalize">{confirmedDetails.tableSize.replace(/([A-Z])/g, ' $1').trim()}</span>
                            </p>
                        )}
                    </div>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full bg-amber-500 hover:bg-amber-500-hover text-black font-semibold py-4 rounded-xl transition-all"
                    >
                        Return Home
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col min-h-screen bg-zinc-950 pt-28 pb-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">

                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-zinc-400 hover:text-white transition-colors mb-8 group w-fit"
                >
                    <ArrowLeft size={18} className="mr-2 transform group-hover:-translate-x-1 transition-transform" />
                    Back to Restaurant
                </button>

                <h1 className="text-4xl font-serif text-white mb-10">Complete Your Reservation</h1>

                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Left Column: Form Steps */}
                    <div className="w-full lg:w-2/3 space-y-8">

                        {/* Step 1: Pre-book Meals */}
                        <div className={`bg-zinc-900 border ${step === 1 ? 'border-amber-500/50 shadow-[0_0_20px_rgba(212,175,55,0.1)]' : 'border-white/10 opacity-60'} rounded-2xl p-8 transition-all`}>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-serif text-white flex items-center">
                                    <span className="w-8 h-8 rounded-full bg-amber-500 text-black flex items-center justify-center text-sm mr-3 font-sans font-bold">1</span>
                                    Pre-order Meals (Optional)
                                </h2>
                                {step > 1 && (
                                    <button onClick={() => setStep(1)} className="text-sm text-amber-500 hover:text-white underline">Edit</button>
                                )}
                            </div>

                            {step === 1 && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                    <p className="text-zinc-400 text-sm mb-6">Enhance your experience and reduce wait times by pre-ordering from the chef's selection.</p>

                                    <div className="space-y-4 mb-8">
                                        {menuLoading ? (
                                            <p className="text-zinc-500 text-sm">Loading today's menu offerings...</p>
                                        ) : liveMenu.length > 0 ? (
                                            liveMenu.map(meal => {
                                                const selectedMeal = selectedMeals.find(m => (m.id || m._id) === (meal.id || meal._id));
                                                const qty = selectedMeal ? selectedMeal.quantity : 0;
                                                return (
                                                    <div
                                                        key={meal.id || meal._id}
                                                        className={`p-4 border rounded-xl transition-colors flex justify-between items-center ${qty > 0 ? 'border-amber-500 bg-amber-500/5' : 'border-white/10 hover:border-white/30'}`}
                                                    >
                                                        <div>
                                                            <h4 className="text-white font-medium">{meal.name}</h4>
                                                            <p className="text-zinc-400 text-sm mt-1">{meal.desc || meal.description}</p>
                                                        </div>
                                                        <div className="flex items-center ml-4 gap-4">
                                                            <span className="text-amber-500 whitespace-nowrap">{typeof meal.price === 'string' && meal.price.includes('₹') ? meal.price : `₹${meal.price}`}</span>
                                                            <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg p-1">
                                                                <button onClick={() => adjustQuantity(meal, -1)} className="w-8 h-8 rounded-md flex items-center justify-center text-white hover:bg-white/10 transition-colors cursor-pointer" disabled={qty === 0}>
                                                                    -
                                                                </button>
                                                                <span className="text-white font-medium w-4 text-center">{qty}</span>
                                                                <button onClick={() => adjustQuantity(meal, 1)} className="w-8 h-8 rounded-md flex items-center justify-center text-white hover:bg-amber-500/20 text-amber-500 transition-colors cursor-pointer">
                                                                    +
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })
                                        ) : (
                                            <p className="text-zinc-500 text-sm italic">No pre-order menu items available at this time.</p>
                                        )}
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            onClick={() => setStep(2)}
                                            className="bg-white hover:bg-gray-200 text-black px-8 py-3 rounded-xl font-medium transition-colors"
                                        >
                                        Continue to Review Request
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Step 2: Confirmation Step */}
                    <div className={`bg-zinc-900 border ${step === 2 ? 'border-amber-500/50 shadow-[0_0_20px_rgba(212,175,55,0.1)]' : 'border-white/10 opacity-60'} rounded-2xl p-8 transition-all`}>
                        <div className="flex items-center mb-6">
                            <h2 className="text-2xl font-serif text-white flex items-center">
                                <span className="w-8 h-8 rounded-full bg-amber-500 text-black flex items-center justify-center text-sm mr-3 font-sans font-bold">2</span>
                                Review & Submit
                            </h2>
                        </div>

                        {step === 2 && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                <p className="text-zinc-400 text-sm mb-6">
                                    {reservationData?.reservationId 
                                        ? 'Review your details and complete the payment to finalize your booking.' 
                                        : 'Your request will be sent to the restaurant owner for approval. You will not be asked to pay until the reservation is approved.'}
                                </p>

                                {!reservationData?.reservationId && (
                                    <div className="p-6 bg-black/40 border border-white/10 rounded-xl flex items-center justify-between mb-8">
                                        <div className="flex items-center text-white">
                                            <AlertCircle className="mr-3 text-amber-500" />
                                            <span>Payment Required Later</span>
                                        </div>
                                    </div>
                                )}

                                    {error && (
                                        <div className="mb-4">
                                            <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl flex items-center mb-3">
                                                <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                                                <p className="text-sm">{error}</p>
                                            </div>
                                            {(error.toLowerCase().includes('fully booked') || error.toLowerCase().includes('capacity') || error.toLowerCase().includes('configured')) && (
                                                <div className="bg-zinc-800/50 p-4 rounded-xl border border-white/5">
                                                    <p className="text-zinc-300 text-sm mb-3">Would you like to be notified if a table becomes available?</p>
                                                    {waitlistStatus === 'success' ? (
                                                        <div className="text-green-400 text-sm flex items-center bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                                                            <CheckCircle className="w-4 h-4 mr-2" />
                                                            {waitlistMessage}
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {waitlistStatus === 'error' && (
                                                                <p className="text-red-400 text-xs mb-2">{waitlistMessage}</p>
                                                            )}
                                                            <button
                                                                onClick={handleJoinWaitlist}
                                                                disabled={waitlistStatus === 'loading'}
                                                                className="bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-lg text-sm transition-colors border border-white/10"
                                                            >
                                                                {waitlistStatus === 'loading' ? 'Joining...' : 'Join Waitlist for this Slot'}
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {paymentError && (
                                        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl flex items-center">
                                            <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                                            <p className="text-sm">{paymentError}</p>
                                        </div>
                                    )}

                                    {reservationData?.reservationId ? (
                                        <button
                                            onClick={handlePayment}
                                            disabled={paymentProcessing}
                                            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold py-4 rounded-xl transition-all shadow-lg flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed"
                                        >
                                            {paymentProcessing ? (
                                                <span className="flex items-center">
                                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Processing...
                                                </span>
                                            ) : `Pay ₹${totalOrderAmount} to Confirm`}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleRequestReservation}
                                            disabled={isProcessing || paymentProcessing}
                                            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold py-4 rounded-xl transition-all shadow-lg flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed"
                                        >
                                            {(isProcessing || paymentProcessing) ? (
                                                <span className="flex items-center">
                                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Sending Request...
                                                </span>
                                            ) : "Request Reservation"}
                                        </button>
                                    )}
                                </motion.div>
                            )}
                        </div>

                    </div>

                    {/* Right Column: Reservation Summary Widget */}
                    <div className="w-full lg:w-1/3">
                        <div className="sticky top-28 bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-2xl">
                            <h3 className="text-xl font-serif text-white mb-6 border-b border-white/10 pb-4">Reservation Summary</h3>

                            <div className="mb-6">
                                <h4 className="text-lg text-white font-medium mb-1">{reservationData.restaurantName}</h4>
                                <p className="text-zinc-400 text-sm">Main Dining Room</p>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div className="flex items-center text-white">
                                    <Calendar className="w-5 h-5 mr-3 text-amber-500" />
                                    <span>{reservationData.date}</span>
                                </div>
                                <div className="flex items-center text-white">
                                    <Clock className="w-5 h-5 mr-3 text-amber-500" />
                                    <span>{reservationData.time}</span>
                                </div>
                                <div className="flex items-center text-white">
                                    <Users className="w-5 h-5 mr-3 text-amber-500" />
                                    <span>{reservationData.guests} Guests</span>
                                </div>
                                {reservationData.packageTitle && (
                                    <div className="flex items-center text-white">
                                        <Star className="w-5 h-5 mr-3 text-amber-500" />
                                        <span>{reservationData.packageTitle}</span>
                                    </div>
                                )}
                            </div>

                            {selectedMeals.length > 0 && (
                                <div className="border-t border-white/10 pt-4 mb-6">
                                    <h4 className="text-sm text-zinc-400 uppercase tracking-wider mb-3 flex items-center">
                                        <ChefHat className="w-4 h-4 mr-2" /> Pre-ordered Items
                                    </h4>
                                    <div className="space-y-2">
                                        {selectedMeals.map(meal => {
                                            const qty = meal.quantity || 1;
                                            const prc = typeof meal.price === 'string' ? Number(meal.price.replace(/[^0-9.]/g, '')) : (meal.price || 0);
                                            return (
                                                <div key={meal.id || meal._id} className="flex justify-between text-sm">
                                                    <span className="text-white">{qty}x {meal.name}</span>
                                                    <span className="text-amber-500">₹{prc * qty}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="border-t border-white/10 pt-4 flex flex-col gap-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-zinc-400 font-medium">Table Advance</span>
                                    <span className="text-white">₹{advancePaid}</span>
                                </div>
                                {packageCost > 0 && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-zinc-400 font-medium">Package Cost</span>
                                        <span className="text-white">₹{packageCost}</span>
                                    </div>
                                )}
                                {preorderTotal > 0 && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-zinc-400 font-medium">Food Preorder</span>
                                        <span className="text-white">₹{preorderTotal}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center text-sm text-zinc-500">
                                    <span>Platform Fee (10% of Advance)</span>
                                    <span>₹{platformFee}</span>
                                </div>
                                {pendingPenalty > 0 && (
                                    <div className="flex justify-between items-center text-sm px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl">
                                        <span className="text-red-400 flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                                            Late Cancellation Penalty
                                        </span>
                                        <span className="text-red-400 font-semibold">+₹{pendingPenalty}</span>
                                    </div>
                                )}

                                <div className="border-t border-white/10 mt-2 pt-4 flex justify-between items-center text-lg">
                                    <span className="text-white font-medium">Due Now</span>
                                    <span className="text-2xl text-amber-500 font-serif">₹{totalOrderAmount}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
