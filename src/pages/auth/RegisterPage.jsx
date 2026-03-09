import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { register as registerUser, clearError } from '../../app/features/authSlice';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChefHat, Loader2, Eye, EyeOff, User, Mail, Lock } from 'lucide-react';

const RegisterPage = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error, isAuthenticated, user } = useSelector((state) => state.auth);

    const location = useLocation();
    const returnTo = location.state?.returnTo;

    useEffect(() => {
        dispatch(clearError());
        if (isAuthenticated && user) {
            // Redirect based on role
            if (user.role === 'admin') navigate('/dashboard/admin', { replace: true });
            else if (user.role === 'owner') navigate('/dashboard/owner', { replace: true });
            else navigate(returnTo || '/dashboard/user', { replace: true });
        }
    }, [isAuthenticated, user, navigate, dispatch, returnTo]);

    const handleSubmit = (e) => {
        e.preventDefault();
        dispatch(registerUser({ name, email, password }));
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full max-w-[420px] bg-[rgba(10,10,10,0.65)] backdrop-blur-[18px] border border-[rgba(255,255,255,0.06)] rounded-[18px] p-[40px] relative mx-auto group shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
            style={{
                boxShadow: "0 0 0 1px rgba(255,255,255,0.04) inset, 0 30px 80px rgba(0,0,0,0.8)"
            }}
        >
            {/* Gold Edge Light Effect on Hover */}
            <div className="absolute inset-0 rounded-[18px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ boxShadow: "0 0 12px rgba(245,185,66,0.12)" }}></div>

            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-gradient-to-br from-[#121212] to-[#050505] rounded-xl flex items-center justify-center border border-[#1F1F1F] shadow-lg transform -rotate-45">
                <ChefHat className="text-[#F5B942] w-6 h-6 rotate-45 drop-shadow-[0_0_8px_rgba(245,185,66,0.3)]" />
            </div>

            <h2 className="text-2xl font-serif text-[#F5F5F5] mt-6 mb-1 tracking-tight text-center">New Membership</h2>
            <p className="text-[#A1A1A1] text-[10px] mb-8 text-center max-w-xs mx-auto leading-relaxed uppercase tracking-widest">Join our exclusive circle</p>

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] px-4 py-3 rounded-[10px] w-full mb-6 font-medium tracking-wide text-center"
                >
                    {error}
                </motion.div>
            )}

            <form onSubmit={handleSubmit} className="w-full space-y-5 relative z-10">
                <div className="space-y-2">
                    <div className="relative group/input">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white opacity-50 transition-colors duration-300 group-focus-within/input:text-[#F5B942] group-focus-within/input:opacity-100" />
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-[rgba(12,12,12,0.9)] border border-[rgba(255,255,255,0.06)] rounded-[10px] pl-12 pr-4 py-[14px] text-white outline-none focus:border-[#F5B942] transition-all duration-300 placeholder:text-white/30 text-sm focus:shadow-[0_0_10px_rgba(245,185,66,0.35)]"
                            placeholder="John Doe"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="relative group/input">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white opacity-50 transition-colors duration-300 group-focus-within/input:text-[#F5B942] group-focus-within/input:opacity-100" />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-[rgba(12,12,12,0.9)] border border-[rgba(255,255,255,0.06)] rounded-[10px] pl-12 pr-4 py-[14px] text-white outline-none focus:border-[#F5B942] transition-all duration-300 placeholder:text-white/30 text-sm focus:shadow-[0_0_10px_rgba(245,185,66,0.35)]"
                            placeholder="Email Address"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="relative group/input">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white opacity-50 transition-colors duration-300 group-focus-within/input:text-[#F5B942] group-focus-within/input:opacity-100" />
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[rgba(12,12,12,0.9)] border border-[rgba(255,255,255,0.06)] rounded-[10px] pl-12 pr-12 py-[14px] text-white outline-none focus:border-[#F5B942] transition-all duration-300 placeholder:text-white/30 text-sm tracking-widest focus:shadow-[0_0_10px_rgba(245,185,66,0.35)]"
                            placeholder="••••••••"
                            required
                            minLength={6}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 hover:text-[#F5B942] transition-all duration-200 focus:outline-none text-white"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                <div className="px-1 pt-2 pb-1 text-center">
                    <p className="text-[10px] text-[rgba(255,255,255,0.5)] leading-relaxed uppercase tracking-wider block">
                        By registering, you agree to our
                    </p>
                    <Link to="/terms" className="text-[rgba(255,255,255,0.6)] hover:text-[#F5B942] transition-colors hover:underline decoration-[#F5B942] underline-offset-4 text-[10px] uppercase tracking-wider">Terms of Excellence</Link>
                    <span className="text-[rgba(255,255,255,0.5)] mx-1 text-[10px]">&amp;</span>
                    <Link to="/privacy" className="text-[rgba(255,255,255,0.6)] hover:text-[#F5B942] transition-colors hover:underline decoration-[#F5B942] underline-offset-4 text-[10px] uppercase tracking-wider">Privacy Protocols</Link>
                </div>

                <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading || !name || !email || !password || password.length < 6}
                    className="w-full bg-[linear-gradient(135deg,#F5B942,#D4A017)] text-[#050505] font-semibold py-[14px] rounded-[10px] transition-all hover:shadow-[0_10px_30px_rgba(245,185,66,0.35)] flex justify-center items-center text-sm tracking-[1px] disabled:opacity-50 disabled:pointer-events-none mt-4"
                >
                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Create Membership'}
                </motion.button>
            </form>

            <div className="mt-8 pt-8 border-t border-[rgba(255,255,255,0.05)] w-full flex flex-col gap-3 relative z-10 text-center">
                <p className="text-[11px] text-[rgba(255,255,255,0.6)] tracking-wide">
                    Already recognized? <Link to="/login" state={{ returnTo }} className="text-[rgba(255,255,255,0.9)] hover:text-[#F5B942] hover:underline decoration-[#F5B942] underline-offset-4 transition-colors font-medium ml-1">Sign In</Link>
                </p>
            </div>
        </motion.div>
    );
};

export default RegisterPage;
