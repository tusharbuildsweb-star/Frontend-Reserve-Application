import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Gavel, AlertTriangle, CheckCircle, Scale } from 'lucide-react';

const TermsPage = () => {
    return (
        <div className="min-h-screen bg-zinc-950 pt-32 pb-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-16"
                >
                    <span className="text-amber-500 font-medium tracking-[0.3em] uppercase text-[10px] mb-4 block">Effective Date: March 2026</span>
                    <h1 className="text-4xl md:text-5xl font-serif text-white mb-8 text-balance">Terms of Service</h1>
                    <p className="text-zinc-400 font-light text-lg">Acceptance of these terms ensures a standard of excellence and mutual respect within the Reserve community.</p>
                </motion.div>

                <div className="space-y-12">
                    <section className="bg-zinc-900/30 border border-white/5 p-8 rounded-3xl">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="bg-amber-500/10 p-3 rounded-xl"><Scale className="text-amber-500" size={24} /></div>
                            <h2 className="text-2xl font-serif text-white">Agreement to Terms</h2>
                        </div>
                        <p className="text-zinc-500 font-light leading-relaxed">
                            By accessing or using Reserve, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
                        </p>
                    </section>

                    <section className="bg-zinc-900/30 border border-white/5 p-8 rounded-3xl">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="bg-amber-500/10 p-3 rounded-xl"><CheckCircle className="text-amber-500" size={24} /></div>
                            <h2 className="text-2xl font-serif text-white">Reservation & Cancellations</h2>
                        </div>
                        <ul className="list-disc list-inside space-y-3 text-zinc-500 font-light">
                            <li>Reservations are subject to availability and restaurant confirmation.</li>
                            <li>A reservation fee or advance payment may be required for specific venues or packages.</li>
                            <li>Cancellations must be made within the timeframe specified by the restaurant to avoid fees.</li>
                            <li>Reserve acts as an intermediary and is not responsible for service quality at individual venues.</li>
                        </ul>
                    </section>

                    <section className="bg-zinc-900/30 border border-white/5 p-8 rounded-3xl">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="bg-amber-500/10 p-3 rounded-xl"><AlertTriangle className="text-amber-500" size={24} /></div>
                            <h2 className="text-2xl font-serif text-white">User Conduct</h2>
                        </div>
                        <p className="text-zinc-500 font-light leading-relaxed">
                            Users are expected to maintain professional conduct. Any form of harassment, fraudulent activity, or misuse of the platform will result in immediate termination of access.
                        </p>
                    </section>

                    <div className="text-center py-12">
                        <p className="text-zinc-600 text-sm italic font-light">"Reserve: Excellence in every connection."</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermsPage;
