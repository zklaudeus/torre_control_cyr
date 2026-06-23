import React from 'react';

type EstadoCurso = 'Completado' | 'Pendiente' | 'Vencido';

type CursoTecnico = {
  id: string;
  nombre: string;
  estado: EstadoCurso;
  fecha?: string;
  resultado?: string;
  vencimiento?: string;
};

const ESTADO_COLOR: Record<EstadoCurso, { color: string; bg: string; border: string }> = {
  Completado: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)',    border: 'rgba(34,197,94,0.3)'  },
  Pendiente:  { color: '#f97316', bg: 'rgba(249,115,22,0.1)',   border: 'rgba(249,115,22,0.3)' },
  Vencido:    { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',    border: 'rgba(239,68,68,0.3)'  },
};

const MOCK_CURSOS: CursoTecnico[] = [
  {
    id: '1',
    nombre: 'Protocolo de corte',
    estado: 'Completado',
    fecha: '10/06/2026',
    resultado: 'Aprobado',
    vencimiento: '10/06/2027',
  },
  {
    id: '2',
    nombre: 'Seguridad operacional',
    estado: 'Completado',
    fecha: '15/06/2026',
    resultado: 'Aprobado',
    vencimiento: '15/06/2027',
  },
  {
    id: '3',
    nombre: 'Atención y comunicación con cliente',
    estado: 'Pendiente',
    fecha: undefined,
    resultado: undefined,
    vencimiento: undefined,
  },
  {
    id: '4',
    nombre: 'Calidad de corte y evidencia',
    estado: 'Completado',
    fecha: '18/06/2026',
    resultado: 'Aprobado',
    vencimiento: '18/06/2027',
  },
  {
    id: '5',
    nombre: 'Disciplina operacional',
    estado: 'Vencido',
    fecha: '01/05/2025',
    resultado: 'Aprobado',
    vencimiento: '01/05/2026',
  },
];

// ── Mini KPI badge para el resumen ──────────────────────────────────────────
interface ResumenCardProps {
  label: string;
  valor: string | number;
  color: string;
}
const ResumenCard: React.FC<ResumenCardProps> = ({ label, valor, color }) => (
  <div style={{
    background: 'var(--bg-panel-sec)',
    border: `1px solid ${color}30`,
    borderRadius: '8px',
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: 0,
  }}>
    <div style={{ fontSize: '10px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.7px' }}>
      {label}
    </div>
    <div style={{ fontSize: '22px', fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>
      {valor}
    </div>
  </div>
);

// ── Badge de estado ──────────────────────────────────────────────────────────
const EstadoBadge: React.FC<{ estado: EstadoCurso }> = ({ estado }) => {
  const cfg = ESTADO_COLOR[estado];
  return (
    <span style={{
      display: 'inline-block',
      fontSize: '11px',
      fontWeight: 700,
      padding: '2px 10px',
      borderRadius: '20px',
      color: cfg.color,
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      whiteSpace: 'nowrap',
    }}>
      {estado}
    </span>
  );
};

// ── Fila de tabla (desktop) ──────────────────────────────────────────────────
const FilaCurso: React.FC<{ curso: CursoTecnico; par: boolean }> = ({ curso, par }) => (
  <tr style={{ background: par ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
    <td style={{ padding: '10px 12px', fontSize: '13px', color: 'var(--text-main)', fontWeight: 500 }}>
      {curso.nombre}
    </td>
    <td style={{ padding: '10px 12px' }}>
      <EstadoBadge estado={curso.estado} />
    </td>
    <td style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--text-muted)' }}>
      {curso.fecha ?? '—'}
    </td>
    <td style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--text-muted)' }}>
      {curso.resultado ?? '—'}
    </td>
    <td style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--text-muted)' }}>
      {curso.vencimiento ?? '—'}
    </td>
  </tr>
);

// ── Card móvil ──────────────────────────────────────────────────────────────
const CardCurso: React.FC<{ curso: CursoTecnico }> = ({ curso }) => {
  const cfg = ESTADO_COLOR[curso.estado];
  return (
    <div style={{
      background: 'var(--bg-panel-sec)',
      border: `1px solid ${cfg.border}`,
      borderRadius: '8px',
      padding: '14px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.4 }}>
          {curso.nombre}
        </span>
        <EstadoBadge estado={curso.estado} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
        {[
          ['Fecha', curso.fecha],
          ['Resultado', curso.resultado],
          ['Vencimiento', curso.vencimiento],
        ].map(([label, val]) => val && (
          <div key={label}>
            <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-main)' }}>{val}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Componente principal ─────────────────────────────────────────────────────
interface RendimientoTecnicoCursosProps {
  cursos?: CursoTecnico[];
}

export const RendimientoTecnicoCursos: React.FC<RendimientoTecnicoCursosProps> = ({
  cursos = MOCK_CURSOS,
}) => {
  const completados = cursos.filter(c => c.estado === 'Completado').length;
  const pendientes  = cursos.filter(c => c.estado === 'Pendiente').length;
  const vencidos    = cursos.filter(c => c.estado === 'Vencido').length;
  const cumplimiento = Math.round((completados / cursos.length) * 100);

  return (
    <div>
      <style>{`
        .cursos-resumen {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 16px;
        }
        @media (max-width: 700px) {
          .cursos-resumen { grid-template-columns: repeat(2, 1fr); }
        }
        .cursos-tabla-wrap { display: block; overflow-x: auto; }
        .cursos-cards-wrap  { display: none; flex-direction: column; gap: 10px; }
        @media (max-width: 650px) {
          .cursos-tabla-wrap { display: none; }
          .cursos-cards-wrap  { display: flex; }
        }
        .cursos-tabla {
          width: 100%;
          border-collapse: collapse;
          font-family: var(--sans);
        }
        .cursos-tabla th {
          font-size: 10px;
          font-weight: 700;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.7px;
          padding: 8px 12px;
          text-align: left;
          border-bottom: 1px solid var(--border);
        }
        .cursos-tabla tr { border-bottom: 1px solid rgba(255,255,255,0.04); }
        .cursos-tabla tr:last-child { border-bottom: none; }
      `}</style>

      {/* Encabezado */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{
            width: '3px', height: '18px', borderRadius: '2px',
            background: 'var(--primary)', display: 'inline-block', flexShrink: 0,
          }} />
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Cursos Realizados
          </span>
          <span style={{
            fontSize: '10px', padding: '2px 8px', borderRadius: '20px',
            background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)',
            color: 'var(--secondary)', fontWeight: 600, letterSpacing: '0.5px',
          }}>MOCK</span>
        </div>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', paddingLeft: '11px' }}>
          Control visual de capacitaciones, cumplimiento y cursos pendientes del técnico.
        </p>
      </div>

      {/* Cards resumen */}
      <div className="cursos-resumen">
        <ResumenCard label="Completados"               valor={completados}        color="#22c55e" />
        <ResumenCard label="Pendientes"                valor={pendientes}         color="#f97316" />
        <ResumenCard label="Vencidos"                  valor={vencidos}           color="#ef4444" />
        <ResumenCard label="Cumplimiento capacitación" valor={`${cumplimiento}%`} color="#60a5fa" />
      </div>

      {/* Tabla desktop */}
      <div className="cursos-tabla-wrap" style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        overflow: 'hidden',
      }}>
        <table className="cursos-tabla">
          <thead>
            <tr>
              {['Curso', 'Estado', 'Fecha', 'Resultado', 'Vencimiento'].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cursos.map((curso, i) => (
              <FilaCurso key={curso.id} curso={curso} par={i % 2 === 0} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards móvil */}
      <div className="cursos-cards-wrap">
        {cursos.map(curso => (
          <CardCurso key={curso.id} curso={curso} />
        ))}
      </div>
    </div>
  );
};
