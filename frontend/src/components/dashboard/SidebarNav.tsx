import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

// ─── Variables for CSS (formerly local K object) ───────────────────────────
// Using CSS variables globally defined in index.css
// var(--primary), var(--secondary), var(--bg-main), var(--bg-panel), var(--bg-panel-sec)
// var(--text-main), var(--text-muted), var(--border)

// ─── SVG icons ─────────────────────────────────────────────────────────────
const IconSun = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4"/>
    <line x1="12" y1="2" x2="12" y2="5.5"/><line x1="12" y1="18.5" x2="12" y2="22"/>
    <line x1="4.22" y1="4.22" x2="6.6" y2="6.6"/><line x1="17.4" y1="17.4" x2="19.78" y2="19.78"/>
    <line x1="2" y1="12" x2="5.5" y2="12"/><line x1="18.5" y1="12" x2="22" y2="12"/>
    <line x1="4.22" y1="19.78" x2="6.6" y2="17.4"/><line x1="17.4" y1="6.6" x2="19.78" y2="4.22"/>
  </svg>
);
const IconCalendar = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const IconMap = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
    <line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
  </svg>
);
const IconBarChart = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
);
const IconSettings = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);
const IconGauge = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a10 10 0 1 0 10 10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IconGitMerge = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/>
  </svg>
);
const IconChevron = ({ open }: { open: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round">
    <polyline points={open ? "6 15 12 9 18 15" : "6 9 12 15 18 9"}/>
  </svg>
);

// ─── Nav item config ────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { route: '/torre-control/inicio-dia',      label: 'Inicio del día',    Icon: IconSun      },
  { route: '/torre-control/dashboard-cyr',   label: 'Resumen General',   Icon: IconCalendar },
  { route: '/torre-control/resumen-zona',    label: 'Resumen por Zona',  Icon: IconMap      },
  { route: '#/reporte-gerencial',            label: 'Reporte Gerencial', Icon: IconBarChart, external: true },
  { route: '/torre-control/rendimiento-tecnico', label: 'Rendimiento Técnico', Icon: IconBarChart },
  { route: '/supervisor/bitacora',           label: 'Bitácora Supervisor', Icon: IconGitMerge },
  { route: '/torre-control/configuracion',   label: 'Configuración',     Icon: IconSettings },
];

const COMING_ITEMS = [
  { label: 'Medición', Icon: IconGauge },
  { label: 'Empalme',  Icon: IconGitMerge },
];

interface SidebarNavProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const SidebarNav = ({ isOpen = false, onClose }: SidebarNavProps) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [isOpen]);

  const handleClick = (route: string, external?: boolean) => {
    if (external) {
      window.open(`${window.location.origin}${window.location.pathname}#/reporte-gerencial`, '_blank');
      return;
    }
    navigate(route);
    if (onClose) onClose();
  };

  const navItem = (route: string): React.CSSProperties => {
    const isActive = location.pathname === route;
    return {
      display: 'flex',
      alignItems: 'center',
      gap: '0.7rem',
      padding: '0.58rem 0.875rem',
      borderRadius: '8px',
      cursor: 'pointer',
      border: 'none',
      width: '100%',
      textAlign: 'left',
      fontSize: '0.875rem',
      fontWeight: isActive ? 600 : 400,
      background: isActive
        ? `linear-gradient(90deg, rgba(0, 123, 255, 0.15) 0%, rgba(0, 123, 255, 0.05) 100%)`
        : 'transparent',
      color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
      borderLeft: isActive ? `3px solid var(--primary)` : '3px solid transparent',
      transition: 'all 0.15s',
      boxSizing: 'border-box',
    };
  };

  return (
    <>
      <style>{`
        .sidebar-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .sidebar-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .sidebar-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 4px;
        }
        .sidebar-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
        .sidebar-container {
          width: 240px;
          min-width: 240px;
          height: 100vh;
          height: 100dvh;
          background: var(--bg-panel-sec);
          display: flex;
          flex-direction: column;
          border-right: 1px solid var(--border);
          position: sticky;
          top: 0;
          overflow: hidden;
          transition: transform 0.3s ease;
          z-index: 800;
        }
        .sidebar-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.55);
          z-index: 790;
          overscroll-behavior: contain;
          touch-action: none;
        }
        .sidebar-nav-list {
          min-height: 0;
          overflow-y: auto;
          overscroll-behavior: contain;
        }
        .sidebar-footer {
          background: var(--bg-panel-sec);
          box-shadow: 0 -12px 24px rgba(15, 23, 42, 0.06);
        }
        @media (max-width: 768px) {
          .sidebar-container {
            position: fixed;
            left: 0;
            width: min(86vw, 300px);
            min-width: 0;
            transform: translateX(-100%);
            box-shadow: 18px 0 40px rgba(15, 23, 42, 0.28);
          }
          .sidebar-container.open {
            transform: translateX(0);
          }
          .sidebar-overlay.open {
            display: block;
          }
        }
      `}</style>
      
    <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />
    <aside className={`sidebar-scrollbar sidebar-container ${isOpen ? 'open' : ''}`}>

      {/* ── Header ── */}
      <div style={{
        padding: '1.25rem 1.25rem 1rem',
        borderBottom: `1px solid var(--border)`,
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Cyan accent dot */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: 'var(--secondary)',
              boxShadow: `0 0 8px var(--secondary)`,
              display: 'inline-block',
            }} />
            <span style={{ fontSize: '0.65rem', color: 'var(--secondary)', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 600 }}>
              EISESA
            </span>
          </div>
          {onClose && (
            <button className="mobile-close-btn" onClick={onClose} style={{
              background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '0.2rem'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>
        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.2 }}>
          Torre Control CyR
        </div>
      </div>

      {/* ── Nav ── */}
      <nav className="sidebar-nav-list" style={{ flex: 1, padding: '0.75rem 0.625rem', display: 'flex', flexDirection: 'column', gap: '0' }}>

        {/* CyR group header */}
        <button
          type="button"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0.5rem 0.875rem',
            border: 'none', background: 'transparent', width: '100%', cursor: 'pointer',
            color: 'var(--text-muted)',
            fontSize: '0.7rem', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase',
            marginBottom: '0.25rem',
          }}
        >
          <span>CyR</span>
          <IconChevron open={true} />
        </button>

        {NAV_ITEMS
          .filter(item => {
            if (user?.rol === 'supervisor') return item.route === '/supervisor/bitacora' || item.route === '/torre-control/rendimiento-tecnico';
            if (user?.rol === 'torre_control') return item.route === '/torre-control/dashboard-cyr' || item.route === '/torre-control/resumen-zona' || item.route === '/torre-control/rendimiento-tecnico';
            if (user?.rol === 'gerencia') return item.route === '/torre-control/dashboard-cyr' || item.route === '/torre-control/resumen-zona' || item.route === '#/reporte-gerencial' || item.route === '/torre-control/rendimiento-tecnico';
            return true;
          })
          .map(({ route, label, Icon, external }) => (
          <button
            key={route}
            type="button"
            style={navItem(route)}
            onClick={() => handleClick(route, external)}
          >
            <span style={{
              color: location.pathname === route ? 'var(--primary)' : 'var(--text-muted)',
              display: 'flex', alignItems: 'center',
            }}>
              <Icon />
            </span>
            <span>{label}</span>
            {/* Cyan glow dot for active */}
            {location.pathname === route && (
              <span style={{
                marginLeft: 'auto',
                width: '5px', height: '5px', borderRadius: '50%',
                background: 'var(--primary)',
                boxShadow: `0 0 6px var(--primary)`,
              }} />
            )}
          </button>
        ))}
      </nav>

      {/* ── Coming soon ── */}
      {user?.rol !== 'supervisor' && (
      <div style={{
        padding: '0.5rem 0.625rem 1rem',
        borderTop: `1px solid var(--border)`,
        display: 'flex', flexDirection: 'column', gap: '0',
      }}>
        <div style={{
          fontSize: '0.65rem', color: 'var(--text-muted)',
          padding: '0.3rem 0.875rem', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600,
          marginBottom: '0.2rem',
        }}>
          Próximamente
        </div>
        {COMING_ITEMS.map(({ label, Icon }) => (
          <button
            key={label}
            type="button"
            disabled
            style={{
              display: 'flex', alignItems: 'center', gap: '0.7rem',
              padding: '0.58rem 0.875rem',
              borderRadius: '8px', border: 'none',
              width: '100%', textAlign: 'left',
              fontSize: '0.875rem',
              background: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'not-allowed',
              borderLeft: '3px solid transparent',
            }}
          >
            <Icon />
            <span>{label}</span>
            <span style={{
              marginLeft: 'auto',
              fontSize: '0.6rem',
              background: 'rgba(0,0,0,0.2)',
              color: 'var(--secondary)',
              padding: '2px 8px',
              borderRadius: '20px',
              fontWeight: 600,
              letterSpacing: '0.5px',
              border: `1px solid rgba(0, 229, 255, 0.2)`,
            }}>Beta</span>
          </button>
        ))}
      </div>
      )}

      {/* ── Footer / User ── */}
      <div className="sidebar-footer" style={{
        marginTop: 'auto',
        padding: '1rem 1rem calc(1rem + env(safe-area-inset-bottom))',
        borderTop: `1px solid var(--border)`,
        flexShrink: 0,
      }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 600, marginBottom: '0.5rem' }}>
          {user?.nombre || 'Administrador'}
        </div>
        {user?.zonasAsignadas && (
          <div style={{ fontSize: '0.7rem', color: 'var(--secondary)', marginBottom: '0.5rem', lineHeight: 1.3 }}>
            Zonas: {user.zonasAsignadas.join(', ')}
          </div>
        )}
        <button
          onClick={logout}
          style={{
            width: '100%', padding: '0.5rem', background: 'transparent', color: 'var(--text-muted)',
            border: `1px solid var(--border)`, borderRadius: '6px', fontSize: '0.8rem',
            cursor: 'pointer', transition: 'all 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-main)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          Cerrar Sesión
        </button>
      </div>

    </aside>
    </>
  );
};
