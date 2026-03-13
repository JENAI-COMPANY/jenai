import React, { useState, useEffect } from 'react';

// Full-screen mobile drawer - replaces modals on mobile devices
const MobileDrawer = ({ isOpen, onClose, title, children, footerButtons }) => {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  if (!isOpen) return null;
  if (!isMobile) return null; // Desktop: don't render, let original modal handle it

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'white', zIndex: 99999,
      display: 'flex', flexDirection: 'column',
      fontFamily: 'inherit', direction: 'rtl'
    }}>
      {/* Header */}
      <div style={{
        background: '#22513e', color: 'white',
        padding: '0.85rem 1rem',
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        flexShrink: 0, boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.2)', border: 'none',
            color: 'white', borderRadius: '8px',
            padding: '0.4rem 0.8rem', cursor: 'pointer',
            fontSize: '0.9rem', minWidth: 'auto', minHeight: 'auto'
          }}
        >
          ← رجوع
        </button>
        <h3 style={{ margin: 0, fontSize: '1rem', flex: 1, textAlign: 'right' }}>{title}</h3>
      </div>

      {/* Scrollable body */}
      <div style={{
        flex: 1, overflowY: 'auto', overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        padding: '1rem'
      }}>
        {children}
      </div>

      {/* Footer with action buttons */}
      {footerButtons && (
        <div style={{
          padding: '0.75rem 1rem',
          background: 'white',
          borderTop: '1px solid #e5e7eb',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          {footerButtons}
        </div>
      )}
    </div>
  );
};

export default MobileDrawer;
