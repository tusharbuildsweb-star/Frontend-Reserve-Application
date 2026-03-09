import React, { useState } from 'react';
import { Star, MapPin, Clock, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { toggleFavorite } from '../../app/features/authSlice';

const RestaurantCard = ({ restaurant }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isLiking, setIsLiking] = useState(false);
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const restaurantId = restaurant._id || restaurant.id;
  const isFavorite = user?.favorites?.includes(restaurantId);

  const handleFavoriteClick = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login', { state: { message: 'Please log in to save favorites' } });
      return;
    }
    if (isLiking) return;
    setIsLiking(true);
    await dispatch(toggleFavorite(restaurantId));
    setIsLiking(false);
  };

  const promotionColors = {
    'Top Homepage': { bg: '#F5B942', text: '#050505' },
    'Featured':      { bg: '#F5B942', text: '#050505' },
    'Recommended':   { bg: 'rgba(18,18,18,0.95)', text: '#F5B942', border: '#F5B942' },
  };
  const promo = promotionColors[restaurant.promotionType] || promotionColors['Featured'];

  return (
    <motion.div
      onClick={() => navigate(`/restaurants/${restaurantId}`)}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="group cursor-pointer"
      style={{
        background: '#121212',
        border: '1px solid #1F1F1F',
        transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
      }}
      whileHover="hover"
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(245,185,66,0.28)';
        e.currentTarget.style.boxShadow = '0 20px 60px rgba(245,185,66,0.07)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = '#1F1F1F';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* ── Image ── */}
      <div className="relative overflow-hidden" style={{ height: 280 }}>
        <motion.img
          variants={{ hover: { scale: 1.06 } }}
          transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
          src={restaurant.image || 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=2070&auto=format'}
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />

        {/* Gradient overlay — strong at bottom */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(18,18,18,1) 0%, rgba(18,18,18,0.45) 40%, transparent 100%)' }}
        />

        {/* Promoted badge — top left */}
        {restaurant.isPromoted && (
          <div className="absolute top-0 left-0 z-10">
            <span
              className="flex items-center gap-1.5 px-4 py-2 text-[9px] font-bold uppercase tracking-[0.16em]"
              style={{
                background: promo.bg,
                color: promo.text,
                border: promo.border ? `1px solid ${promo.border}` : 'none',
              }}
            >
              <Star size={9} style={{ fill: promo.text, color: promo.text }} />
              {restaurant.promotionType || 'Featured'}
            </span>
          </div>
        )}

        {/* Heart — top right */}
        <button
          onClick={handleFavoriteClick}
          disabled={isLiking}
          className="absolute top-4 right-4 z-10 flex items-center justify-center transition-all duration-300"
          style={{
            width: 36, height: 36,
            background: isFavorite ? 'rgba(245,185,66,0.18)' : 'rgba(5,5,5,0.65)',
            border: isFavorite ? '1px solid rgba(245,185,66,0.5)' : '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <AnimatePresence mode="wait">
            {isLiking ? (
              <motion.div
                key="spin"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                style={{ width: 14, height: 14, border: '2px solid #F5B942', borderTopColor: 'transparent', borderRadius: '50%' }}
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              />
            ) : (
              <motion.div key="heart" initial={{ scale: 0.8 }} animate={{ scale: isFavorite ? [1, 1.25, 1] : 1 }} transition={{ duration: 0.3 }}>
                <Heart
                  size={15}
                  style={{ color: isFavorite ? '#F5B942' : '#F5F5F5', fill: isFavorite ? '#F5B942' : 'transparent', transition: 'all 0.3s ease' }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* Rating — bottom right of image */}
        <div
          className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 px-2.5 py-1"
          style={{ background: 'rgba(5,5,5,0.80)', backdropFilter: 'blur(8px)', border: '1px solid #1F1F1F' }}
        >
          <Star size={10} style={{ color: '#F5B942', fill: '#F5B942' }} />
          <span className="text-xs font-medium" style={{ color: '#F5F5F5' }}>
            {Number(restaurant.rating || 0).toFixed(1)}
          </span>
          <span className="text-[10px] font-light" style={{ color: '#A1A1A1' }}>
            ({restaurant.reviewCount || 0})
          </span>
        </div>

        {/* Cuisine — bottom left of image */}
        <div className="absolute bottom-4 left-4 z-10">
          <span className="text-[10px] uppercase tracking-[0.18em] font-semibold" style={{ color: '#F5B942' }}>
            {restaurant.cuisine || 'Fine Dining'}
          </span>
        </div>

        {/* Packages badge */}
        {restaurant.hasPackages && (
          <div
            className="absolute bottom-14 left-4 z-10 flex items-center gap-1.5 px-2.5 py-1"
            style={{ background: 'rgba(245,185,66,0.14)', border: '1px solid rgba(245,185,66,0.3)' }}
          >
            <span className="text-[9px] uppercase tracking-widest font-medium" style={{ color: '#F5B942' }}>✦ Packages</span>
          </div>
        )}
      </div>

      {/* ── Card content ── */}
      <div className="p-6" style={{ borderTop: '1px solid #1F1F1F' }}>

        {/* Restaurant name */}
        <h3
          className="font-serif mb-2 leading-snug transition-colors duration-300"
          style={{ fontSize: '1.3rem', fontWeight: 500, color: '#F5F5F5' }}
        >
          <motion.span variants={{ hover: { color: '#F5B942' } }} transition={{ duration: 0.25 }}>
            {restaurant.name || 'The Golden Truffle'}
          </motion.span>
        </h3>

        {/* Location */}
        <div className="flex items-center gap-1.5 mb-5" style={{ color: '#A1A1A1' }}>
          <MapPin size={12} style={{ flexShrink: 0 }} />
          <span className="text-xs font-light">{restaurant.location || 'Mayfair, London'}</span>
        </div>

        {/* Footer row */}
        <div
          className="flex items-center justify-between pt-4"
          style={{ borderTop: '1px solid #1F1F1F' }}
        >
          <div className="flex items-center gap-1.5 text-xs font-light" style={{ color: '#A1A1A1' }}>
            <Clock size={12} style={{ flexShrink: 0 }} />
            <span>{restaurant.workingHours?.weekday || '11 AM – 11 PM'}</span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/restaurants/${restaurantId}?book=true`);
            }}
            className="text-[10px] uppercase tracking-[0.14em] font-semibold px-4 py-2 transition-all duration-300"
            style={{ color: '#F5B942', border: '1px solid rgba(245,185,66,0.35)' }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#F5B942';
              e.currentTarget.style.color = '#050505';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#F5B942';
            }}
          >
            Book Now
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default RestaurantCard;
