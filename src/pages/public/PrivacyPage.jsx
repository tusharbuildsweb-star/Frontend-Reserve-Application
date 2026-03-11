import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, FileText, Bell } from 'lucide-react';

const PrivacyPage = () => {
    return (
        <div className="min-h-screen bg-zinc-950 pt-32 pb-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-16"
                >
                    <span className="text-amber-500 font-medium tracking-[0.3em] uppercase text-[10px] mb-4 block">Last Updated: March 2026</span>
                    <h1 className="text-4xl md:text-5xl font-serif text-white mb-8 text-balance">Privacy Policy</h1>
                    <p className="text-zinc-400 font-light text-lg">Your privacy is paramount to us at Reserve. This policy outlines how we handle your personal data with the utmost discretion and security.</p>
                </motion.div>

                <div className="space-y-12">
                    <section className="bg-zinc-900/30 border border-white/5 p-8 rounded-3xl">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="bg-amber-500/10 p-3 rounded-xl"><Shield className="text-amber-500" size={24} /></div>
                            <h2 className="text-2xl font-serif text-white">Data Protection</h2>
                        </div>
                        <p className="text-zinc-500 font-light leading-relaxed mb-4">
                            We implement industry-standard encryption and security protocols to protect your personal information, including contact details, booking history, and dining preferences.
                        </p>
                    </section>

                    <section className="bg-zinc-900/30 border border-white/5 p-8 rounded-3xl">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="bg-amber-500/10 p-3 rounded-xl"><Eye className="text-amber-500" size={24} /></div>
                            <h2 className="text-2xl font-serif text-white">Information We Collect</h2>
                        </div>
                        <ul className="list-disc list-inside space-y-3 text-zinc-500 font-light">
                            <li>Account information (Name, Email, Phone Number)</li>
                            <li>Reservation details and dining preferences</li>
                            <li>Device and usage information for platform optimization</li>
                            <li>Communication history with our support team</li>
                        </ul>
                    </section>

                    <section className="bg-zinc-900/30 border border-white/5 p-8 rounded-3xl">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="bg-amber-500/10 p-3 rounded-xl"><Bell className="text-amber-500" size={24} /></div>
                            <h2 className="text-2xl font-serif text-white">Marketing & Communications</h2>
                        </div>
                        <p className="text-zinc-500 font-light leading-relaxed">
                            We may send you personalized recommendations and exclusive invitations based on your interests. You can manage your notification preferences at any time through your dashboard settings.
                        </p>
                    </section>

                    <section className="px-8 flex flex-col items-center text-center">
                        <h3 className="text-white font-serif text-2xl mb-4">Questions?</h3>
                        <p className="text-zinc-500 font-light mb-8">If you have any inquiries regarding our privacy practices, please contact our dedicated privacy officer.</p>
                        <button className="bg-white text-black px-8 py-3 rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-amber-500 transition-colors">
                            Contact Privacy Officer
                        </button>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPage;
