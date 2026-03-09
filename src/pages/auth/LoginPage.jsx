import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login, sendOTP, loginWithOTP, clearError } from '../../app/features/authSlice';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Smartphone, Loader2, Eye, EyeOff } from 'lucide-react';

const LoginPage = () => {
    const [loginMode, setLoginMode] = useState('password'); // 'password' or 'otp'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error, isAuthenticated, user } = useSelector((state) => state.auth);

    const location = useLocation();
    const returnTo = location.state?.returnTo;

    useEffect(() => {
        dispatch(clearError());
        if (isAuthenticated && user) {
            if (user.role === 'admin') navigate('/dashboard/admin', { replace: true });
            else if (user.role === 'owner') navigate('/dashboard/owner', { replace: true });
            else navigate(returnTo || '/dashboard/user', { replace: true });
        }
    }, [isAuthenticated, user, navigate, dispatch, returnTo]);

    const handlePasswordLogin = (e) => {
        e.preventDefault();
        dispatch(login({ email, password }));
    };

    const handleSendOTP = async (e) => {
        e.preventDefault();
        if (!email) return;
        try {
            await dispatch(sendOTP(email)).unwrap();
            setOtpSent(true);
        } catch (err) {
            // Error is handled by slice
        }
    };

    const handleVerifyOTP = (e) => {
        e.preventDefault();
        dispatch(loginWithOTP({ email, otp }));
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full max-w-[420px] bg-[rgba(10,10,10,0.65)] backdrop-blur-[18px] border border-[rgba(255,255,255,0.06)] rounded-[18px] p-[40px] relative mx-auto group shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
            style={{
                boxShadow: "0 0 0 1px rgba(255,255,255,0.04) inset, 0 30px 80px rgba(0,0,0,0.8)"
            }}
        >
            {/* Gold Edge Light Effect on Hover */}
            <div className="absolute inset-0 rounded-[18px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ boxShadow: "0 0 12px rgba(245,185,66,0.12)" }}></div>

            {/* Mode Switcher */}
            <div className="flex bg-transparent rounded-xl mb-8 w-full border border-[rgba(255,255,255,0.05)] p-1 overflow-hidden relative">
                <button
                    onClick={() => { setLoginMode('password'); setOtpSent(false); }}
                    className={`flex-1 py-3 text-[11px] font-semibold uppercase tracking-widest rounded-[8px] transition-all duration-300 z-10 ${loginMode === 'password' ? 'bg-[rgba(245,185,66,0.1)] border border-[rgba(245,185,66,0.4)] text-[#F5B942]' : 'bg-transparent text-white opacity-60 hover:opacity-100 border border-transparent'}`}
                >
                    Password
                </button>
                <button
                    onClick={() => setLoginMode('otp')}
                    className={`flex-1 py-3 text-[11px] font-semibold uppercase tracking-widest rounded-[8px] transition-all duration-300 z-10 ${loginMode === 'otp' ? 'bg-[rgba(245,185,66,0.1)] border border-[rgba(245,185,66,0.4)] text-[#F5B942]' : 'bg-transparent text-white opacity-60 hover:opacity-100 border border-transparent'}`}
                >
                    OTP Login
                </button>
            </div>

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] px-4 py-3 rounded-[10px] w-full mb-6 font-medium tracking-wide"
                >
                    {error}
                </motion.div>
            )}

            <AnimatePresence mode="wait">
                {loginMode === 'password' ? (
                    <motion.form
                        key="password"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.3 }}
                        onSubmit={handlePasswordLogin}
                        className="w-full space-y-5 relative z-10"
                    >
                        <div className="space-y-2">
                            <div className="relative group/input">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white opacity-50 transition-colors duration-300 group-focus-within/input:text-[#F5B942] group-focus-within/input:opacity-100" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-[rgba(12,12,12,0.9)] border border-[rgba(255,255,255,0.06)] rounded-[10px] pl-12 pr-4 py-[14px] text-white outline-none focus:border-[#F5B942] transition-all duration-300 placeholder:text-white/30 text-sm focus:shadow-[0_0_10px_rgba(245,185,66,0.35)]"
                                    placeholder="Email Address"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="relative group/input">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white opacity-50 transition-colors duration-300 group-focus-within/input:text-[#F5B942] group-focus-within/input:opacity-100" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-[rgba(12,12,12,0.9)] border border-[rgba(255,255,255,0.06)] rounded-[10px] pl-12 pr-12 py-[14px] text-white outline-none focus:border-[#F5B942] transition-all duration-300 placeholder:text-white/30 text-sm tracking-widest focus:shadow-[0_0_10px_rgba(245,185,66,0.35)]"
                                    placeholder="••••••••"
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

                        <div className="flex items-center justify-end px-1 pt-1">
                            <Link to="/forgot-password" size="sm" className="text-[11px] text-[rgba(255,255,255,0.6)] hover:text-[#F5B942] hover:underline decoration-[#F5B942] underline-offset-4 transition-all duration-300">Forgot password?</Link>
                        </div>

                        <motion.button
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={loading || !email || !password}
                            className="w-full bg-[linear-gradient(135deg,#F5B942,#D4A017)] text-[#050505] font-semibold py-[14px] rounded-[10px] transition-all hover:shadow-[0_10px_30px_rgba(245,185,66,0.35)] flex justify-center items-center text-sm tracking-[1px] disabled:opacity-50 disabled:pointer-events-none mt-4"
                        >
                            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Sign In'}
                        </motion.button>
                    </motion.form>
                ) : (
                    <motion.form
                        key="otp"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.3 }}
                        onSubmit={otpSent ? handleVerifyOTP : handleSendOTP}
                        className="w-full space-y-5 relative z-10"
                    >
                        <div className="space-y-2">
                            <div className="relative group/input">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white opacity-50 transition-colors duration-300 group-focus-within/input:text-[#F5B942] group-focus-within/input:opacity-100" />
                                <input
                                    type="email"
                                    required
                                    disabled={otpSent}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-[rgba(12,12,12,0.9)] border border-[rgba(255,255,255,0.06)] rounded-[10px] pl-12 pr-4 py-[14px] text-white outline-none focus:border-[#F5B942] transition-all duration-300 placeholder:text-white/30 text-sm focus:shadow-[0_0_10px_rgba(245,185,66,0.35)] disabled:opacity-50"
                                    placeholder="Email Address"
                                />
                            </div>
                        </div>

                        {otpSent && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="space-y-2 pt-2"
                            >
                                <div className="relative group/input">
                                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white opacity-50 transition-colors duration-300 group-focus-within/input:text-[#F5B942] group-focus-within/input:opacity-100" />
                                    <input
                                        type="text"
                                        required
                                        maxLength="6"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="w-full bg-[rgba(12,12,12,0.9)] border border-[rgba(255,255,255,0.06)] rounded-[10px] pl-12 pr-4 py-[14px] text-white outline-none focus:border-[#F5B942] transition-all duration-300 placeholder:text-white/30 text-lg tracking-[0.7em] font-medium focus:shadow-[0_0_10px_rgba(245,185,66,0.35)]"
                                        placeholder="••••••"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setOtpSent(false)}
                                    className="text-[11px] text-[rgba(255,255,255,0.6)] hover:text-[#F5B942] mt-3 flex items-center justify-end w-full transition-colors underline decoration-transparent hover:decoration-[#F5B942] underline-offset-4"
                                >
                                    Change Email?
                                </button>
                            </motion.div>
                        )}

                        <motion.button
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={loading || !email || (otpSent && !otp)}
                            className="w-full bg-[linear-gradient(135deg,#F5B942,#D4A017)] text-[#050505] font-semibold py-[14px] rounded-[10px] transition-all hover:shadow-[0_10px_30px_rgba(245,185,66,0.35)] flex justify-center items-center text-sm tracking-[1px] disabled:opacity-50 disabled:pointer-events-none mt-4"
                        >
                            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (otpSent ? 'Verify' : 'Request OTP')}
                        </motion.button>
                    </motion.form>
                )}
            </AnimatePresence>

            <div className="mt-8 pt-8 border-t border-[rgba(255,255,255,0.05)] w-full flex flex-col gap-3 relative z-10">
                <p className="text-[11px] text-[rgba(255,255,255,0.6)] text-center tracking-wide">
                    New to the platform? <Link to="/register" state={{ returnTo }} className="text-[rgba(255,255,255,0.9)] hover:text-[#F5B942] hover:underline decoration-[#F5B942] underline-offset-4 transition-colors ml-1 font-medium">Register</Link>
                </p>
                <p className="text-[11px] text-[rgba(255,255,255,0.6)] text-center tracking-wide">
                    Restaurant Owner? <Link to="/become-partner" className="text-[rgba(255,255,255,0.9)] hover:text-[#F5B942] hover:underline decoration-[#F5B942] underline-offset-4 transition-colors ml-1 font-medium">Apply</Link>
                </p>
            </div>
        </motion.div>
    );
};

export default LoginPage;
