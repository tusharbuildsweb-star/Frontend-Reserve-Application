import React from 'react';
import { motion } from 'framer-motion';

const AboutPage = () => {
    return (
        <div className="min-h-screen bg-zinc-950 pt-28 pb-20">
            {/* Hero Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center"
                >
                    <h1 className="text-4xl md:text-5xl lg:text-7xl font-serif font-bold text-white mb-6 tracking-tight text-balance">
                        About <span className="text-amber-500">RESERVE</span>
                    </h1>
                    <p className="text-zinc-400 text-lg md:text-xl max-w-3xl mx-auto font-light leading-relaxed">
                        RESERVE is a modern restaurant reservation platform designed to simplify the dining experience for both guests and restaurant owners. Our mission is to connect food lovers with exceptional dining venues while providing restaurants with powerful tools to manage their bookings efficiently.
                    </p>
                </motion.div>
            </section>

            {/* Content Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="relative"
                >
                    <div className="aspect-[4/5] rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                        <img
                            src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=2000"
                            alt="Luxury Dining"
                            className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                        />
                    </div>
                    <div className="absolute -bottom-8 -right-8 bg-amber-500 text-black p-8 rounded-2xl shadow-2xl hidden md:block">
                        <p className="text-4xl font-serif font-bold italic">"Redefining fine dining."</p>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="space-y-8"
                >
                    <div>
                        <h2 className="text-3xl font-serif font-bold text-white mb-4">Our Vision</h2>
                        <p className="text-zinc-400 leading-relaxed font-light">
                            We believe that every meal should be an event. From local gems to Michelin-starred icons, RESERVE brings the finest culinary destinations to your fingertips with a seamless, high-end booking interface.
                        </p>
                    </div>
                    <div>
                        <h2 className="text-3xl font-serif font-bold text-white mb-4">For Restaurateurs</h2>
                        <p className="text-zinc-400 leading-relaxed font-light">
                            We provide restaurant owners with a comprehensive dashboard to track reservations, manage table availability in real-time, and gain deep insights into guest preferences. Our platform ensures that your tables are always optimized and your guests are always delighted.
                        </p>
                    </div>
                    <div className="pt-8 grid grid-cols-2 gap-8">
                        <div>
                            <p className="text-3xl font-serif font-bold text-amber-500">500+</p>
                            <p className="text-zinc-500 text-sm uppercase tracking-widest mt-1">Partners</p>
                        </div>
                        <div>
                            <p className="text-3xl font-serif font-bold text-amber-500">10k+</p>
                            <p className="text-zinc-500 text-sm uppercase tracking-widest mt-1">Bookings</p>
                        </div>
                    </div>
                </motion.div>
            </section>
        </div>
    );
};

export default AboutPage;
