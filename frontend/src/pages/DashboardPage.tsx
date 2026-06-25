import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarNav } from '../components/dashboard/SidebarNav';

export const DashboardPage = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
      {/* Mobile Hamburger Button */}
      <button 
        className="mobile-menu-btn"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        style={{
          display: 'none', // Overridden in CSS
          position: 'fixed',
          top: '1rem',
          left: '1rem',
          zIndex: 760,
          background: 'var(--bg-panel-sec)',
          border: '1px solid var(--border)',
          color: 'var(--text-main)',
          padding: '0.5rem',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>

      <SidebarNav isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      
      <div className="dashboard-content-area" style={{ flex: 1, padding: '2rem', minWidth: 0 }}>
        <Outlet />
      </div>

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn {
            display: block !important;
          }
          .dashboard-content-area {
            padding: 4rem 1rem 1rem 1rem !important;
          }
        }
      `}</style>
    </div>
  );
};
