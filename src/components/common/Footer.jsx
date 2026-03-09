import React from 'react';
import { Link } from 'react-router-dom';

const LINKS = {
  Discover: [
    { label: 'Top 10 Restaurants',    to: '/restaurants?filter=top10' },
    { label: 'Guest Testimonials',     to: '/testimonials' },
    { label: 'Open Now',               to: '/restaurants?filter=openNow' },
  ],
  Company: [
    { label: 'About Us',  to: '/about' },
    { label: 'Contact Us', to: '/contact' },
    { label: 'FAQ',        to: '/faq' },
  ],
  Legal: [
    { label: 'Privacy Policy',  to: '/privacy' },
    { label: 'Terms of Service', to: '/terms' },
  ],
};

const Footer = () => (
  <footer style={{ background: '#050505', borderTop: '1px solid #1F1F1F' }}>

    {/* Main footer grid */}
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">

        {/* Brand */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2.5 mb-6">
            <span style={{ color: '#F5B942', fontSize: '1.1rem' }}>✦</span>
            <span className="font-serif text-[#F5F5F5] text-lg tracking-[0.22em] uppercase" style={{ fontWeight: 500 }}>
              RESERVE
            </span>
          </div>
          <p className="text-sm font-light leading-relaxed max-w-xs" style={{ color: '#A1A1A1', lineHeight: 1.8 }}>
            Defining the pinnacle of luxury dining reservations. Discover and book the world's most sought-after tables with ease.
          </p>

          {/* Thin gold divider */}
          <div className="my-8" style={{ width: 48, height: 1, background: 'linear-gradient(90deg, #F5B942, transparent)' }} />

          <p className="text-xs font-light" style={{ color: '#A1A1A1' }}>
            info@reserve.com<br />
            <span className="mt-1 block">+91 98765 43210</span>
          </p>
        </div>

        {/* Link columns */}
        {Object.entries(LINKS).slice(0, 2).map(([heading, links]) => (
          <div key={heading}>
            <h4
              className="text-[10px] uppercase tracking-[0.26em] font-semibold mb-6"
              style={{ color: '#F5B942' }}
            >
              {heading}
            </h4>
            <ul className="space-y-4">
              {links.map(l => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-xs font-light transition-colors duration-200 hover:text-[#F5F5F5]"
                    style={{ color: '#A1A1A1' }}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Newsletter / CTA */}
        <div>
          <h4 className="text-[10px] uppercase tracking-[0.26em] font-semibold mb-6" style={{ color: '#F5B942' }}>
            Partner With Us
          </h4>
          <p className="text-xs font-light mb-5 leading-relaxed" style={{ color: '#A1A1A1' }}>
            Join the Reserve network and reach thousands of discerning diners.
          </p>
          <Link
            to="/become-partner"
            className="btn-luxury-outline inline-flex !py-2.5 !px-5 !text-[9px]"
          >
            Apply Now
          </Link>
        </div>
      </div>
    </div>

    {/* Bottom bar */}
    <div
      className="max-w-7xl mx-auto px-6 lg:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4"
      style={{ borderTop: '1px solid #1F1F1F' }}
    >
      <p className="text-[10px] uppercase tracking-[0.2em] font-medium" style={{ color: '#3a3a3a' }}>
        © {new Date().getFullYear()} Reserve. All rights reserved.
      </p>
      <div className="flex items-center gap-8">
        {LINKS.Legal.map(l => (
          <Link
            key={l.to}
            to={l.to}
            className="text-[10px] uppercase tracking-[0.18em] font-medium transition-colors hover:text-[#A1A1A1]"
            style={{ color: '#3a3a3a' }}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  </footer>
);

export default Footer;
