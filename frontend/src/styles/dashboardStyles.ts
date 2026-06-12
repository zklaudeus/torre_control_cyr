import type { CSSProperties } from 'react';

// Design tokens — light theme with blue accents
const tokens = {
  primary: '#007BFF',
  primaryHover: '#0056b3',
  secondary: '#00B4D8',
  dark: '#0A192F',
  neutral: '#F8FAFC',
  bgMain: '#F1F5F9',
  bgPanel: '#FFFFFF',
  bgCard: '#FFFFFF',
  bgCardSoft: '#F8FAFC',
  bgSidebar: '#F5F3EF',
  textMain: '#1E293B',
  textMuted: '#64748B',
  textOnDark: '#F8FAFC',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  success: '#16A34A',
  warning: '#D97706',
  danger: '#DC2626',
};

export const pageStyle: CSSProperties = {
  width: '100%',
  height: '100vh',
  display: 'flex',
  background: tokens.bgMain,
  color: tokens.textMain,
  fontFamily: 'system-ui, sans-serif',
  overflow: 'hidden',
};

export const sidebarStyle: CSSProperties = {
  width: '260px',
  minWidth: '260px',
  height: '100vh',
  background: tokens.bgSidebar,
  borderRight: 'none',
  display: 'flex',
  flexDirection: 'column',
  position: 'sticky',
  top: 0,
  overflowY: 'auto',
};

export const navStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.2rem',
  padding: '0 0.5rem',
};

export const menuBtnStyle: CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#94A3B8',
  padding: '0.85rem 1rem',
  textAlign: 'left',
  width: '100%',
  cursor: 'pointer',
  fontSize: '0.9rem',
  display: 'flex',
  alignItems: 'center',
  transition: 'background 0.2s, color 0.2s',
};

export const mainContentStyle: CSSProperties = {
  flex: 1,
  width: '100%',
  minWidth: 0,
  height: '100vh',
  padding: '2rem 3rem',
  display: 'flex',
  flexDirection: 'column',
  overflowY: 'auto',
  background: tokens.bgMain,
};

export const headerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '1.5rem',
  marginBottom: '2rem',
  borderBottom: `1px solid ${tokens.border}`,
  paddingBottom: '1.5rem',
};

export const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: '1.5rem',
  maxWidth: '240px',
  lineHeight: '1.3',
  color: tokens.dark,
  fontWeight: 'bold',
};

export const actionsContainerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
};

export const dateBadgeStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  background: tokens.bgPanel,
  padding: '0.5rem 1rem',
  borderRadius: '6px',
  border: `1px solid ${tokens.border}`,
};

export const dateLabelStyle: CSSProperties = {
  fontSize: '0.7rem',
  color: tokens.textMuted,
  marginRight: '1rem',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

export const dateValueStyle: CSSProperties = {
  fontSize: '0.9rem',
  fontFamily: 'monospace',
  color: tokens.textMain,
};

export const statusBadgeStyle: CSSProperties = {
  background: 'rgba(220, 38, 38, 0.08)',
  color: tokens.danger,
  fontSize: '0.7rem',
  padding: '0.3rem 0.6rem',
  borderRadius: '4px',
  fontWeight: 'bold',
  border: `1px solid rgba(220, 38, 38, 0.15)`,
};

export const actionBtnStyle: CSSProperties = {
  padding: '0.5rem 1rem',
  borderRadius: '6px',
  color: tokens.textMain,
  fontSize: '0.85rem',
  cursor: 'pointer',
  border: `1px solid ${tokens.border}`,
  background: tokens.bgPanel,
  transition: 'background 0.2s, border-color 0.2s',
};

export const errorAlertStyle: CSSProperties = {
  background: 'rgba(220, 38, 38, 0.06)',
  color: tokens.danger,
  padding: '0.75rem',
  borderRadius: '6px',
  border: `1px solid rgba(220, 38, 38, 0.15)`,
  marginBottom: '1rem',
};

export const successAlertStyle: CSSProperties = {
  background: 'rgba(22, 163, 74, 0.06)',
  color: tokens.success,
  padding: '0.75rem',
  borderRadius: '6px',
  border: `1px solid rgba(22, 163, 74, 0.15)`,
  marginBottom: '1rem',
};

export const contentStackStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  width: '100%',
};

export const panelContainerStyle: CSSProperties = {
  width: '100%',
  background: tokens.bgPanel,
  border: `1px solid ${tokens.border}`,
  borderRadius: '8px',
  overflow: 'hidden',
};

export const accordionHeaderStyle: CSSProperties = {
  width: '100%',
  background: tokens.bgCardSoft,
  padding: '1rem',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  border: 'none',
  borderBottom: `1px solid ${tokens.border}`,
  color: tokens.textMain,
  cursor: 'pointer',
  textAlign: 'left',
};

export const accordionTitleGroupStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
};

export const accordionIconStyle: CSSProperties = {
  color: tokens.primary,
  fontSize: '1rem',
};

export const accordionTitleStyle: CSSProperties = {
  fontSize: '0.85rem',
  fontWeight: 'bold',
  letterSpacing: '1px',
  color: tokens.dark,
};

export const accordionMetaStyle: CSSProperties = {
  fontSize: '0.75rem',
  color: tokens.textMuted,
};

export const accordionBodyStyle: CSSProperties = {
  width: '100%',
  overflowX: 'auto',
  background: tokens.bgPanel,
};

export const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
};

export const tableHeadRowStyle: CSSProperties = {
  borderBottom: `2px solid ${tokens.border}`,
  fontSize: '0.75rem',
  color: tokens.textMuted,
  background: tokens.bgCardSoft,
};

export const tableBodyRowStyle: CSSProperties = {
  borderBottom: `1px solid ${tokens.borderLight}`,
};

export const thStyle: CSSProperties = {
  padding: '1rem',
  fontWeight: 600,
  textAlign: 'center',
  whiteSpace: 'nowrap',
  color: tokens.textMuted,
  textTransform: 'uppercase',
  fontSize: '0.7rem',
  letterSpacing: '0.5px',
};

export const tdStyle: CSSProperties = {
  padding: '0.75rem 1rem',
  textAlign: 'center',
  color: tokens.textMain,
  fontSize: '0.8rem',
  verticalAlign: 'middle',
  whiteSpace: 'nowrap',
};

export const inputStyle: CSSProperties = {
  width: '110px',
  padding: '0.5rem',
  textAlign: 'center',
  background: tokens.bgPanel,
  border: `1px solid ${tokens.border}`,
  borderRadius: '4px',
  color: tokens.textMain,
  fontWeight: 'bold',
};

export const okIconStyle: CSSProperties = {
  color: tokens.success,
  fontSize: '1.2rem',
};

export const warningIconStyle: CSSProperties = {
  color: tokens.warning,
  fontSize: '1.2rem',
};

export const addBtnStyle: CSSProperties = {
  background: tokens.primary,
  color: '#FFFFFF',
  border: 'none',
  padding: '0.4rem 0.8rem',
  borderRadius: '6px',
  fontWeight: 'bold',
  fontSize: '0.8rem',
  cursor: 'pointer',
  transition: 'background 0.2s',
};

export const whiteInputStyle: CSSProperties = {
  width: '50px',
  padding: '0.3rem',
  textAlign: 'center',
  background: tokens.bgPanel,
  border: `1px solid ${tokens.border}`,
  borderRadius: '4px',
  color: tokens.textMain,
  fontWeight: 'bold',
  fontSize: '0.75rem',
};

export const badgeOperativaStyle: CSSProperties = {
  background: 'rgba(22, 163, 74, 0.08)',
  color: tokens.success,
  padding: '0.2rem 0.4rem',
  borderRadius: '4px',
  fontSize: '0.65rem',
  border: `1px solid rgba(22, 163, 74, 0.2)`,
  letterSpacing: '0.5px',
  fontWeight: 600,
};

export const badgeInactivaStyle: CSSProperties = {
  background: 'rgba(217, 119, 6, 0.08)',
  color: tokens.warning,
  padding: '0.2rem 0.4rem',
  borderRadius: '4px',
  fontSize: '0.65rem',
  border: `1px solid rgba(217, 119, 6, 0.2)`,
  letterSpacing: '0.5px',
  fontWeight: 600,
};

export const darkBoxStyle: CSSProperties = {
  width: '30px',
  height: '30px',
  background: tokens.bgCardSoft,
  border: `1px solid ${tokens.border}`,
  borderRadius: '4px',
  margin: '0 auto',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: tokens.textMuted,
};

export const actionBtnSmallStyle: CSSProperties = {
  background: tokens.bgCardSoft,
  border: `1px solid ${tokens.border}`,
  color: tokens.textMain,
  padding: '0.3rem 0.5rem',
  borderRadius: '4px',
  fontSize: '0.7rem',
  cursor: 'pointer',
  transition: 'background 0.2s',
};

export const modalOverlayStyle: CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(15, 23, 42, 0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
  backdropFilter: 'blur(4px)',
};

export const modalContentStyle: CSSProperties = {
  background: tokens.bgPanel,
  padding: '2rem',
  borderRadius: '12px',
  width: '100%',
  maxWidth: '500px',
  border: `1px solid ${tokens.border}`,
  color: tokens.textMain,
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
};

export const labelStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  fontSize: '0.8rem',
  color: tokens.textMuted,
  gap: '0.3rem',
};

export const formInputStyle: CSSProperties = {
  padding: '0.5rem',
  borderRadius: '6px',
  border: `1px solid ${tokens.border}`,
  background: tokens.bgPanel,
  color: tokens.textMain,
};

export const saveBtnStyle: CSSProperties = {
  background: tokens.primary,
  color: '#FFFFFF',
  border: 'none',
  padding: '0.5rem 1rem',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: 'bold',
  transition: 'background 0.2s',
};

export const cancelBtnStyle: CSSProperties = {
  background: 'transparent',
  color: tokens.textMuted,
  border: `1px solid ${tokens.border}`,
  padding: '0.5rem 1rem',
  borderRadius: '6px',
  cursor: 'pointer',
};

export const btnPrimaryStyle: CSSProperties = {
  background: tokens.primary,
  color: '#FFFFFF',
  border: 'none',
  padding: '0.5rem 1rem',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: 'bold',
  transition: 'background 0.2s',
};

export const btnSecondaryStyle: CSSProperties = {
  background: 'transparent',
  color: tokens.primary,
  border: `1px solid ${tokens.primary}`,
  padding: '0.5rem 1rem',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: 'bold',
  transition: 'background 0.2s',
};

export const emptyStateStyle: CSSProperties = {
  padding: '3rem 1rem',
  textAlign: 'center',
  color: tokens.textMuted,
  background: tokens.bgPanel,
  borderRadius: '8px',
  border: `1px dashed ${tokens.border}`,
};

