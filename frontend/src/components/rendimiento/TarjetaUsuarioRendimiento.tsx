import React from 'react';

export type TarjetaUsuarioRendimientoProps = {
  usuarioSap?: string | null;
  codigoSap?: string | null;
  brigada?: string | null;
  pareja?: string | null;
  zona?: string | null;
  patente?: string | null;
  fechaOperacional?: string | null;
  tipoBrigada?: string | null;
  productividad?: string | null;
  estadoRendimiento?: string | null;
  supervisorResponsable?: string | null;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const ESTADO_CONFIG: Record<string, { bg: string; color: string; dot: string }> = {
  'Crítico':         { bg: '#FEE2E2', color: '#B91C1C', dot: '#EF4444' },
  'En recuperación': { bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B' },
  'Estable':         { bg: '#D1FAE5', color: '#065F46', dot: '#10B981' },
  'Alto desempeño':  { bg: '#DBEAFE', color: '#1E40AF', dot: '#3B82F6' },
  'Sin evaluación':  { bg: '#F1F5F9', color: '#64748B', dot: '#94A3B8' },
};

const getEstadoStyle = (estado: string) =>
  ESTADO_CONFIG[estado] ?? { bg: '#F1F5F9', color: '#64748B', dot: '#94A3B8' };

/** Genera un color de fondo para la zona basado en las primeras letras */
const zonaColor = (zona: string): string => {
  const palette = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#EF4444', '#14B8A6'];
  let hash = 0;
  for (let i = 0; i < zona.length; i++) hash = zona.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
};

const initials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

// ── Component ─────────────────────────────────────────────────────────────────

export const TarjetaUsuarioRendimiento: React.FC<TarjetaUsuarioRendimientoProps> = ({
  usuarioSap,
  codigoSap,
  brigada,
  pareja,
  zona,
  patente,
  fechaOperacional,
  tipoBrigada,
  productividad,
  estadoRendimiento,
  supervisorResponsable,
}) => {
  const displayUsuario  = usuarioSap         ? usuarioSap.trim()         : 'Usuario no identificado';
  const displayCodigo   = codigoSap          ? codigoSap.trim()          : '—';
  const displayBrigada  = brigada            ? brigada.trim()            : 'Sin brigada';
  const displayPareja   = pareja             ? pareja.trim()             : 'Sin pareja';
  const displayZona     = zona               ? zona.trim()               : 'Sin zona';
  const displayPatente  = patente            ? patente.trim()            : '—';
  const displayFecha    = fechaOperacional   ? fechaOperacional.trim()   : '—';
  const displayTipo     = tipoBrigada        ? tipoBrigada.trim()        : '—';
  const displayProd     = productividad      ? productividad.trim()      : 'Sin datos';
  const displayEstado   = estadoRendimiento  ? estadoRendimiento.trim()  : 'Sin evaluación';
  const displaySuperv   = supervisorResponsable ? supervisorResponsable.trim() : '—';

  const zColor  = zonaColor(displayZona);
  const eStyle  = getEstadoStyle(displayEstado);
  const ini     = initials(displayZona);

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        overflow: 'hidden',
        display: 'flex',
        fontFamily: 'var(--sans)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        width: '100%',
        height: '100%',
        flex: 1,
        boxSizing: 'border-box',
      }}
    >
      {/* ── Franja izquierda: Zona ── */}
      <div
        style={{
          width: '72px',
          flexShrink: 0,
          background: `linear-gradient(160deg, ${zColor}dd, ${zColor}88)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          padding: '12px 8px',
        }}
      >
        {/* Iniciales zona */}
        <div
          style={{
            width: '40px', height: '40px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.25)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', fontWeight: 800, color: '#fff',
            letterSpacing: '0.5px',
          }}
        >
          {ini}
        </div>
        {/* Nombre zona vertical */}
        <div
          style={{
            writingMode: 'vertical-lr',
            transform: 'rotate(180deg)',
            fontSize: '9px',
            fontWeight: 700,
            color: 'rgba(255,255,255,0.9)',
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            whiteSpace: 'nowrap',
          }}
        >
          {displayZona}
        </div>
      </div>

      {/* ── Contenido principal ── */}
      <div style={{ flex: 1, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0 }}>

        {/* Fila 1: Nombre + SAP + Badge estado */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {displayUsuario}
            </div>
            <div style={{ marginTop: '3px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#fff', background: '#1D4ED8', borderRadius: '4px', padding: '1px 6px' }}>
                {displayCodigo}
              </span>
              {displayTipo !== '—' && (
                <span style={{ fontSize: '11px', fontWeight: 500, color: '#475569', background: '#F1F5F9', borderRadius: '4px', padding: '1px 6px', border: '1px solid #E2E8F0' }}>
                  {displayTipo}
                </span>
              )}
            </div>
          </div>

          {/* Badge estado */}
          <div style={{
            flexShrink: 0,
            display: 'flex', alignItems: 'center', gap: '5px',
            background: eStyle.bg, color: eStyle.color,
            borderRadius: '999px', padding: '3px 10px',
            fontSize: '11px', fontWeight: 700,
            whiteSpace: 'nowrap',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: eStyle.dot, display: 'inline-block', flexShrink: 0 }} />
            {displayEstado}
          </div>
        </div>

        {/* Fila 2: Datos en grid 2 columnas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
          {[
            { label: '🪚 Brigada',    value: displayBrigada },
            { label: '👤 Pareja',     value: displayPareja  },
            { label: '🚗 Patente',    value: displayPatente },
            { label: '📅 Fecha',      value: displayFecha   },
            { label: '👷 Supervisor', value: displaySuperv  },
          ].map(({ label, value }) => (
            <div key={label} style={{ minWidth: 0 }}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {label}
              </div>
              <div style={{ fontSize: '12px', color: '#334155', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Fila 3: Productividad destacada */}
        <div style={{
          marginTop: 'auto',
          background: 'linear-gradient(90deg, #EFF6FF, #F0FDF4)',
          border: '1px solid #BFDBFE',
          borderRadius: '8px',
          padding: '8px 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            📊 Productividad
          </span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#1D4ED8' }}>
            {displayProd}
          </span>
        </div>
      </div>
    </div>
  );
};
