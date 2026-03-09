import React, { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, Clock, Users, ArrowRight, Star, CheckCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRestaurants } from '../../app/features/restaurantSlice';
import RestaurantCard from '../../components/cards/RestaurantCard';

/* ── Floating gold particles ── */
const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  size: Math.random() * 3 + 1.5,
  x: Math.random() * 100,
  bottom: Math.random() * 60 + 10,
  delay: Math.random() * 10,
  duration: 10 + Math.random() * 12,
}));

const Particle = ({ size, x, bottom, delay, duration }) => (
  <motion.div
    className="absolute pointer-events-none rounded-full"
    style={{
      width: size, height: size,
      left: `${x}%`, bottom: `${bottom}%`,
      background: 'radial-gradient(circle, rgba(245,185,66,0.7) 0%, transparent 70%)',
    }}
    animate={{ y: [0, -140, 0], opacity: [0, 0.55, 0], scale: [0.4, 1, 0.4] }}
    transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
  />
);

const STATS = [
  { value: '2,400+', label: 'Partner Restaurants' },
  { value: '190K+', label: 'Tables Reserved' },
  { value: '98%', label: 'Guest Satisfaction' },
  { value: '60+', label: 'Cities Covered' },
];

const WHY_ITEMS = [
  { title: 'Instant Confirmation', desc: 'Secure your table in seconds across 2,400+ carefully vetted venues.' },
  { title: 'Concierge Service', desc: 'We handle special requests, dietary requirements and surprise arrangements.' },
  { title: 'Exclusive Access', desc: 'Members gain priority access to chef tables, private events and tasting menus.' },
];

const HomePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { list, loading } = useSelector((state) => state.restaurants);

  const [searchParams, setSearchParams] = useState({ query: '', location: '', date: '', time: '', guests: '' });

  useEffect(() => { dispatch(fetchRestaurants()); }, [dispatch]);

  const featured = (list || []).slice(0, 3);

  const handleChange = (e) => setSearchParams(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = () => {
    const params = new URLSearchParams();
    if (searchParams.query) params.append('q', searchParams.query);
    if (searchParams.location) params.append('loc', searchParams.location);
    if (searchParams.date) params.append('date', searchParams.date);
    if (searchParams.time) params.append('time', searchParams.time);
    if (searchParams.guests) params.append('guests', searchParams.guests);
    navigate(`/restaurants?${params.toString()}`);
  };

  return (
    <div className="w-full flex flex-col min-h-screen" style={{ background: '#050505' }}>

      {/* ══════════════════════ HERO ══════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">

        {/* Background Video */}
        <div className="absolute inset-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="w-full h-full object-cover z-[-2]"
            style={{ willChange: 'transform' }}
          >
            <source src="https://www.pexels.com/download/video/16664748/" type="video/mp4" />
          </video>

          {/* Cinematic Overlay */}
          <div
            className="absolute inset-0 z-[-1]"
            style={{
              background: 'linear-gradient(rgba(0,0,0,0.75), rgba(0,0,0,0.55), rgba(0,0,0,0.8))'
            }}
          />

          {/* Multi-layer gradient for depth */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #050505 0%, transparent 30%, transparent 60%, #050505 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, #050505 0%, transparent 30%, transparent 70%, #050505 100%)' }} />
          {/* Central gold ambient glow */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ width: 700, height: 460, background: 'radial-gradient(ellipse, rgba(245,185,66,0.07) 0%, transparent 70%)' }}
          />
        </div>

        {/* Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {PARTICLES.map(p => <Particle key={p.id} {...p} />)}
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-32 pb-24">

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-[10px] tracking-[0.45em] uppercase font-medium mb-8" style={{ color: '#F5B942', letterSpacing: '0.45em' }}>
              Exclusive · Curated · Unforgettable
            </p>

            <h1
              className="font-serif text-[#F5F5F5] leading-[1.04] mb-8"
              style={{ fontSize: 'clamp(48px, 8vw, 92px)', fontWeight: 500, letterSpacing: '0.3px' }}
            >
              Reserve<br />
              <em style={{ color: '#F5B942', fontStyle: 'italic' }}>Extraordinary</em><br />
              Dining
            </h1>

            <p
              className="font-light max-w-lg mx-auto mb-16 leading-relaxed"
              style={{ color: '#A1A1A1', fontSize: '1.05rem' }}
            >
              Discover and secure tables at the world's most prestigious restaurants — curated for the discerning guest.
            </p>
          </motion.div>

          {/* ── Premium search bar ── */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className="w-full shadow-[0_40px_80px_rgba(0,0,0,0.7)]"
              style={{ background: 'rgba(11,11,11,0.92)', backdropFilter: 'blur(28px)', border: '1px solid #1F1F1F' }}
            >
              <div className="flex flex-col lg:flex-row">
                {/* Restaurant field */}
                <div className="flex items-center gap-3 px-6 py-5 flex-1 border-b lg:border-b-0 lg:border-r hover:bg-white/[0.025] transition-colors" style={{ borderColor: '#1F1F1F' }}>
                  <Search size={14} style={{ color: '#F5B942', flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] uppercase tracking-[0.18em] font-semibold mb-1" style={{ color: '#A1A1A1' }}>Restaurant</div>
                    <input
                      type="text" name="query" value={searchParams.query} onChange={handleChange}
                      placeholder="Cuisine or venue name"
                      className="w-full bg-transparent outline-none font-light text-sm placeholder:text-[#2e2e2e]"
                      style={{ color: '#F5F5F5' }}
                    />
                  </div>
                </div>

                {/* Location field */}
                <div className="flex items-center gap-3 px-6 py-5 flex-1 border-b lg:border-b-0 lg:border-r hover:bg-white/[0.025] transition-colors" style={{ borderColor: '#1F1F1F' }}>
                  <MapPin size={14} style={{ color: '#F5B942', flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] uppercase tracking-[0.18em] font-semibold mb-1" style={{ color: '#A1A1A1' }}>Location</div>
                    <input
                      type="text" name="location" value={searchParams.location} onChange={handleChange}
                      placeholder="City or neighbourhood"
                      className="w-full bg-transparent outline-none font-light text-sm placeholder:text-[#2e2e2e]"
                      style={{ color: '#F5F5F5' }}
                    />
                  </div>
                </div>

                {/* Date field */}
                <div className="flex items-center gap-3 px-6 py-5 border-b lg:border-b-0 lg:border-r hover:bg-white/[0.025] transition-colors" style={{ borderColor: '#1F1F1F' }}>
                  <Calendar size={14} style={{ color: '#F5B942', flexShrink: 0 }} />
                  <div>
                    <div className="text-[9px] uppercase tracking-[0.18em] font-semibold mb-1" style={{ color: '#A1A1A1' }}>Date</div>
                    <input
                      type="date" name="date" value={searchParams.date} onChange={handleChange}
                      className="bg-transparent outline-none font-light text-sm w-32"
                      style={{ color: '#F5F5F5' }}
                    />
                  </div>
                </div>

                {/* Guests field */}
                <div className="flex items-center gap-3 px-6 py-5 border-b lg:border-b-0 lg:border-r hover:bg-white/[0.025] transition-colors" style={{ borderColor: '#1F1F1F' }}>
                  <Users size={14} style={{ color: '#F5B942', flexShrink: 0 }} />
                  <div>
                    <div className="text-[9px] uppercase tracking-[0.18em] font-semibold mb-1" style={{ color: '#A1A1A1' }}>Guests</div>
                    <input
                      type="number" name="guests" min="1" value={searchParams.guests} onChange={handleChange}
                      placeholder="2"
                      className="bg-transparent outline-none font-light text-sm w-16 placeholder:text-[#2e2e2e]"
                      style={{ color: '#F5F5F5' }}
                    />
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={handleSubmit}
                  className="btn-luxury flex items-center justify-center gap-2 px-10 py-5"
                  style={{ background: 'linear-gradient(135deg, #F5B942, #D4A017)', minWidth: 160 }}
                >
                  <Search size={13} />
                  Find Table
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Scroll cue */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 pointer-events-none"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="w-px h-14" style={{ background: 'linear-gradient(to bottom, rgba(245,185,66,0.5), transparent)' }} />
        </motion.div>
      </section>

      {/* ══════════════════════ STATS STRIP ══════════════════════ */}
      <section style={{ borderTop: '1px solid #1F1F1F', borderBottom: '1px solid #1F1F1F', background: '#0B0B0B' }}>
        <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s, i) => (
            <motion.div
              key={i}
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.6 }}
            >
              <div className="font-serif mb-1.5" style={{ color: '#F5B942', fontSize: '2rem', fontWeight: 500 }}>{s.value}</div>
              <div className="text-[10px] uppercase tracking-[0.18em] font-medium" style={{ color: '#A1A1A1' }}>{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════════════════ FEATURED RESTAURANTS ══════════════════════ */}
      <section className="py-32" style={{ background: '#050505' }}>
        <div className="max-w-6xl mx-auto px-6">

          {/* Section header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-20">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <p className="text-[10px] uppercase tracking-[0.4em] font-medium mb-4" style={{ color: '#F5B942' }}>
                Curated Selection
              </p>
              <h2 className="font-serif text-[#F5F5F5] leading-tight" style={{ fontSize: 'clamp(32px,4vw,48px)', fontWeight: 500 }}>
                Exceptional Venues,<br />
                <em className="italic" style={{ color: '#D4A017' }}>Handpicked for You</em>
              </h2>
            </motion.div>

            <Link
              to="/restaurants"
              className="hidden md:flex items-center gap-3 mt-4 group transition-all"
              style={{ color: '#A1A1A1' }}
            >
              <span className="text-[10px] uppercase tracking-[0.2em] font-medium group-hover:text-[#F5B942] transition-colors">
                View All Venues
              </span>
              <div className="h-px w-8 group-hover:w-14 transition-all duration-400" style={{ background: '#A1A1A1' }} />
            </Link>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse h-[460px]" style={{ background: '#121212', border: '1px solid #1F1F1F' }} />
              ))
              : featured.length > 0
                ? featured.map((r, i) => (
                  <motion.div
                    key={r._id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.14, duration: 0.7 }}
                  >
                    <RestaurantCard restaurant={r} />
                  </motion.div>
                ))
                : <p className="text-[#A1A1A1] col-span-3 text-center py-16 text-sm">No restaurants available at the moment.</p>
            }
          </div>

          {/* Mobile view all */}
          <div className="md:hidden mt-12 text-center">
            <Link to="/restaurants" className="btn-luxury-outline inline-flex items-center gap-2">
              View All Venues <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════ WHY RESERVE ══════════════════════ */}
      <section className="py-32" style={{ background: '#0B0B0B', borderTop: '1px solid #1F1F1F', borderBottom: '1px solid #1F1F1F' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

            {/* Image collage */}
            <motion.div
              className="relative h-[480px]"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9 }}
            >
              <img
                src="https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1200&auto=format&fit=crop"
                alt="Fine dining"
                className="absolute top-0 left-0 object-cover"
                style={{ width: '73%', height: '78%' }}
              />
              <img
                src="https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?q=80&w=600&auto=format&fit=crop"
                alt="Restaurant interior"
                className="absolute bottom-0 right-0 object-cover"
                style={{ width: '52%', height: '48%', border: '4px solid #0B0B0B' }}
              />
              {/* Decorative gold square */}
              <div className="absolute" style={{ top: '76%', left: '18%', width: 56, height: 56, border: '1px solid rgba(245,185,66,0.25)' }} />
            </motion.div>

            {/* Text */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9 }}
            >
              <p className="text-[10px] uppercase tracking-[0.4em] font-medium mb-6" style={{ color: '#F5B942' }}>Why Reserve</p>
              <h2 className="font-serif text-[#F5F5F5] leading-tight mb-8" style={{ fontSize: 'clamp(28px,3.5vw,44px)', fontWeight: 500 }}>
                Beyond a Booking.<br />
                <em className="italic" style={{ color: '#D4A017' }}>A Statement.</em>
              </h2>
              <p className="font-light leading-relaxed mb-10 text-[0.95rem]" style={{ color: '#A1A1A1' }}>
                Reserve curates the world's most sought-after dining experiences — offering an elevated gateway to Michelin-star venues, private dining rooms, and bespoke culinary journeys.
              </p>

              <div className="space-y-7 mb-12">
                {WHY_ITEMS.map((item, i) => (
                  <motion.div
                    key={i}
                    className="flex items-start gap-4"
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.12, duration: 0.6 }}
                  >
                    <div
                      className="flex-shrink-0 mt-0.5 flex items-center justify-center"
                      style={{ width: 20, height: 20, border: '1px solid rgba(245,185,66,0.45)' }}
                    >
                      <div style={{ width: 6, height: 6, background: '#F5B942' }} />
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1" style={{ color: '#F5F5F5' }}>{item.title}</div>
                      <div className="text-sm font-light leading-relaxed" style={{ color: '#A1A1A1' }}>{item.desc}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <Link
                to="/restaurants"
                className="inline-flex items-center gap-4 text-[11px] uppercase tracking-[0.18em] font-medium group transition-all"
                style={{ color: '#F5B942' }}
              >
                Explore Restaurants
                <div className="h-px w-10 group-hover:w-16 transition-all duration-400" style={{ background: '#F5B942' }} />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════ CTA ══════════════════════ */}
      <section className="py-40 relative overflow-hidden" style={{ background: '#050505' }}>
        {/* Gold ambient centred glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ width: 900, height: 500, background: 'radial-gradient(ellipse, rgba(245,185,66,0.055) 0%, transparent 70%)' }}
        />
        <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9 }}
          >
            <p className="text-[10px] uppercase tracking-[0.4em] font-medium mb-6" style={{ color: '#F5B942' }}>Begin Your Journey</p>
            <h2
              className="font-serif text-[#F5F5F5] leading-tight mb-8"
              style={{ fontSize: 'clamp(32px, 4vw, 54px)', fontWeight: 500 }}
            >
              Your Table Awaits at the World's Finest Restaurants
            </h2>
            <p className="font-light mb-12 leading-relaxed" style={{ color: '#A1A1A1', fontSize: '1rem' }}>
              Join thousands of discerning guests who trust Reserve to curate their most memorable dining occasions.
            </p>
            <Link
              to="/restaurants"
              className="btn-luxury inline-flex items-center gap-3"
              style={{ background: 'linear-gradient(135deg,#F5B942,#D4A017)' }}
            >
              Reserve Your Table <ArrowRight size={13} />
            </Link>
          </motion.div>
        </div>
      </section>

    </div>
  );
};

export default HomePage;
