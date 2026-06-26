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
  const displayUsuario = usuarioSap ? usuarioSap.trim() : 'Usuario no identificado';
  const displayCodigo = codigoSap ? codigoSap.trim() : 'Sin código SAP';
  const displayBrigada = brigada ? brigada.trim() : 'Sin brigada informada';
  const displayPareja = pareja ? pareja.trim() : 'Sin pareja';
  const displayZona = zona ? zona.trim() : 'Zona no asignada';
  const displayPatente = patente ? patente.trim() : 'Sin patente';
  const displayFecha = fechaOperacional ? fechaOperacional.trim() : 'Sin fecha';
  const displayTipo = tipoBrigada ? tipoBrigada.trim() : 'Sin tipo';
  const displayProductividad = productividad ? productividad.trim() : 'Sin productividad diaria';
  const displayEstado = estadoRendimiento ? estadoRendimiento.trim() : 'Sin estado';
  const displaySupervisor = supervisorResponsable ? supervisorResponsable.trim() : 'Supervisor no asignado';

  const field = (label: string, value: string) => (
    <div style={{ fontSize: '13px', color: '#414754' }}>
      <span style={{ fontWeight: 600, color: '#67758f' }}>{label}:</span> {value}
    </div>
  );

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
        fontFamily: 'var(--sans)',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
        width: '100%',
        maxWidth: '460px',
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
        {field('Brigada', displayBrigada)}
        {field('Pareja', displayPareja)}
        {field('Zona', displayZona)}
        {field('Patente', displayPatente)}
        {field('Fecha', displayFecha)}
        {field('Tipo de brigada', displayTipo)}
        {field('Productividad', displayProductividad)}
        {field('Estado rendimiento', displayEstado)}
        {field('Supervisor', displaySupervisor)}
      </div>
    </div>
  );
};
