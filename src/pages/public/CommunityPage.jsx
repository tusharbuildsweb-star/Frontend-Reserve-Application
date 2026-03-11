import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Quote, Star, Users, MessageSquare, Heart } from 'lucide-react';
import axios from 'axios';

const CommunityPage = () => {
    const [testimonials, setTestimonials] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTestimonials = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'}/testimonials`);
                setTestimonials(res.data);
            } catch (error) {
                console.error('Error fetching testimonials:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchTestimonials();
    }, []);

    const stats = [
        { label: 'Happy Diners', value: '50k+', icon: <Users className="text-amber-500" /> },
        { label: 'Verified Reviews', value: '12k+', icon: <Star className="text-amber-500" /> },
        { label: 'Tables Booked', value: '100k+', icon: <Heart className="text-amber-500" /> },
    ];

    return (
        <div className="min-h-screen bg-zinc-950 pt-32 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-20">
                    <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-amber-500 font-medium tracking-[0.3em] uppercase text-xs mb-4 block"
                    >
                        Our Community
                    </motion.span>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl lg:text-7xl font-serif text-white mb-6 md:mb-8 text-balance mx-auto"
                    >
                        Voices of Reserve
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-zinc-400 font-light max-w-3xl mx-auto text-base md:text-lg leading-relaxed text-balance"
                    >
                        Discover why thousands of food enthusiasts and elite restaurateurs choose Reserve for their most precious dining moments.
                    </motion.p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
                    {stats.map((stat, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-10 rounded-3xl text-center group hover:border-amber-500/30 transition-all duration-500"
                        >
                            <div className="bg-amber-500/5 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
                                {stat.icon}
                            </div>
                            <div className="text-4xl font-serif text-white mb-2">{stat.value}</div>
                            <div className="text-zinc-500 uppercase tracking-widest text-[10px] font-bold">{stat.label}</div>
                        </motion.div>
                    ))}
                </div>

                {/* Testimonials Grid */}
                <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
                    {loading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="bg-zinc-900/20 border border-white/5 rounded-3xl h-64 animate-pulse" />
                        ))
                    ) : (
                        testimonials.map((t, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="break-inside-avoid bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-8 rounded-3xl relative group hover:bg-zinc-900/60 transition-all duration-500"
                            >
                                <Quote className="absolute top-8 right-8 text-amber-500/10 w-12 h-12 group-hover:text-amber-500/20 transition-colors" />
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-amber-500 font-serif text-xl border border-white/10 overflow-hidden">
                                        {t.image ? <img src={t.image} alt={t.name} className="w-full h-full object-cover" /> : t.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="text-white font-medium">{t.name}</h4>
                                        <p className="text-amber-500 text-[10px] uppercase tracking-widest font-bold">{t.role}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1 mb-4 text-amber-500/60">
                                    {Array.from({ length: t.rating || 5 }).map((_, i) => (
                                        <Star key={i} size={12} fill="currentColor" />
                                    ))}
                                </div>
                                <p className="text-zinc-400 font-light leading-relaxed italic">
                                    "{t.content}"
                                </p>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-32 bg-gradient-to-r from-amber-500 to-amber-600 p-16 rounded-[3rem] text-center shadow-[0_20px_50px_rgba(212,175,55,0.2)]"
                >
                    <h2 className="text-4xl md:text-5xl font-serif text-black mb-6">Ready to Join the Community?</h2>
                    <p className="text-black/70 mb-10 max-w-xl mx-auto font-medium">Experience the future of dining reservations today. Join over 50,000 members who never settle for less than exceptional.</p>
                    <button className="bg-black text-white px-10 py-4 rounded-full font-bold uppercase tracking-widest text-xs hover:scale-105 transition-transform duration-300 shadow-2xl">
                        Create Your Account
                    </button>
                </motion.div>
            </div>
        </div>
    );
};

export default CommunityPage;
