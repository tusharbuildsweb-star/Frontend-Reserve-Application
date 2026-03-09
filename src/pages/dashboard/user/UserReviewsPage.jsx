import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, MessageSquare, Trash2, Edit2, Calendar, ChefHat, MapPin, Users, Heart, Settings, Ticket, LogOut, ChevronRight } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchUserReviews, deleteReview, updateReview } from '@/app/features/reviewSlice';
import { logout } from '@/app/features/authSlice';
import { fetchUserReservations } from '@/app/features/reservationSlice';

import { useAlert } from '@/context/AlertContext';

const UserReviewsPage = () => {
    const { showAlert } = useAlert();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const { list: reviews, loading } = useSelector((state) => state.reviews);
    const [editingReview, setEditingReview] = useState(null);
    const [editData, setEditData] = useState({ rating: 5, comment: '', foodRating: 5, ambienceRating: 5, staffRating: 5 });

    useEffect(() => {
        dispatch(fetchUserReviews());
    }, [dispatch]);

    const handleDelete = (id) => {
        showAlert({
            type: 'warning',
            title: 'Delete Review',
            message: 'Are you sure you want to delete this review? This action cannot be undone.',
            showCancel: true,
            confirmText: 'Delete',
            onConfirm: () => {
                dispatch(deleteReview(id));
            }
        });
    };

    const handleEditClick = (rev) => {
        setEditingReview(rev._id);
        setEditData({
            rating: rev.rating || 5,
            comment: rev.comment || '',
            foodRating: rev.foodRating || 5,
            ambienceRating: rev.ambienceRating || 5,
            staffRating: rev.staffRating || 5
        });
    };

    const handleUpdateReview = async (e) => {
        e.preventDefault();
        try {
            await dispatch(updateReview({ id: editingReview, reviewData: editData })).unwrap();
            setEditingReview(null);
            dispatch(fetchUserReviews());
        } catch (error) {
            showAlert({
                type: 'error',
                title: 'Update Failed',
                message: error || 'Failed to update review'
            });
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 pt-32 pb-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header Section (Reused from Dashboard) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12 flex flex-col md:flex-row items-center md:items-start justify-between bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl relative overflow-hidden group"
                >
                    <div className="flex items-center gap-8 relative z-10">
                        <div className="w-24 h-24 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center shadow-xl border-2 border-amber-500/50">
                            {user?.profileImage ? (
                                <img src={`http://localhost:5000${user.profileImage}`} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                                <img src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.name || 'User'}`} alt={user?.name} className="w-full h-full object-cover" />
                            )}
                        </div>
                        <div>
                            <span className="text-amber-500 font-medium tracking-[0.2em] uppercase text-xs mb-2 block">My Account</span>
                            <h1 className="text-4xl font-serif text-white">{user?.name}</h1>
                            <p className="text-zinc-400 text-sm mt-1">{user?.email}</p>
                        </div>
                    </div>
                </motion.div>

                <div className="flex flex-col lg:flex-row gap-10">
                    {/* Sidebar Sidebar Navigation */}
                    <div className="w-full lg:w-1/4">
                        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sticky top-32 space-y-2 shadow-2xl">
                            <button
                                onClick={() => navigate('/dashboard/user')}
                                className="w-full flex items-center justify-between p-4 rounded-2xl text-zinc-400 hover:text-[#F5B942] transition-all group"
                            >
                                <span className="flex items-center font-semibold"><Calendar size={20} className="mr-4 text-amber-500" /> Reservations</span>
                                <ChevronRight size={16} />
                            </button>
                            <button
                                onClick={() => navigate('/dashboard/user/reviews')}
                                className="w-full flex items-center justify-between p-4 rounded-2xl bg-amber-500 text-black shadow-lg transition-all group"
                            >
                                <span className="flex items-center font-semibold"><Star size={20} className="mr-4 text-black" /> My Reviews</span>
                                <ChevronRight size={16} />
                            </button>
                            <button
                                onClick={() => { dispatch(logout()); navigate('/'); }}
                                className="w-full flex items-center justify-between p-4 rounded-2xl text-zinc-400 hover:text-red-400 transition-all group"
                            >
                                <span className="flex items-center font-semibold"><LogOut size={20} className="mr-4 text-zinc-500 group-hover:text-red-400" /> Sign Out</span>
                            </button>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="w-full lg:w-3/4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-10 min-h-[600px] shadow-2xl"
                        >
                            <h2 className="text-3xl font-serif text-white mb-8">Your Reviews</h2>

                            <div className="space-y-6">
                                {loading ? (
                                    <p className="text-zinc-400">Loading your reviews...</p>
                                ) : reviews?.length > 0 ? (
                                    reviews.map(rev => (
                                        <div key={rev._id} className="p-6 border border-white/10 rounded-xl bg-black/20 hover:border-amber-500/20 transition-all">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h4 className="text-xl font-medium text-white mb-1">{rev.restaurantId?.name || 'Restaurant'}</h4>
                                                    <div className="flex items-center gap-4 text-xs text-zinc-500 mb-2">
                                                        <span className="flex items-center"><Calendar size={12} className="mr-1" /> {new Date(rev.createdAt).toLocaleDateString()}</span>
                                                        <span className="flex items-center"><MapPin size={12} className="mr-1" /> {rev.restaurantId?.location || 'Location'}</span>
                                                    </div>
                                                </div>
                                                <div className="flex bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                                                    <Star size={14} className="text-amber-500 fill-current mr-1" />
                                                    <span className="text-amber-500 font-bold text-sm">{rev.rating || 5}</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-white/5">
                                                <div className="text-center">
                                                    <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Food</p>
                                                    <p className="text-amber-500 font-bold">{rev.foodRating || 0}/5</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Ambience</p>
                                                    <p className="text-amber-500 font-bold">{rev.ambienceRating || 0}/5</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Staff</p>
                                                    <p className="text-amber-500 font-bold">{rev.staffRating || 0}/5</p>
                                                </div>
                                            </div>

                                            <p className="text-zinc-300 font-light italic leading-relaxed">"{rev.comment}"</p>

                                            {rev.ownerReply && (
                                                <div className="mt-4 p-4 bg-amber-500/5 border border-amber-500/10 rounded-lg">
                                                    <span className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-1 block">Owner Reply</span>
                                                    <p className="text-zinc-400 text-sm">{rev.ownerReply}</p>
                                                </div>
                                            )}

                                            <div className="flex justify-end gap-4 mt-6">
                                                <button
                                                    onClick={() => handleEditClick(rev)}
                                                    className="flex items-center text-xs text-zinc-400 hover:text-white transition-colors"
                                                >
                                                    <Edit2 size={12} className="mr-1" /> Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(rev._id)}
                                                    className="flex items-center text-xs text-red-500 hover:text-red-400 transition-colors"
                                                >
                                                    <Trash2 size={12} className="mr-1" /> Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl">
                                        <MessageSquare size={40} className="mx-auto text-zinc-700 mb-4" />
                                        <p className="text-zinc-500">You haven't shared any experiences yet.</p>
                                        <button
                                            onClick={() => navigate('/restaurants')}
                                            className="mt-6 text-amber-500 text-sm font-medium hover:underline"
                                        >
                                            Explore restaurants to review
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Edit Review Modal */}
            {editingReview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-zinc-900 border border-white/10 p-8 rounded-3xl w-full max-w-lg shadow-2xl"
                    >
                        <h3 className="text-2xl font-serif text-white mb-6">Update Your Experience</h3>
                        <form onSubmit={handleUpdateReview} className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Overall Rating</label>
                                    <select
                                        value={editData.rating}
                                        onChange={(e) => setEditData({ ...editData, rating: Number(e.target.value) })}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-amber-500 focus:outline-none"
                                    >
                                        {[5, 4, 3, 2, 1].map(num => <option key={num} value={num}>{num} Stars</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Food</label>
                                    <select
                                        value={editData.foodRating}
                                        onChange={(e) => setEditData({ ...editData, foodRating: Number(e.target.value) })}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-amber-500 focus:outline-none"
                                    >
                                        {[5, 4, 3, 2, 1].map(num => <option key={num} value={num}>{num}/5</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Ambience</label>
                                    <select
                                        value={editData.ambienceRating}
                                        onChange={(e) => setEditData({ ...editData, ambienceRating: Number(e.target.value) })}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-amber-500 focus:outline-none"
                                    >
                                        {[5, 4, 3, 2, 1].map(num => <option key={num} value={num}>{num}/5</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Staff</label>
                                    <select
                                        value={editData.staffRating}
                                        onChange={(e) => setEditData({ ...editData, staffRating: Number(e.target.value) })}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-amber-500 focus:outline-none"
                                    >
                                        {[5, 4, 3, 2, 1].map(num => <option key={num} value={num}>{num}/5</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Your Comment</label>
                                <textarea
                                    value={editData.comment}
                                    onChange={(e) => setEditData({ ...editData, comment: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-500 focus:outline-none h-32 resize-none"
                                    placeholder="Tell us about your visit..."
                                    required
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setEditingReview(null)}
                                    className="flex-1 py-3 border border-white/10 rounded-xl text-zinc-400 hover:text-white transition-all font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-amber-500 text-black rounded-xl font-bold hover:bg-amber-400 transition-all shadow-lg"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default UserReviewsPage;
