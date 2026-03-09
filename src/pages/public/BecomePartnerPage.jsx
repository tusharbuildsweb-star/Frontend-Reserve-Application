import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChefHat, Building, MapPin, CheckCircle, AlertCircle, ArrowRight, User } from 'lucide-react';
import { useSelector } from 'react-redux';
import api from '../../services/api';

const BecomePartnerPage = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useSelector((state) => state.auth);

    const [status, setStatus] = useState(null); // 'idle', 'loading', 'pending', 'approved', 'rejected'
    const [statusData, setStatusData] = useState(null);
    const [formData, setFormData] = useState({
        ownerName: '',
        email: '',
        phone: '',
        restaurantName: '',
        location: '',
        cuisine: '',
        description: '',
        tables: 10,
        facilities: ''
    });
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [imageUrls, setImageUrls] = useState([]);
    const [urlInput, setUrlInput] = useState('');
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const checkApplicationStatus = async () => {
        try {
            setStatus('loading');
            const res = await api.get('owner/status');
            setStatus(res.data.status); // 'pending', 'approved', 'rejected'
            setStatusData(res.data);
        } catch (error) {
            if (error.response && error.response.status === 404) {
                setStatus('idle'); // No application found, can show form
            } else {
                setFormError('Failed to load application status.');
                setStatus('idle');
            }
        }
    };

    useEffect(() => {
        // If already owner or admin, redirect to respective dashboard
        if (user?.role === 'owner') {
            navigate('/dashboard/owner');
            return;
        }
        if (user?.role === 'admin') {
            navigate('/dashboard/admin');
            return;
        }

        if (isAuthenticated) {
            checkApplicationStatus();
        } else {
            setStatus('idle');
        }
    }, [isAuthenticated, user, navigate]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };


    const handleAddImageUrl = () => {
        const trimmed = urlInput.trim();
        if (trimmed && (trimmed.startsWith('http://') || trimmed.startsWith('https://'))) {
            setImageUrls(prev => [...prev, trimmed]);
            setUrlInput('');
        } else {
            setFormError('Please enter a valid image URL starting with http:// or https://');
        }
    };

    const handleRemoveUrl = (idx) => {
        setImageUrls(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setIsSubmitting(true);

        if (imageUrls.length === 0) {
            setFormError('Please add at least one image URL.');
            setIsSubmitting(false);
            return;
        }

        try {
            const submitData = new FormData();
            Object.keys(formData).forEach(key => {
                submitData.append(key, formData[key]);
            });

            // Send URLs as comma-separated string
            submitData.append('images', imageUrls.join(','));

            const res = await api.post('owner/apply', submitData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setStatus(res.data.status || 'pending');
            setStatusData(res.data);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            setFormError(error.response?.data?.message || 'Failed to submit application. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (status === 'loading') {
        return (
            <div className="w-full min-h-screen bg-zinc-950 flex justify-center items-center pt-20">
                <ChefHat className="w-12 h-12 text-amber-500 animate-pulse" />
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-zinc-950 pt-28 pb-16">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Informational Hero Section */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-6xl font-serif text-white mb-6">Partner with RESERVE</h1>
                    <p className="text-zinc-400 max-w-3xl mx-auto font-light leading-relaxed text-lg mb-10">
                        Join our exclusive network of premium dining experiences. Gain access to luxury clientele, utilize our world-class reservation engine, and manage your culinary empire with grace.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-5xl mx-auto">
                        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
                            <h3 className="text-white font-medium mb-2 text-lg">Why Join Us?</h3>
                            <p className="text-zinc-400 text-sm leading-relaxed">Exposure to millions of sophisticated diners worldwide. Zero upfront costs. Seamless table management and predictive analytics included.</p>
                        </div>
                        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
                            <h3 className="text-white font-medium mb-2 text-lg">Our Policies</h3>
                            <p className="text-zinc-400 text-sm leading-relaxed">Partners must maintain a 4.0+ standard rating to remain in our curated collection. All pricing must remain transparent and match in-house menus.</p>
                        </div>
                        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
                            <h3 className="text-white font-medium mb-2 text-lg">The Process</h3>
                            <p className="text-zinc-400 text-sm leading-relaxed">Submit your application below. Our curation team will review your proposal within 48 hours. Once approved, you get instant terminal access.</p>
                        </div>
                    </div>
                </div>

                {/* Status Views */}
                {status && status !== 'idle' ? (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-zinc-900 border border-white/10 rounded-2xl p-10 text-center max-w-2xl mx-auto shadow-2xl">
                        {status === 'pending' && (
                            <>
                                <div className="w-24 h-24 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle className="w-12 h-12 text-green-500" />
                                </div>
                                <h2 className="text-3xl font-serif text-white mb-6">Application Submitted Successfully 🎉</h2>
                                <div className="text-zinc-300 mb-8 font-light space-y-4 text-left mx-auto max-w-lg">
                                    <p>Thank you for applying to become a partner with RESERVE.</p>
                                    <p>Our team will carefully review your restaurant profile and verify the submitted details.</p>
                                    <p>Once approved, your Owner Dashboard login credentials will be sent to your registered email address.</p>
                                    <p>Please check your Inbox and also your Spam/Junk folder for the approval email.</p>
                                    <p>Approval usually takes 12–24 hours.</p>
                                    <p>If you do not receive any email within 24 hours, please contact support.</p>
                                </div>

                                <button
                                    onClick={() => navigate('/')}
                                    className="bg-amber-500 hover:bg-amber-400 text-black px-8 py-3 rounded-xl font-medium transition-colors w-full max-w-sm mb-8"
                                >
                                    Return to Home
                                </button>

                                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 text-left max-w-lg mx-auto">
                                    <h4 className="text-amber-500 font-medium mb-3 flex items-center">
                                        <AlertCircle size={18} className="mr-2" /> Important Notice:
                                    </h4>
                                    <ul className="list-disc list-inside text-sm text-zinc-300 space-y-2">
                                        <li>Credentials will be sent only after admin approval</li>
                                        <li>Email will contain temporary password</li>
                                        <li>You must change password after first login</li>
                                        <li>Please check Spam folder</li>
                                    </ul>
                                </div>
                            </>
                        )}
                        {status === 'approved' && (
                            <>
                                <div className="w-20 h-20 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle className="w-10 h-10 text-green-500" />
                                </div>
                                <h2 className="text-3xl font-serif text-white mb-4">Welcome to the Collection</h2>
                                <p className="text-zinc-400 mb-8 font-light">
                                    Your restaurant has been approved. You now hold Owner privileges. Please access your dashboard to configure your restaurant profile.
                                </p>
                                <button
                                    onClick={() => navigate('/dashboard/owner')}
                                    className="bg-amber-500 hover:bg-amber-400 text-black px-8 py-3 rounded-xl font-medium transition-colors inline-flex items-center"
                                >
                                    Proceed to Owner Dashboard <ArrowRight className="w-4 h-4 ml-2" />
                                </button>
                            </>
                        )}
                        {status === 'rejected' && (
                            <>
                                <div className="w-20 h-20 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <AlertCircle className="w-10 h-10 text-red-500" />
                                </div>
                                <h2 className="text-3xl font-serif text-white mb-4">Application Declined</h2>
                                <p className="text-zinc-400 mb-8 font-light">
                                    Unfortunately, your application did not meet our current curation criteria. We constantly review our portfolio and you may re-apply in the future.
                                </p>
                                <button
                                    onClick={() => setStatus('idle')} // Let them try submitting another one if they want
                                    className="border border-zinc-700 hover:bg-zinc-800 text-white px-8 py-3 rounded-xl font-medium transition-colors"
                                >
                                    Submit New Application
                                </button>
                            </>
                        )}
                    </motion.div>
                ) : (
                    /* Assessment Form */
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-zinc-900 border border-white/10 rounded-2xl p-8 md:p-12 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                        <div className="mb-10 text-center">
                            <h2 className="text-2xl font-serif text-white mb-2">Restaurant Assessment Profile</h2>
                            <p className="text-zinc-400 text-sm">Please provide accurate details; this assists our curation team.</p>
                        </div>

                        {formError && (
                            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl flex items-center">
                                <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                                <p className="text-sm">{formError}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Contact Information */}
                            <div className="border border-white/5 rounded-xl p-6 bg-black/20">
                                <h3 className="text-white font-medium mb-4 flex items-center"><User className="w-4 h-4 mr-2 text-amber-500" /> Administrative Contact</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-400 mb-2 uppercase tracking-wider text-xs">Full Name *</label>
                                        <input
                                            type="text"
                                            name="ownerName"
                                            value={formData.ownerName}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full bg-black/40 border border-zinc-800 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all placeholder-zinc-700"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-400 mb-2 uppercase tracking-wider text-xs">Email Address *</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full bg-black/40 border border-zinc-800 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all placeholder-zinc-700"
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-zinc-400 mb-2 uppercase tracking-wider text-xs">Phone Number (+91) (Optional)</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            className="w-full bg-black/40 border border-zinc-800 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all placeholder-zinc-700"
                                            placeholder="9876543210"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Restaurant Info */}
                            <div className="border border-white/5 rounded-xl p-6 bg-black/20 mt-6 !mb-6">
                                <h3 className="text-white font-medium mb-4 flex items-center"><Building className="w-4 h-4 mr-2 text-amber-500" /> Restaurant Profile</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-400 mb-2 uppercase tracking-wider text-xs">Restaurant Name *</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Building className="h-4 w-4 text-zinc-500" />
                                            </div>
                                            <input
                                                type="text"
                                                name="restaurantName"
                                                value={formData.restaurantName}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full bg-black/40 border border-zinc-800 text-white rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all placeholder-zinc-700"
                                                placeholder="The Grand Dining"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-400 mb-2 uppercase tracking-wider text-xs">Cuisine Strategy *</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <ChefHat className="h-4 w-4 text-zinc-500" />
                                            </div>
                                            <input
                                                type="text"
                                                name="cuisine"
                                                value={formData.cuisine}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full bg-black/40 border border-zinc-800 text-white rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all placeholder-zinc-700"
                                                placeholder="Modern European, Sushi..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2 uppercase tracking-wider text-xs">Core Location *</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <MapPin className="h-4 w-4 text-zinc-500" />
                                        </div>
                                        <input
                                            type="text"
                                            name="location"
                                            value={formData.location}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full bg-black/40 border border-zinc-800 text-white rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all placeholder-zinc-700"
                                            placeholder="Full address"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-400 mb-2 uppercase tracking-wider text-xs">Total Tables *</label>
                                        <input
                                            type="number"
                                            name="tables"
                                            value={formData.tables}
                                            onChange={handleInputChange}
                                            required
                                            min="1"
                                            className="w-full bg-black/40 border border-zinc-800 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-400 mb-2 uppercase tracking-wider text-xs">Key Facilities (Comma separated)</label>
                                        <input
                                            type="text"
                                            name="facilities"
                                            value={formData.facilities}
                                            onChange={handleInputChange}
                                            className="w-full bg-black/40 border border-zinc-800 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all placeholder-zinc-700"
                                            placeholder="Valet, Rooftop, Private Rooms"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2 uppercase tracking-wider text-xs">Concept Description *</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        required
                                        rows="4"
                                        className="w-full bg-black/40 border border-zinc-800 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all placeholder-zinc-700 resize-none"
                                        placeholder="Describe your restaurant's atmosphere, history, and target clientele..."
                                    ></textarea>
                                </div>

                            </div>

                            {/* Image URL Section */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider text-xs">Restaurant Images * <span className="normal-case text-zinc-600">(paste image URLs)</span></label>
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <input
                                            type="url"
                                            value={urlInput}
                                            onChange={e => setUrlInput(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddImageUrl())}
                                            placeholder="https://example.com/restaurant-image.jpg"
                                            className="flex-1 bg-black/40 border border-zinc-800 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all placeholder-zinc-700"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddImageUrl}
                                            className="bg-amber-500 hover:bg-amber-400 text-black font-medium px-5 py-3 rounded-xl text-sm transition-colors whitespace-nowrap"
                                        >
                                            + Add
                                        </button>
                                    </div>
                                    <p className="text-xs text-zinc-500">URL must start with https://. Press Enter or click Add. You can add multiple.</p>

                                    {imageUrls.length > 0 && (
                                        <div className="flex flex-wrap gap-3 mt-3">
                                            {imageUrls.map((url, idx) => (
                                                <div key={idx} className="relative group w-24 h-24">
                                                    <img
                                                        src={url}
                                                        alt={`Preview ${idx + 1}`}
                                                        className="w-full h-full object-cover rounded-lg border border-white/10"
                                                        onError={e => { e.target.src = 'https://placehold.co/96x96/1a1a1a/666?text=Error'; }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveUrl(idx)}
                                                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-white/10">
                                <label className="flex items-start text-sm text-zinc-400 cursor-pointer group">
                                    <div className="mt-1 mr-3 flex-shrink-0">
                                        <input
                                            type="checkbox"
                                            checked={agreeTerms}
                                            onChange={(e) => setAgreeTerms(e.target.checked)}
                                            className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500/50 focus:ring-offset-zinc-950 transition-all"
                                        />
                                    </div>
                                    <span className="leading-relaxed group-hover:text-zinc-300 transition-colors">
                                        I certify that the information provided is accurate. I have read and agree to the <span className="text-amber-500 underline decoration-amber-500/30">Platform Terms & Conditions</span> and <span className="text-amber-500 underline decoration-amber-500/30">Partner Privacy Policy</span>.
                                    </span>
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting || !agreeTerms}
                                className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold py-4 rounded-xl transition-all shadow-lg flex justify-center items-center mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Submitting Application...' : 'Submit Profile for Assessment'}
                            </button>
                        </form>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default BecomePartnerPage;
