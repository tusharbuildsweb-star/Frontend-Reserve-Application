import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, User, MapPin, Search, Filter, ChevronDown, MessageSquare, Quote } from 'lucide-react';
import api from '../../services/api';
import io from 'socket.io-client';

const TestimonialsPage = () => {
    const [testimonials, setTestimonials] = useState([]);
    const [stats, setStats] = useState({
        averageRating: 4.8,
        totalReviews: 12450,
        breakdown: [
            { stars: 5, percentage: 72 },
            { stars: 4, percentage: 18 },
            { stars: 3, percentage: 6 },
            { stars: 2, percentage: 2 },
            { stars: 1, percentage: 2 }
        ],
        metrics: [
            { label: 'Food Quality', score: 4.7 },
            { label: 'Service', score: 4.6 },
            { label: 'Ambience', score: 4.8 },
            { label: 'Value', score: 4.5 },
            { label: 'Cleanliness', score: 4.6 }
        ]
    });

    const [filter, setFilter] = useState('Most Recent');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTestimonials();

        const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');
        socket.on('newReviewAdded', () => {
            fetchTestimonials();
        });

        return () => socket.disconnect();
    }, []);

    const fetchTestimonials = async () => {
        try {
            const res = await api.get('testimonials');
            setTestimonials(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching testimonials", err);
            setLoading(false);
        }
    };

    const renderStars = (rating) => {
        return [...Array(5)].map((_, i) => (
            <Star key={i} size={14} className={i < rating ? "fill-[#F5B942] text-[#F5B942]" : "text-[#1F1F1F]"} />
        ));
    };

    return (
        <div className="min-h-screen bg-[#050505] text-[#F5F5F5] pt-32 pb-20">
            {/* 1. Hero Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-24">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <nav className="flex justify-center items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-[#A1A1A1] mb-8">
                        <a href="/" className="hover:text-[#F5B942] transition-colors">Home</a>
                        <span>/</span>
                        <span className="text-[#F5B942]">Testimonials</span>
                    </nav>
                    <h1 className="text-4xl md:text-5xl lg:text-7xl font-serif mb-6 md:mb-8 tracking-tight text-balance mx-auto">
                        What Our <span className="text-[#F5B942] italic">Diners</span> are Saying
                    </h1>
                    <p className="max-w-2xl mx-auto text-[#A1A1A1] font-light text-base md:text-lg leading-relaxed text-balance px-4">
                        Every dining experience is celebrated by our guests who have reserved through Reserve.
                        Real experiences, real feedback, and memorable dining moments.
                    </p>
                </motion.div>
            </section>

            {/* 2. Ratings Summary & Breakdown */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-32">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">

                    {/* Overall Summary */}
                    <div className="bg-[#0B0B0B]/40 border border-[#1F1F1F] p-10 rounded-3xl text-center flex flex-col items-center justify-center h-full min-h-[400px]">
                        <div className="flex items-end gap-2 mb-4">
                            <span className="text-7xl font-serif">{stats.averageRating}</span>
                            <div className="flex gap-1 mb-4">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={24} className="fill-[#F5B942] text-[#F5B942]" />
                                ))}
                            </div>
                        </div>
                        <h3 className="text-2xl font-serif mb-2">Exceptional Dining Experience</h3>
                        <p className="text-[#A1A1A1] text-sm tracking-wide">Based on {stats.totalReviews.toLocaleString()} verified reviews</p>

                        <div className="mt-12 w-full pt-8 border-t border-[#1F1F1F]">
                            <Quote className="text-[#F5B942]/20 w-12 h-12 mx-auto" />
                        </div>
                    </div>

                    {/* Rating Breakdown */}
                    <div className="bg-[#0B0B0B]/40 border border-[#1F1F1F] p-10 rounded-3xl h-full min-h-[400px]">
                        <h4 className="text-lg font-serif mb-8 flex items-center gap-3">
                            <Filter size={18} className="text-[#F5B942]" /> Rating Breakdown
                        </h4>
                        <div className="space-y-6">
                            {stats.breakdown.map((item, idx) => (
                                <div key={idx} className="space-y-2">
                                    <div className="flex justify-between text-xs uppercase tracking-widest text-[#A1A1A1]">
                                        <span>{item.stars} Stars</span>
                                        <span>{item.percentage}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-[#121212] rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            whileInView={{ width: `${item.percentage}%` }}
                                            transition={{ duration: 1, delay: idx * 0.1 }}
                                            className="h-full bg-[#F5B942]"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Review Metrics */}
                    <div className="bg-[#0B0B0B]/40 border border-[#1F1F1F] p-10 rounded-3xl h-full min-h-[400px]">
                        <h4 className="text-lg font-serif mb-8 flex items-center gap-3">
                            <Star size={18} className="text-[#F5B942]" /> Review Metrics
                        </h4>
                        <div className="space-y-8">
                            {stats.metrics.map((metric, idx) => (
                                <div key={idx} className="space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-[#F5F5F5] font-light">{metric.label}</span>
                                        <span className="text-[#F5B942] font-serif">{metric.score}</span>
                                    </div>
                                    <div className="h-1 bg-[#121212] rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            whileInView={{ width: `${(metric.score / 5) * 100}%` }}
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                            className="h-full bg-gradient-to-r from-[#D4A017] to-[#F5B942]"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </section>


            {/* 4. Testimonial Grid */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {loading ? (
                    <div className="flex flex-col gap-12 max-w-5xl mx-auto">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="bg-[#0B0B0B]/40 border border-[#1F1F1F] h-64 md:h-80 rounded-[40px] animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col gap-12 max-w-5xl mx-auto">
                        {testimonials.map((t, idx) => {
                            const isEven = idx % 2 === 0;
                            return (
                                <motion.div
                                    key={t._id || idx}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1, duration: 0.5 }}
                                    className="bg-[#0B0B0B]/80 backdrop-blur-md border border-[#1F1F1F] rounded-[40px] p-8 md:p-12 flex flex-col md:flex-row items-center gap-12 hover:border-[#F5B942]/30 transition-all duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
                                >
                                    <div className={`w-full md:w-3/5 flex flex-col justify-center ${isEven ? 'md:order-1' : 'md:order-2'}`}>
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4A017] to-[#F5B942] flex items-center justify-center text-black font-serif font-bold text-lg shadow-[0_0_15px_rgba(245,185,66,0.3)]">
                                                {t.name.charAt(0)}
                                            </div>
                                            <div className="text-xl font-serif text-[#F5F5F5] tracking-wide">
                                                {t.location || 'Chennai'}
                                            </div>
                                        </div>
                                        <p className="text-2xl md:text-3xl font-light text-[#F5F5F5] leading-snug mb-8 relative">
                                            {t.content}
                                        </p>
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end w-full border-t border-[#1F1F1F]/50 pt-6">
                                            <div className="mb-4 md:mb-0">
                                                <h5 className="font-sans text-[#F5F5F5] font-semibold text-sm flex items-center gap-2 uppercase tracking-widest">
                                                    <span className="w-6 h-[1px] bg-[#3a3a3a]"></span>
                                                    {t.name}
                                                </h5>
                                                <div className="text-[#A1A1A1] text-xs mt-1 ml-8">
                                                    Verified Diner
                                                </div>
                                            </div>
                                            <div className="flex gap-1 ml-8 md:ml-0">
                                                {renderStars(t.rating)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className={`w-full md:w-2/5 flex justify-center items-center ${isEven ? 'md:order-2' : 'md:order-1'}`}>
                                        <div className="w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden border border-[#1F1F1F] shadow-[0_0_40px_rgba(0,0,0,0.5)] hover:border-[#F5B942]/50 transition-all duration-700">
                                            <img
                                                src={t.image || `https://randomuser.me/api/portraits/${idx % 2 === 0 ? 'men' : 'women'}/${idx + 20}.jpg`}
                                                alt={t.name}
                                                className="w-full h-full object-cover grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-700 scale-105 hover:scale-100"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
};

export default TestimonialsPage;
