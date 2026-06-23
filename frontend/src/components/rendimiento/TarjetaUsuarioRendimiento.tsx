import React from 'react';

export type TarjetaUsuarioRendimientoProps = {
  usuarioSap?: string | null;
  codigoSap?: string | null;
  zona?: string | null;
  supervisorResponsable?: string | null;
};

export const TarjetaUsuarioRendimiento: React.FC<TarjetaUsuarioRendimientoProps> = ({
  usuarioSap,
  codigoSap,
  zona,
  supervisorResponsable,
}) => {
  const displayUsuario = usuarioSap ? usuarioSap.trim() : 'Usuario no identificado';
  const displayCodigo = codigoSap ? codigoSap.trim() : 'Sin código SAP';
  const displayZona = zona ? zona.trim() : 'Zona no asignada';
  const displaySupervisor = supervisorResponsable ? supervisorResponsable.trim() : 'Supervisor no asignado';

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #E2E8F0',
        borderRadius: '8px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        fontFamily: '"Inter", sans-serif',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
        width: '100%',
        maxWidth: '400px',
      }}
    >
      <div
        style={{
          fontSize: '16px',
          fontWeight: 600,
          color: '#191c1e',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          flexWrap: 'wrap',
        }}
      >
        <span>{displayUsuario}</span>
        <span style={{ color: '#67758f' }}>&middot;</span>
        <span style={{ color: '#0059bb' }}>{displayCodigo}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ fontSize: '13px', color: '#414754' }}>
          <span style={{ fontWeight: 600, color: '#67758f' }}>Zona:</span> {displayZona}
        </div>
        <div style={{ fontSize: '13px', color: '#414754' }}>
          <span style={{ fontWeight: 600, color: '#67758f' }}>Supervisor:</span> {displaySupervisor}
        </div>
      </div>
    </div>
  );
};
