import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, MapPin, Phone, Mail, CheckCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

const ContactPage = () => {
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await axios.post(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'}/contact/submit`, formData);
            setSuccess(true);
            setFormData({ name: '', email: '', message: '' });
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 pt-28 pb-20">
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                    {/* Info Side */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-12"
                    >
                        <div>
                            <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6 tracking-tight text-balance">
                                Get in <span className="text-amber-500">Touch</span>
                            </h1>
                            <p className="text-zinc-400 text-lg font-light leading-relaxed max-w-md">
                                Have questions about our premium booking services? Our concierge team is here to assist you 24/7.
                            </p>
                        </div>

                        <div className="space-y-8">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-amber-500">
                                    <MapPin size={24} />
                                </div>
                                <div>
                                    <h3 className="text-white font-medium">Visit Us</h3>
                                    <p className="text-zinc-500 text-sm font-light mt-1 text-balance">
                                        RESERVE Headquarters, Alwarpet High Road, Chennai, Tamil Nadu 600018
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-amber-500">
                                    <Phone size={24} />
                                </div>
                                <div>
                                    <h3 className="text-white font-medium">Concierge Line</h3>
                                    <p className="text-zinc-500 text-sm font-light mt-1">+91 98765 43210</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-amber-500">
                                    <Mail size={24} />
                                </div>
                                <div>
                                    <h3 className="text-white font-medium">Email Enquiries</h3>
                                    <p className="text-zinc-500 text-sm font-light mt-1">concierge@reserve.com</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Form Side */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl"
                    >
                        {success ? (
                            <div className="h-full flex flex-col items-center justify-center text-center py-12">
                                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mb-6">
                                    <CheckCircle size={40} />
                                </div>
                                <h2 className="text-2xl font-serif font-bold text-white mb-4">Message Sent Successfully</h2>
                                <p className="text-zinc-400 font-light mb-8">
                                    We usually respond within 24 hours. Please check your Spam folder if you do not see our response.
                                </p>
                                <button
                                    onClick={() => setSuccess(false)}
                                    className="text-amber-500 font-medium hover:text-amber-400 transition-colors underline underline-offset-8"
                                >
                                    Send another message
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-zinc-500 text-xs uppercase tracking-[0.2em] font-bold mb-2">FullName</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-amber-500/50 transition-colors"
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-zinc-500 text-xs uppercase tracking-[0.2em] font-bold mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-amber-500/50 transition-colors"
                                        placeholder="john@luxury.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-zinc-500 text-xs uppercase tracking-[0.2em] font-bold mb-2">Your Message</label>
                                    <textarea
                                        rows="5"
                                        required
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-amber-500/50 transition-colors resize-none"
                                        placeholder="Share your requirements or feedback..."
                                    ></textarea>
                                </div>
                                {error && <p className="text-red-400 text-sm">{error}</p>}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-4 rounded-xl transition-all shadow-xl shadow-amber-500/10 flex items-center justify-center gap-2 group disabled:opacity-50"
                                >
                                    {loading ? <Loader2 size={20} className="animate-spin" /> : <>
                                        Send Message
                                        <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    </>}
                                </button>
                            </form>
                        )}
                    </motion.div>
                </div>
            </section>
        </div>
    );
};

export default ContactPage;
