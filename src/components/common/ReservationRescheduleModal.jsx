import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, Users, ArrowRight } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPublicSlots, clearPublicSlots } from '@/app/features/timeSlotSlice';
import { reservationService } from '@/services/reservation.service';
import { useAlert } from '@/context/AlertContext';

const ReservationRescheduleModal = ({ isOpen, onClose, reservation, onRescheduleSuccess }) => {
    const dispatch = useDispatch();
    const { showAlert } = useAlert();
    const { publicSlots, loading: slotsLoading } = useSelector((state) => state.timeSlots);
    
    const [date, setDate] = useState('');
    const [guests, setGuests] = useState(2);
    const [selectedSlotId, setSelectedSlotId] = useState('');
    const [time, setTime] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && reservation) {
            setDate(reservation.date || '');
            setGuests(reservation.guests || 2);
            setSelectedSlotId(reservation.slotId || '');
            setTime(reservation.time || '');
        }
    }, [isOpen, reservation]);

    useEffect(() => {
        if (isOpen && reservation?.restaurantId?._id && date && guests) {
            dispatch(fetchPublicSlots({ restaurantId: reservation.restaurantId._id, date, partySize: guests }));
        } else {
            dispatch(clearPublicSlots());
        }
    }, [date, guests, isOpen, reservation?.restaurantId?._id, dispatch]);

    if (!isOpen || !reservation) return null;

    const availableSlots = publicSlots?.filter(slot => {
        const tableType = guests <= 2 ? 'twoSeaterTables' :
            guests <= 4 ? 'fourSeaterTables' :
            guests <= 6 ? 'sixSeaterTables' : 'groupTables';
        const capacity = slot.capacity?.[tableType] || 0;
        const booked = slot.booked?.[tableType] || 0;
        return capacity > booked;
    }) || [];

    const handleReschedule = async () => {
        if (!date || !time || !selectedSlotId) {
            return showAlert({ type: 'error', title: 'Incomplete', message: 'Please select a date and an available time slot.' });
        }

        try {
            setIsSubmitting(true);
            await reservationService.reschedule(reservation._id, {
                date,
                time,
                guests,
                slotId: selectedSlotId
            });
            showAlert({ type: 'success', title: 'Success', message: 'Your reservation has been rescheduled!' });
            onRescheduleSuccess();
            onClose();
        } catch (error) {
            showAlert({ type: 'error', title: 'Reschedule Failed', message: error.response?.data?.message || error.message || 'Could not reschedule reservation.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />
                
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="relative bg-zinc-900 border border-white/10 p-6 md:p-8 rounded-3xl w-full max-w-md shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"
                >
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 text-zinc-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>

                    <h2 className="text-2xl font-serif text-white mb-2">Reschedule Booking</h2>
                    <p className="text-zinc-400 text-sm mb-6">Select a new date and time for your reservation at <span className="text-white font-medium">{reservation.restaurantId?.name}</span>.</p>

                    <div className="space-y-5">
                        <div className="bg-black/40 border border-white/10 rounded-xl p-3 flex items-center">
                            <Users className="text-amber-500 mr-4 ml-2" size={20} />
                            <div className="flex-1">
                                <label className="text-xs text-zinc-500 font-medium uppercase tracking-wider block mb-1">Guests</label>
                                <select 
                                    className="w-full bg-transparent text-white font-medium focus:outline-none appearance-none cursor-pointer"
                                    value={guests}
                                    onChange={(e) => {
                                        setGuests(Number(e.target.value));
                                        setSelectedSlotId("");
                                        setTime("");
                                    }}
                                >
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(n => (
                                        <option key={n} value={n} className="bg-zinc-900">{n} {n === 1 ? 'Guest' : 'Guests'}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="bg-black/40 border border-white/10 rounded-xl p-3 flex items-center">
                            <Calendar className="text-amber-500 mr-4 ml-2" size={20} />
                            <div className="flex-1">
                                <label className="text-xs text-zinc-500 font-medium uppercase tracking-wider block mb-1">Date</label>
                                <input 
                                    type="date" 
                                    className="w-full bg-transparent text-white font-medium focus:outline-none cursor-pointer"
                                    value={date}
                                    onChange={(e) => {
                                        setDate(e.target.value);
                                        setSelectedSlotId("");
                                        setTime("");
                                    }}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                        </div>

                        <div className="bg-black/40 border border-white/10 rounded-xl px-4 py-4 mb-4">
                            <div className="flex items-center mb-4">
                                <Clock className="text-amber-500 mr-3" size={18} />
                                <span className="text-sm text-zinc-300 font-medium">Available Times</span>
                            </div>

                            {slotsLoading && <p className="text-xs text-zinc-500 animate-pulse">Loading slots...</p>}
                            
                            {!slotsLoading && availableSlots.length > 0 && (
                                <div className="grid grid-cols-3 gap-2">
                                    {availableSlots.map((slot) => (
                                        <button
                                            key={slot._id}
                                            onClick={() => {
                                                setSelectedSlotId(slot._id);
                                                setTime(slot.time);
                                            }}
                                            className={`py-2 rounded-lg text-sm transition-all font-medium border
                                                ${selectedSlotId === slot._id
                                                    ? 'bg-amber-500 text-black border-amber-500 shadow-[0_0_10px_rgba(212,175,55,0.3)]'
                                                    : 'bg-zinc-900/50 text-white/80 border-white/10 hover:border-amber-500/50'
                                                }`}
                                        >
                                            {slot.time}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {!slotsLoading && availableSlots.length === 0 && date && (
                                <p className="text-xs text-red-400">No tables available for {guests} guests on this date.</p>
                            )}
                            
                            {!date && (
                                <p className="text-xs text-zinc-500">Select a date to view available times.</p>
                            )}
                        </div>

                        <button
                            onClick={handleReschedule}
                            disabled={isSubmitting || !selectedSlotId || !date}
                            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold py-4 rounded-xl transition-all shadow-[0_0_15px_rgba(212,175,55,0.2)] hover:shadow-[0_0_25px_rgba(212,175,55,0.4)] mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <span className="animate-spin h-5 w-5 border-2 border-black border-t-transparent rounded-full"></span>
                            ) : (
                                <>Confirm Reschedule <ArrowRight size={18} /></>
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ReservationRescheduleModal;
