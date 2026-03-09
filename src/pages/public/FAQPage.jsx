import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, HelpCircle, Search } from 'lucide-react';

const FAQPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [openIdx, setOpenIdx] = useState(null);

    const faqs = [
        {
            question: "How do I make a reservation?",
            answer: "Simply browse our curated list of restaurants, select your preferred venue, choosing your date, time, and party size, and click 'Book Table'. You will receive an instant confirmation via email."
        },
        {
            question: "Is there a booking fee?",
            answer: "While many reservations are free, some premium venues or special event packages may require a small reservation fee or an advance payment to secure your table."
        },
        {
            question: "Can I cancel or modify my booking?",
            answer: "Yes, you can manage all your reservations through your user dashboard. Please note that individual restaurants have their own cancellation policies, usually requiring 2-24 hours notice."
        },
        {
            question: "What are 'Experience Packages'?",
            answer: "These are specially curated dining experiences designed for birthdays, anniversaries, or corporate events. They often include themed decorations, set menus, and dedicated service."
        },
        {
            question: "How do I become a partner restaurant?",
            answer: "Visit our 'Become a Partner' page and fill out the application form. Our team will review your application and contact you within 48 hours for onboarding."
        },
        {
            question: "What is the 'Top 10' collection?",
            answer: "Our exclusive 'Top 10' is a dynamically updated list of the highest-rated dining destinations based on verified guest reviews and culinary excellence."
        }
    ];

    const filteredFaqs = faqs.filter(f =>
        f.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.answer.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-zinc-950 pt-32 pb-20">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-amber-500/10 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6"
                    >
                        <HelpCircle className="text-amber-500" size={32} />
                    </motion.div>
                    <h1 className="text-5xl font-serif text-white mb-6">How can we assist you?</h1>
                    <p className="text-zinc-400 font-light mb-12">Everything you need to know about the Reserve experience.</p>

                    <div className="relative group max-w-xl mx-auto">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-amber-500 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Search for answers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-white focus:outline-none focus:border-amber-500/30 transition-all placeholder:text-zinc-700"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    {filteredFaqs.map((faq, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-zinc-900/30 border border-white/5 rounded-2xl overflow-hidden"
                        >
                            <button
                                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                                className="w-full px-8 py-6 flex items-center justify-between text-left transition-colors"
                            >
                                <span className="text-white font-medium pr-8">{faq.question}</span>
                                {openIdx === idx ? <Minus size={18} className="text-amber-500" /> : <Plus size={18} className="text-zinc-600" />}
                            </button>
                            <AnimatePresence>
                                {openIdx === idx && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="px-8 pb-6 text-zinc-500 font-light leading-relaxed"
                                    >
                                        {faq.answer}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>

                {filteredFaqs.length === 0 && (
                    <div className="text-center py-20">
                        <p className="text-zinc-600 italic">No results found for "{searchTerm}". Please try a different query.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FAQPage;
