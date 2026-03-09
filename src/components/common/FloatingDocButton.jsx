import React from 'react';
import { Download, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

const FloatingDocButton = () => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 1, type: "spring" }}
            className="fixed bottom-6 right-6 z-[9999] flex items-stretch bg-[rgba(15,15,15,0.95)] backdrop-blur-md border border-[rgba(255,255,255,0.1)] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] overflow-hidden group hover:border-[rgba(245,185,66,0.3)] transition-colors duration-300 w-[calc(100vw-3rem)] max-w-[300px] sm:max-w-xs"
        >
            <div className="flex-1 flex flex-col justify-center px-4 py-3 border-r border-[rgba(255,255,255,0.05)]">
                <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-[#F5B942]" />
                    <span className="font-semibold text-xs sm:text-sm text-white tracking-wide">Test Documentation</span>
                </div>
                <span className="text-[10px] sm:text-[11px] text-[#A0A0A0] leading-snug">
                    To test this application, kindly download this documentation
                </span>
            </div>
            <a
                href="/RESERVE_Platform.pdf"
                download="RESERVE_Platform.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center px-4 sm:px-5 bg-[linear-gradient(135deg,#F5B942,#D4A017)] hover:bg-[linear-gradient(135deg,#FFD272,#E5B128)] text-[#050505] transition-all duration-300 relative overflow-hidden shrink-0 group/btn"
                title="Download Documentation"
            >
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                <Download className="w-5 h-5 relative z-10" />
            </a>
        </motion.div>
    );
};

export default FloatingDocButton;
