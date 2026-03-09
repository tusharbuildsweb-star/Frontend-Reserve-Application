import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, ChevronDown, Check, Star, X } from 'lucide-react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { searchRestaurants, fetchRestaurants, fetchFilters } from '../../app/features/restaurantSlice';
import RestaurantCard from '../../components/cards/RestaurantCard';
import { io } from 'socket.io-client';

/* â”€â”€ Reusable luxury checkbox â”€â”€ */
const LuxuryCheckbox = ({ checked, onChange, label }) => (
  <label className="flex items-center gap-3 group cursor-pointer py-2">
    <div className="relative flex items-center flex-shrink-0">
      <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
      <div
        className="w-4 h-4 flex items-center justify-center transition-all duration-300"
        style={{
          border: checked ? '1px solid #F5B942' : '1px solid rgba(255,255,255,0.15)',
          background: checked ? '#F5B942' : 'transparent',
        }}
      >
        {checked && <Check size={9} style={{ color: '#050505', strokeWidth: 3 }} />}
      </div>
    </div>
    <span
      className="text-xs font-light transition-colors duration-200"
      style={{ color: checked ? '#F5F5F5' : '#A1A1A1' }}
    >
      {label}
    </span>
  </label>
);

/* â”€â”€ Collapsible filter section â”€â”€ */
const FilterSection = ({ title, children }) => {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ borderBottom: '1px solid #1F1F1F' }}>
      <button
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between py-4 text-left transition-colors hover:text-[#F5B942]"
        style={{ color: open ? '#F5F5F5' : '#A1A1A1' }}
      >
        <span className="text-[10px] uppercase tracking-[0.2em] font-semibold">{title}</span>
        <ChevronDown
          size={12}
          style={{ transition: 'transform 0.3s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', color: '#A1A1A1' }}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden pb-4"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ListingPage = () => {
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const dispatch = useDispatch();
    const { list, filters, loading } = useSelector((state) => state.restaurants);

    const [searchStr, setSearchStr] = useState(searchParams.get('search') || '');
    const [selectedCuisines, setSelectedCuisines] = useState(searchParams.get('cuisine') ? searchParams.get('cuisine').split(',') : []);
    const [selectedLocations, setSelectedLocations] = useState(searchParams.get('location') ? searchParams.get('location').split(',') : []);
    const [selectedFeatures, setSelectedFeatures] = useState(searchParams.get('features') ? searchParams.get('features').split(',') : []);
    const [selectedAmbience, setSelectedAmbience] = useState(searchParams.get('ambience') ? searchParams.get('ambience').split(',') : []);
    const [minRating, setMinRating] = useState(searchParams.get('rating') || '');
    const [hasPkg, setHasPkg] = useState(searchParams.get('packages') === 'true');
    const [sortOption, setSortOption] = useState(searchParams.get('sort') || '');
    const [activeFilter, setActiveFilter] = useState(searchParams.get('filter') || '');

    useEffect(() => { dispatch(fetchFilters()); }, [dispatch]);

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const searchArgs = Object.fromEntries(queryParams.entries());
        if (Object.keys(searchArgs).length > 0) {
            dispatch(searchRestaurants(searchArgs));
        } else {
            dispatch(fetchRestaurants());
        }
    }, [location.search, dispatch]);

    const handleApplyFilters = () => {
        const params = new URLSearchParams();
        if (searchStr) params.set('search', searchStr);
        if (selectedCuisines.length > 0) params.set('cuisine', selectedCuisines.join(','));
        if (selectedLocations.length > 0) params.set('location', selectedLocations.join(','));
        if (selectedFeatures.length > 0) params.set('features', selectedFeatures.join(','));
        if (selectedAmbience.length > 0) params.set('ambience', selectedAmbience.join(','));
        if (minRating) params.set('rating', minRating);
        if (hasPkg) params.set('packages', 'true');
        if (sortOption) params.set('sort', sortOption);
        if (activeFilter) params.set('filter', activeFilter);
        setSearchParams(params);
        if (window.innerWidth < 1024) setIsFilterOpen(false);
    };

    const handleClearFilters = () => {
        setSearchStr(''); setSelectedCuisines([]); setSelectedLocations([]);
        setSelectedFeatures([]); setSelectedAmbience([]); setMinRating('');
        setHasPkg(false); setSortOption(''); setActiveFilter('');
        setSearchParams({});
    };

    const toggleCuisine  = (c) => setSelectedCuisines(p => p.includes(c) ? p.filter(i => i !== c) : [...p, c]);
    const toggleLocation = (l) => setSelectedLocations(p => p.includes(l) ? p.filter(i => i !== l) : [...p, l]);
    const toggleFeature  = (f) => setSelectedFeatures(p => p.includes(f) ? p.filter(i => i !== f) : [...p, f]);
    const toggleAmbience = (a) => setSelectedAmbience(p => p.includes(a) ? p.filter(i => i !== a) : [...p, a]);

    const handleSortChange = (e) => {
        const val = e.target.value;
        setSortOption(val);
        const params = new URLSearchParams(searchParams);
        if (val) params.set('sort', val); else params.delete('sort');
        setSearchParams(params);
    };

    useEffect(() => {
        const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');
        socket.on('dataUpdated', (payload) => {
            if (payload?.type === 'restaurantApproved' || payload?.type === 'restaurantDeleted') dispatch(fetchRestaurants());
        });
        socket.on('restaurantUpdated', () => dispatch(fetchRestaurants()));
        socket.on('restaurantRatingUpdated', () => dispatch(fetchRestaurants()));
        return () => socket.disconnect();
    }, [dispatch]);

    const activeFilterCount = [
        selectedCuisines.length > 0, selectedLocations.length > 0,
        selectedFeatures.length > 0, selectedAmbience.length > 0,
        !!minRating, hasPkg, !!activeFilter, !!searchStr,
    ].filter(Boolean).length;

    return (
        <div className="min-h-screen pt-28 pb-20" style={{ background: '#050505' }}>
            <div className="max-w-7xl mx-auto px-6 lg:px-8">

                {/* â”€â”€ Page header â”€â”€ */}
                <motion.div
                    className="mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                >
                    <p className="text-[10px] uppercase tracking-[0.4em] font-medium mb-4" style={{ color: '#F5B942' }}>
                        Curated Collection
                    </p>
                    <h1 className="font-serif text-[#F5F5F5] leading-tight mb-4" style={{ fontSize: 'clamp(32px,4.5vw,56px)', fontWeight: 500 }}>
                        Discover Exceptional Dining
                    </h1>
                    <p className="font-light max-w-xl leading-relaxed" style={{ color: '#A1A1A1', fontSize: '0.95rem' }}>
                        Explore our handpicked selection of the world's finest culinary destinations.
                    </p>
                </motion.div>

                {/* â”€â”€ Mobile filter toggle â”€â”€ */}
                <button
                    onClick={() => setIsFilterOpen(p => !p)}
                    className="lg:hidden w-full flex items-center justify-between px-5 py-4 mb-6 transition-colors"
                    style={{
                        background: '#0B0B0B',
                        border: '1px solid #1F1F1F',
                        color: '#F5F5F5',
                    }}
                >
                    <span className="flex items-center gap-2.5 text-xs uppercase tracking-[0.16em] font-medium">
                        <SlidersHorizontal size={14} style={{ color: '#F5B942' }} />
                        Filters {activeFilterCount > 0 && <span className="ml-1 px-1.5 py-0.5 text-[9px] font-bold" style={{ background: '#F5B942', color: '#050505' }}>{activeFilterCount}</span>}
                    </span>
                    <ChevronDown
                        size={14}
                        style={{ color: '#A1A1A1', transition: 'transform 0.3s', transform: isFilterOpen ? 'rotate(180deg)' : 'none' }}
                    />
                </button>

                <div className="flex flex-col lg:flex-row gap-10">

                    {/* â•â•â•â•â•â• FILTER SIDEBAR â•â•â•â•â•â• */}
                    <AnimatePresence>
                        {(isFilterOpen || true) && (
                            <aside
                                className={`w-full lg:w-64 xl:w-72 flex-shrink-0 ${isFilterOpen ? 'block' : 'hidden lg:block'}`}
                            >
                                <div
                                    className="sticky top-28 flex flex-col custom-scrollbar overflow-y-auto"
                                    style={{
                                        maxHeight: 'calc(100vh - 8rem)',
                                        background: '#0B0B0B',
                                        border: '1px solid #1F1F1F',
                                    }}
                                >
                                    {/* Sidebar header */}
                                    <div
                                        className="flex items-center justify-between px-6 py-5 flex-shrink-0"
                                        style={{ borderBottom: '1px solid #1F1F1F' }}
                                    >
                                        <span className="text-xs uppercase tracking-[0.2em] font-semibold flex items-center gap-2.5" style={{ color: '#F5F5F5' }}>
                                            <SlidersHorizontal size={13} style={{ color: '#F5B942' }} />
                                            Refine
                                        </span>
                                        {activeFilterCount > 0 && (
                                            <button
                                                onClick={handleClearFilters}
                                                className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-medium transition-colors hover:text-[#F5B942]"
                                                style={{ color: '#A1A1A1' }}
                                            >
                                                <X size={10} /> Clear all
                                            </button>
                                        )}
                                    </div>

                                    {/* Search */}
                                    <div className="px-6 py-5" style={{ borderBottom: '1px solid #1F1F1F' }}>
                                        <div className="flex items-center gap-3 px-4 py-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #1F1F1F' }}>
                                            <Search size={13} style={{ color: '#A1A1A1', flexShrink: 0 }} />
                                            <input
                                                type="text"
                                                placeholder="Search venues..."
                                                value={searchStr}
                                                onChange={(e) => setSearchStr(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                                                className="flex-1 bg-transparent outline-none text-xs font-light placeholder:text-[#3a3a3a]"
                                                style={{ color: '#F5F5F5' }}
                                            />
                                        </div>
                                    </div>

                                    {/* Filter sections */}
                                    <div className="px-6 flex-1 overflow-y-auto custom-scrollbar">

                                        {/* Cuisine */}
                                        {filters.cuisines?.length > 0 && (
                                            <FilterSection title="Cuisine">
                                                <div className="max-h-44 overflow-y-auto custom-scrollbar">
                                                    {filters.cuisines.map(c => (
                                                        <LuxuryCheckbox key={c} label={c} checked={selectedCuisines.includes(c)} onChange={() => toggleCuisine(c)} />
                                                    ))}
                                                </div>
                                            </FilterSection>
                                        )}

                                        {/* Location */}
                                        {filters.locations?.length > 0 && (
                                            <FilterSection title="Location">
                                                <div className="max-h-44 overflow-y-auto custom-scrollbar">
                                                    {filters.locations.map(l => (
                                                        <LuxuryCheckbox key={l} label={l} checked={selectedLocations.includes(l)} onChange={() => toggleLocation(l)} />
                                                    ))}
                                                </div>
                                            </FilterSection>
                                        )}

                                        {/* Rating */}
                                        <FilterSection title="Min. Rating">
                                            <div className="grid grid-cols-2 gap-2">
                                                {[5, 4, 3, 2].map(r => (
                                                    <button
                                                        key={r}
                                                        onClick={() => setMinRating(p => p === r.toString() ? '' : r.toString())}
                                                        className="flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-medium transition-all duration-300"
                                                        style={{
                                                            border: minRating === r.toString() ? '1px solid #F5B942' : '1px solid #1F1F1F',
                                                            background: minRating === r.toString() ? 'rgba(245,185,66,0.08)' : 'transparent',
                                                            color: minRating === r.toString() ? '#F5B942' : '#A1A1A1',
                                                        }}
                                                    >
                                                        {r} <Star size={10} style={{ fill: 'currentColor' }} />
                                                    </button>
                                                ))}
                                            </div>
                                        </FilterSection>

                                        {/* Features */}
                                        {filters.features?.length > 0 && (
                                            <FilterSection title="Facilities">
                                                <div className="max-h-44 overflow-y-auto custom-scrollbar">
                                                    {filters.features.map(f => (
                                                        <LuxuryCheckbox key={f} label={f} checked={selectedFeatures.includes(f)} onChange={() => toggleFeature(f)} />
                                                    ))}
                                                </div>
                                            </FilterSection>
                                        )}

                                        {/* Ambience */}
                                        {filters.ambience?.length > 0 && (
                                            <FilterSection title="Ambiance">
                                                <div className="max-h-44 overflow-y-auto custom-scrollbar">
                                                    {filters.ambience.map(a => (
                                                        <LuxuryCheckbox key={a} label={a} checked={selectedAmbience.includes(a)} onChange={() => toggleAmbience(a)} />
                                                    ))}
                                                </div>
                                            </FilterSection>
                                        )}

                                        {/* Collections */}
                                        <FilterSection title="Collections">
                                            {[{ id: 'top10', label: 'ðŸ† Top 10 Restaurants' }, { id: 'openNow', label: 'ðŸ•“ Open Now' }].map(f => (
                                                <LuxuryCheckbox
                                                    key={f.id}
                                                    label={f.label}
                                                    checked={activeFilter === f.id}
                                                    onChange={() => setActiveFilter(p => p === f.id ? '' : f.id)}
                                                />
                                            ))}
                                        </FilterSection>

                                        {/* Experiences */}
                                        <FilterSection title="Experiences">
                                            <LuxuryCheckbox label="âœ¦ Premium Packages" checked={hasPkg} onChange={(e) => setHasPkg(e.target.checked)} />
                                        </FilterSection>

                                    </div>

                                    {/* Apply button â€” pinned bottom */}
                                    <div className="px-6 pb-6 pt-4 flex-shrink-0" style={{ borderTop: '1px solid #1F1F1F' }}>
                                        <button
                                            onClick={handleApplyFilters}
                                            className="btn-luxury w-full py-3.5"
                                            style={{ background: 'linear-gradient(135deg,#F5B942,#D4A017)' }}
                                        >
                                            Apply Filters
                                        </button>
                                    </div>
                                </div>
                            </aside>
                        )}
                    </AnimatePresence>

                    {/* â•â•â•â•â•â• MAIN GRID â•â•â•â•â•â• */}
                    <main className="flex-1 min-w-0">

                        {/* Count + sort row */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                            <div>
                                <span className="font-serif text-3xl mr-2" style={{ color: '#F5F5F5', fontWeight: 500 }}>{list?.length || 0}</span>
                                <span className="text-[11px] uppercase tracking-[0.18em] font-medium" style={{ color: '#A1A1A1' }}>
                                    matching establishments
                                </span>
                            </div>

                            <div className="relative" style={{ minWidth: 200 }}>
                                <select
                                    value={sortOption}
                                    onChange={handleSortChange}
                                    className="w-full appearance-none pl-4 pr-10 py-3 text-xs uppercase tracking-[0.12em] outline-none cursor-pointer transition-colors"
                                    style={{
                                        background: '#0B0B0B',
                                        border: '1px solid #1F1F1F',
                                        color: '#A1A1A1',
                                    }}
                                >
                                    <option value="" style={{ background: '#0B0B0B' }}>Recommended Order</option>
                                    <option value="rating_desc" style={{ background: '#0B0B0B' }}>Highest Rating</option>
                                </select>
                                <ChevronDown size={12} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#A1A1A1' }} />
                            </div>
                        </div>

                        {/* Cards grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {loading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="animate-pulse h-[440px]" style={{ background: '#121212', border: '1px solid #1F1F1F' }} />
                                ))
                            ) : list?.length > 0 ? (
                                list.map((restaurant, index) => (
                                    <motion.div
                                        key={restaurant._id}
                                        initial={{ opacity: 0, y: 24 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: Math.min(index * 0.07, 0.5) }}
                                    >
                                        <RestaurantCard restaurant={restaurant} />
                                    </motion.div>
                                ))
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="col-span-1 md:col-span-2 text-center py-24"
                                    style={{ border: '1px solid #1F1F1F', background: '#0B0B0B' }}
                                >
                                    <div className="max-w-xs mx-auto">
                                        <Search size={36} className="mx-auto mb-6" style={{ color: '#1F1F1F' }} />
                                        <h3 className="font-serif text-xl text-[#F5F5F5] mb-2" style={{ fontWeight: 500 }}>No Match Found</h3>
                                        <p className="text-sm font-light mb-8" style={{ color: '#A1A1A1' }}>
                                            Refine your filters to discover other exceptional venues.
                                        </p>
                                        <button
                                            onClick={handleClearFilters}
                                            className="btn-luxury-outline text-[10px] !px-6 !py-2.5"
                                        >
                                            View All Venues
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default ListingPage;
