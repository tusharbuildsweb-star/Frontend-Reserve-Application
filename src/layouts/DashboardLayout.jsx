import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/common/Navbar';

const DashboardLayout = () => {
    return (
        <div className="min-h-screen flex flex-col bg-[#050505] text-[#F5F5F5] relative overflow-hidden">
            {/* Background Layer */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <img
                    src="https://images.pexels.com/photos/1861784/pexels-photo-1861784.jpeg"
                    alt=""
                    className="w-full h-full object-cover"
                    style={{ filter: 'blur(8px) brightness(0.30)', transform: 'scale(1.05)' }}
                />
                {/* Cinematic Overlays */}
                <div
                    className="absolute inset-0"
                    style={{
                        background: 'linear-gradient(rgba(0,0,0,0.85), rgba(0,0,0,0.95))'
                    }}
                />
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
                <Navbar />
                <main className="flex-grow pt-20 flex">
                    <div className="flex-grow p-4 md:p-8">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
