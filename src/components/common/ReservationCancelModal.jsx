import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Info, Clock, XCircle } from 'lucide-react';

// Compute refund tier based on hours until reservation
const getRefundPolicy = (reservation) => {
    if (!reservation) return { tier: 'unknown', refundPct: 0, penalty: 0, label: '', color: 'zinc', hoursLeft: 0 };

    const resDate = reservation.date ? new Date(reservation.date) : null;
    const resTime = reservation.time || '12:00 PM';
    if (!resDate) return { tier: 'unknown', refundPct: 0, penalty: 0, label: 'N/A', color: 'zinc', hoursLeft: 0 };

    // Parse time (handles "2:30 PM" or "14:30")
    const parts = resTime.split(' ');
    const timePart = parts[0];
    const meridian = parts[1]; // PM or AM or undefined
    const [h, m] = timePart.split(':').map(Number);
    let hour = h;
    if (meridian === 'PM' && h !== 12) hour += 12;
    if (meridian === 'AM' && h === 12) hour = 0;

    const resDateTime = new Date(resDate);
    resDateTime.setHours(hour, m || 0, 0, 0);

    const hoursLeft = (resDateTime - new Date()) / (1000 * 60 * 60);

    if (hoursLeft > 5) {
        return { tier: 'full', refundPct: 100, penalty: 0, label: 'Full Refund', color: 'green', hoursLeft };
    } else if (hoursLeft > 2) {
        return { tier: 'partial', refundPct: 80, penalty: 0, label: '80% Refund', color: 'amber', hoursLeft };
    } else if (hoursLeft > 0) {
        return { tier: 'none', refundPct: 0, penalty: 100, label: 'No Refund + ₹100 Penalty', color: 'red', hoursLeft };
    } else {
        return { tier: 'expired', refundPct: 0, penalty: 0, label: 'Reservation has passed', color: 'zinc', hoursLeft };
    }
};

const ReservationCancelModal = ({ isOpen, onClose, onConfirm, reservation }) => {
    const policy = useMemo(() => getRefundPolicy(reservation), [reservation]);

    const totalPaid = reservation?.totalPaidNow || 0;
    const refundAmount = Math.round((totalPaid * policy.refundPct) / 100);
    const deductionAmount = totalPaid - refundAmount;

    if (!isOpen) return null;

    const tierStyles = {
        green: 'bg-green-500/10 border-green-500/30 text-green-400',
        amber: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
        red:   'bg-red-500/10 border-red-500/30 text-red-400',
        zinc:  'bg-zinc-800/50 border-white/10 text-zinc-400',
    };
    const tierDot = { green: 'bg-green-500', amber: 'bg-amber-500', red: 'bg-red-500', zinc: 'bg-zinc-600' };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
                >
                    {/* Top accent stripe */}
                    <div className="h-1 w-full bg-gradient-to-r from-red-700 via-red-500 to-red-700" />

                    {/* Header */}
                    <div className="p-8 pb-0 flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20">
                                <AlertTriangle className="text-red-500" size={24} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-serif text-white">Cancel Reservation</h3>
                                <p className="text-zinc-500 text-sm mt-0.5">Please review the refund terms below</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-8 space-y-5">

                        {/* Booking mini summary */}
                        {reservation && (
                            <div className="flex items-center gap-4 bg-black/40 p-4 rounded-xl border border-white/5">
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-medium truncate">{reservation.restaurantId?.name || 'Restaurant'}</p>
                                    <p className="text-zinc-500 text-xs mt-0.5">
                                        {reservation.date
                                            ? new Date(reservation.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
                                            : ''} at {reservation.time} · {reservation.guests} Guests
                                    </p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="text-zinc-500 text-[10px] uppercase tracking-wider">Total Paid</p>
                                    <p className="text-amber-500 font-bold text-lg">₹{totalPaid}</p>
                                </div>
                            </div>
                        )}

                        {/* Refund Policy Table */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                            <div className="flex items-center gap-2 mb-3 text-amber-500">
                                <Info size={15} />
                                <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Our Cancellation Policy</span>
                            </div>
                            <div className="space-y-1">
                                {[
                                    { label: 'More than 5 hours before',     value: 'Full Refund',                  tier: 'green', active: policy.tier === 'full' },
                                    { label: '2 – 5 hours before',           value: '80% Refund',                   tier: 'amber', active: policy.tier === 'partial' },
                                    { label: 'Less than 2 hours before',     value: 'No Refund + ₹100 Penalty',     tier: 'red',   active: policy.tier === 'none' },
                                ].map(row => (
                                    <div
                                        key={row.label}
                                        className={`flex justify-between items-center text-sm px-3 py-2.5 rounded-xl border transition-all ${
                                            row.active
                                                ? (row.tier === 'green' ? 'bg-green-500/10 border-green-500/20' : row.tier === 'amber' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20')
                                                : 'border-transparent'
                                        }`}
                                    >
                                        <span className="flex items-center gap-2 text-zinc-400">
                                            {row.active && <span className={`w-2 h-2 rounded-full flex-shrink-0 ${tierDot[row.tier]} animate-pulse`} />}
                                            {!row.active && <span className="w-2 h-2 rounded-full flex-shrink-0 bg-zinc-700" />}
                                            {row.label}
                                        </span>
                                        <span className={`font-semibold ${row.active ? (row.tier === 'green' ? 'text-green-400' : row.tier === 'amber' ? 'text-amber-400' : 'text-red-400') : 'text-zinc-600'}`}>
                                            {row.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Computed Refund Result Box */}
                        <div className={`rounded-2xl border p-5 ${tierStyles[policy.color]}`}>
                            <div className="flex items-center gap-2 mb-3 opacity-80">
                                <Clock size={14} />
                                <span className="text-[10px] uppercase tracking-widest font-bold">
                                    {policy.hoursLeft > 0
                                        ? `${policy.hoursLeft.toFixed(1)} hour${policy.hoursLeft !== 1 ? 's' : ''} until your reservation`
                                        : 'Reservation time has already passed'}
                                </span>
                            </div>
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest opacity-70 mb-1">You will receive</p>
                                    <p className="text-4xl font-serif font-bold">₹{refundAmount}</p>
                                    {policy.penalty > 0 && (
                                        <p className="text-xs mt-1.5 opacity-80">A ₹{policy.penalty} penalty applies to your next booking</p>
                                    )}
                                    {deductionAmount > 0 && policy.penalty === 0 && refundAmount < totalPaid && (
                                        <p className="text-xs mt-1.5 opacity-70">₹{deductionAmount} is non-refundable under this policy</p>
                                    )}
                                    {policy.tier === 'full' && (
                                        <p className="text-xs mt-1.5 opacity-80">Full amount will be refunded — no deductions</p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] uppercase tracking-widest opacity-70 mb-1">Applied Tier</p>
                                    <p className="text-base font-bold leading-tight">{policy.label}</p>
                                </div>
                            </div>
                        </div>

                        <p className="text-zinc-600 text-xs italic text-center">
                            * Refunds appear in your original payment method within 5–7 business days. The restaurant owner is notified immediately upon cancellation.
                        </p>
                    </div>

                    {/* Footer Actions */}
                    <div className="px-8 pb-8 flex gap-4">
                        <button
                            onClick={onClose}
                            className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-zinc-400 hover:text-white hover:bg-white/10 transition-all font-medium"
                        >
                            Keep Reservation
                        </button>
                        <button
                            onClick={() => { onConfirm(reservation._id); onClose(); }}
                            className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-500 transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2"
                        >
                            <XCircle size={18} />
                            Confirm Cancellation
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ReservationCancelModal;
