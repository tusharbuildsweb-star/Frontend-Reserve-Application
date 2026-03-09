import React, { useEffect, useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { UtensilsCrossed } from 'lucide-react';
import { motion } from 'framer-motion';

const Particle = ({ delay }) => {
    // Generate random x starting positions and speeds
    const randomX = Math.floor(Math.random() * 100);
    const duration = 15 + Math.floor(Math.random() * 15); // 15-30s

    return (
        <motion.div
            className="absolute rounded-full bg-[#F5B942]"
            style={{
                width: '2px',
                height: '2px',
                left: `${randomX}%`,
                bottom: '-5%'
            }}
            initial={{ y: 0, opacity: 0 }}
            animate={{
                y: '-120vh',
                opacity: [0, 0.05, 0.05, 0]
            }}
            transition={{
                duration: duration,
                repeat: Infinity,
                delay: delay,
                ease: "linear"
            }}
        />
    );
};

const AuthLayout = () => {
    // Generate 15 particles with random delays
    const particles = Array.from({ length: 15 }).map((_, i) => (
        <Particle key={i} delay={i * (20 / 15)} />
    ));

    return (
        <div className="relative min-h-screen flex flex-col lg:flex-row bg-[#050505] text-[#F5F5F5] overflow-hidden">

            {/* Left Side: Video Showcase (60% on Desktop) */}
            <div className="relative w-full lg:w-[60%] h-[40vh] lg:h-screen hidden sm:block">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                >
                    <source src="https://www.pexels.com/download/video/5107292/" type="video/mp4" />
                </video>

                {/* Dark Overlay as requested */}
                <div className="absolute inset-0 bg-gradient-to-r from-[rgba(0,0,0,0.75)] to-[rgba(0,0,0,0.4)]"></div>

                {/* Overlay Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="max-w-xl relative"
                    >
                        {/* Subtle gold glow behind text */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[#F5B942]/10 blur-[100px] rounded-full pointer-events-none"></div>

                        <h1 className="relative z-10 font-serif text-4xl lg:text-7xl text-[#F5F5F5] mb-6 tracking-tight leading-tight drop-shadow-2xl">
                            Reserve <span className="text-[#F5B942] italic">Extraordinary</span> Dining
                        </h1>
                        <p className="relative z-10 font-sans text-base lg:text-lg text-[#F5F5F5] font-light tracking-wide max-w-md mx-auto leading-relaxed drop-shadow-md">
                            Discover and book tables at the world's most exceptional restaurants.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Right Side: Authentication Form (40% on Desktop) */}
            <div className="relative z-10 w-full lg:w-[40%] flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16 min-h-screen lg:min-h-0 bg-[#050505]">

                {/* Ambient light ring on right side */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(245,185,66,0.03)_0%,transparent_60%)] pointer-events-none"></div>

                {/* Light Particle Accent */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {particles}
                </div>

                {/* Mobile-only background video */}
                <div className="absolute inset-0 sm:hidden z-0">
                    <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                    >
                        <source src="https://www.pexels.com/download/video/5107292/" type="video/mp4" />
                    </video>
                    <div className="absolute inset-0 bg-[rgba(0,0,0,0.7)] backdrop-blur-md"></div>
                </div>

                <div className="w-full max-w-md relative z-10">
                    {/* Floating Logo Area */}
                    <div className="flex justify-center mb-10">
                        <Link to="/" className="flex flex-col items-center gap-4 group">
                            <motion.div
                                animate={{ y: [0, -6, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center p-[1px] border border-[rgba(245,185,66,0.3)] bg-[radial-gradient(circle,rgba(245,185,66,0.08),transparent)] shadow-[0_0_20px_rgba(245,185,66,0.15)] group-hover:shadow-[0_0_30px_rgba(245,185,66,0.3)] transition-all duration-700"
                            >
                                <div className="w-full h-full rounded-full flex items-center justify-center backdrop-blur-sm">
                                    <UtensilsCrossed className="w-6 h-6 text-[#F5B942]" />
                                </div>
                            </motion.div>
                            <span className="font-serif text-3xl font-bold tracking-widest text-[#F5F5F5] group-hover:text-[#F5B942] transition-colors duration-700">
                                RESERVE
                            </span>
                        </Link>
                    </div>

                    {/* Child Authentication Pages are injected here */}
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
