import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, ChevronDown, Shield, Settings } from 'lucide-react';
import { io } from 'socket.io-client';
import { fetchNotifications, receiveNotification } from '../../app/features/notificationSlice';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../app/features/authSlice';
import NotificationBell from './NotificationBell';

const Navbar = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isAuthenticated } = useSelector(state => state.auth);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    const dashboardPath = useMemo(() => {
        if (!user) return '/login';
        if (user.role === 'admin') return '/dashboard/admin';
        if (user.role === 'owner') return '/dashboard/owner';
        return '/dashboard/user';
    }, [user]);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            dispatch(fetchNotifications());
            const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', { withCredentials: true });
            socket.on('connect', () => {
                if (user?._id) socket.emit('joinUser', user._id);
                if (user?.role === 'admin') socket.emit('joinAdmin');
            });
            socket.on('notification', (data) => dispatch(receiveNotification(data)));
            return () => socket.disconnect();
        }
    }, [isAuthenticated, user?._id, dispatch]);

    const handleLogout = () => { dispatch(logout()); navigate('/'); };

    const isHidden = (path) => {
        const restrictedForRoles = ['admin', 'owner'];
        const restrictedPaths = ['/', '/restaurants'];
        return isAuthenticated && restrictedForRoles.includes(user?.role) && restrictedPaths.includes(path);
    };

    /* ─── Desktop nav link ─── */
    const NavLink = ({ to, children }) => {
        const active = location.pathname === to;
        return (
            <button
                onClick={() => navigate(to)}
                className="relative px-5 py-2 group"
            >
                <span
                    className="text-[11px] uppercase tracking-[0.14em] font-medium transition-colors duration-300"
                    style={{ color: active ? '#F5B942' : '#A1A1A1' }}
                >
                    {children}
                </span>
                {/* Animated underline */}
                <span
                    className="absolute bottom-0 left-5 right-5 h-px transition-all duration-400 origin-left"
                    style={{
                        background: '#F5B942',
                        opacity: active ? 1 : 0,
                        transform: active ? 'scaleX(1)' : 'scaleX(0)',
                    }}
                />
                <span
                    className="absolute bottom-0 left-5 right-5 h-px bg-[#F5B942] opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100 transition-all duration-300 origin-left"
                    style={{ display: active ? 'none' : undefined }}
                />
            </button>
        );
    };

    const navLinks = [
        { label: 'Home', path: '/' },
        { label: 'Restaurants', path: '/restaurants' },
        { label: 'Testimonials', path: '/testimonials' },
        ...(isAuthenticated ? [{ label: 'Dashboard', path: dashboardPath }] : []),
    ].filter(l => !isHidden(l.path));

    return (
        <nav
            className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
            style={{
                background: scrolled ? 'rgba(5,5,5,0.96)' : 'transparent',
                backdropFilter: scrolled ? 'blur(24px)' : 'none',
                borderBottom: scrolled ? '1px solid #1F1F1F' : '1px solid transparent',
            }}
        >
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">

                    {/* ── Logo ── */}
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2.5 group"
                    >
                        <img
                            src="/reserve-logo.svg"
                            alt="Reserve Logo"
                            className="w-8 h-8 object-contain transition-transform duration-300 group-hover:scale-110"
                        />
                        <span
                            className="font-serif text-[#F5F5F5] text-lg tracking-[0.22em] uppercase"
                            style={{ fontWeight: 500, letterSpacing: '0.22em' }}
                        >
                            RESERVE
                        </span>
                    </button>

                    {/* ── Desktop nav ── */}
                    <div className="hidden md:flex items-center">
                        {navLinks.map(l => <NavLink key={l.path} to={l.path}>{l.label}</NavLink>)}
                    </div>

                    {/* ── Right actions ── */}
                    <div className="flex items-center gap-3">
                        {/* Partner link — guests + users only */}
                        {(!isAuthenticated || user?.role === 'user') && (
                            <button
                                onClick={() => navigate('/become-partner')}
                                className="hidden md:inline-flex btn-luxury-outline !py-2 !px-5 !text-[10px]"
                            >
                                Partner With Us
                            </button>
                        )}

                        {isAuthenticated ? (
                            <div className="flex items-center gap-2">
                                <NotificationBell />

                                {/* Profile pill */}
                                <div className="relative">
                                    <button
                                        onClick={() => setProfileOpen(p => !p)}
                                        className="flex items-center gap-2.5 px-3 py-2 border border-[#1F1F1F] hover:border-[#F5B942]/30 transition-all duration-300"
                                        style={{ background: 'rgba(18,18,18,0.8)' }}
                                    >
                                        <div
                                            className="w-6 h-6 flex items-center justify-center text-[#050505] text-xs font-bold"
                                            style={{ background: 'linear-gradient(135deg,#F5B942,#D4A017)' }}
                                        >
                                            {user?.name?.[0]?.toUpperCase() || 'U'}
                                        </div>
                                        <span className="hidden sm:block text-[11px] text-[#F5F5F5] tracking-wide max-w-[90px] truncate">
                                            {user?.name?.split(' ')[0]}
                                        </span>
                                        <ChevronDown
                                            size={12}
                                            className="text-[#A1A1A1] transition-transform duration-300"
                                            style={{ transform: profileOpen ? 'rotate(180deg)' : 'none' }}
                                        />
                                    </button>

                                    <AnimatePresence>
                                        {profileOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                                                transition={{ duration: 0.18 }}
                                                className="absolute right-0 top-full mt-2 w-52 overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.5)]"
                                                style={{ background: '#0B0B0B', border: '1px solid #1F1F1F' }}
                                            >
                                                {/* User info */}
                                                <div className="px-5 py-4 border-b border-[#1F1F1F]">
                                                    <p className="text-[#F5F5F5] text-xs font-medium truncate">{user?.name}</p>
                                                    <p className="text-[#A1A1A1] text-[10px] truncate mt-0.5">{user?.email}</p>
                                                </div>

                                                {[
                                                    { icon: User, label: 'My Dashboard', action: () => { navigate(dashboardPath); setProfileOpen(false); } },
                                                    ...(user?.role === 'admin' ? [{ icon: Shield, label: 'Admin Panel', action: () => { navigate('/dashboard/admin'); setProfileOpen(false); } }] : []),
                                                    { icon: Settings, label: 'Notifications', action: () => { navigate('/notifications'); setProfileOpen(false); } },
                                                ].map(({ icon: Icon, label, action }) => (
                                                    <button
                                                        key={label}
                                                        onClick={action}
                                                        className="w-full flex items-center gap-3 px-5 py-3.5 text-[11px] text-[#A1A1A1] hover:text-[#F5B942] transition-colors duration-200 tracking-wide"
                                                    >
                                                        <Icon size={13} className="text-[#F5B942]" />
                                                        {label}
                                                    </button>
                                                ))}

                                                <div className="border-t border-[#1F1F1F]">
                                                    <button
                                                        onClick={handleLogout}
                                                        className="w-full flex items-center gap-3 px-5 py-3.5 text-[11px] text-red-400/80 hover:text-red-400 transition-colors duration-200 tracking-wide"
                                                    >
                                                        <LogOut size={13} />
                                                        Sign Out
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        ) : (
                            <div className="hidden md:flex items-center gap-1">
                                <button
                                    onClick={() => navigate('/login')}
                                    className="px-5 py-2 text-[11px] uppercase tracking-[0.12em] text-[#A1A1A1] hover:text-[#F5F5F5] transition-colors font-medium"
                                >
                                    Sign In
                                </button>
                                <button
                                    onClick={() => navigate('/register')}
                                    className="btn-luxury !py-2 !px-5 !text-[10px]"
                                >
                                    Join Now
                                </button>
                            </div>
                        )}

                        {/* Mobile hamburger */}
                        <button
                            onClick={() => setMobileOpen(p => !p)}
                            className="md:hidden p-2 text-[#A1A1A1] hover:text-[#F5F5F5] transition-colors"
                        >
                            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>

                {/* ── Mobile Menu ── */}
                <AnimatePresence>
                    {mobileOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="md:hidden overflow-hidden border-t border-[#1F1F1F]"
                            style={{ background: 'rgba(5,5,5,0.98)' }}
                        >
                            <div className="py-6 space-y-1 px-2">
                                {navLinks.map(item => (
                                    <button
                                        key={item.path}
                                        onClick={() => { navigate(item.path); setMobileOpen(false); }}
                                        className="w-full text-left px-4 py-3 text-[11px] uppercase tracking-[0.14em] font-medium text-[#A1A1A1] hover:text-[#F5B942] transition-colors"
                                    >
                                        {item.label}
                                    </button>
                                ))}
                                {(!isAuthenticated || user?.role === 'user') && (
                                    <button
                                        onClick={() => { navigate('/become-partner'); setMobileOpen(false); }}
                                        className="w-full text-left px-4 py-3 text-[11px] uppercase tracking-[0.14em] font-medium text-[#A1A1A1] hover:text-[#F5B942] transition-colors"
                                    >
                                        Partner With Us
                                    </button>
                                )}
                                <div className="pt-4 mt-4 border-t border-[#1F1F1F] flex flex-col gap-2">
                                    {isAuthenticated ? (
                                        <button
                                            onClick={() => { handleLogout(); setMobileOpen(false); }}
                                            className="w-full text-left px-4 py-3 text-[11px] uppercase tracking-widest text-red-400/80 hover:text-red-400 transition-colors"
                                        >
                                            Sign Out
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => { navigate('/login'); setMobileOpen(false); }}
                                                className="w-full text-center py-3 text-[11px] uppercase tracking-widest text-[#A1A1A1] border border-[#1F1F1F] hover:border-[#F5B942]/30 hover:text-[#F5F5F5] transition-all"
                                            >
                                                Sign In
                                            </button>
                                            <button
                                                onClick={() => { navigate('/register'); setMobileOpen(false); }}
                                                className="btn-luxury w-full"
                                            >
                                                Join Now
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </nav>
    );
};

export default Navbar;
