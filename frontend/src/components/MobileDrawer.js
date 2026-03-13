import React from 'react';

// Full-screen mobile drawer - uses CSS to show/hide (100% reliable on iOS)
// Shows on mobile (<=768px), hidden on desktop via CSS class
const MobileDrawer = ({ isOpen, onClose, title, children, footerButtons }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Mobile: full-screen page (shown via CSS on <=768px) */}
      <div className="mobile-drawer-root" style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'white', zIndex: 99999,
        flexDirection: 'column',
        fontFamily: 'inherit', direction: 'rtl',
        height: '100%',
        maxHeight: '100vh'
      }}>
        {/* Header - fixed height */}
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
              fontSize: '0.9rem', minWidth: 'auto', minHeight: 'auto',
              display: 'flex', alignItems: 'center', gap: '4px'
            }}
          >
            ← رجوع
          </button>
          <h3 style={{ margin: 0, fontSize: '1rem', flex: 1, textAlign: 'right', color: 'white' }}>{title}</h3>
        </div>

        {/* Scrollable body - iOS Safari fix: height:0 + flex:1 forces proper scroll */}
        <div style={{
          flex: 1,
          height: 0,
          overflowY: 'scroll',
          overflowX: 'hidden',
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
    </>
  );
};

export default MobileDrawer;
