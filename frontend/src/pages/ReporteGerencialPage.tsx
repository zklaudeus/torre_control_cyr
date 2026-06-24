import { useEffect, useState } from 'react';
import { useReporteGerencial } from '../hooks/useReporteGerencial';
import type { FiltroBrigada } from '../hooks/useReporteGerencial';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList
} from 'recharts';

const printStyles = `
  @media print {
    body { background: white !important; color: black !important; }
    .no-print { display: none !important; }
    .print-container { padding: 0 !important; margin: 0 !important; width: 100% !important; overflow: visible !important; }
    .recharts-wrapper { max-width: 100% !important; }
  }
`;

const THEME = {
  fontSans: 'var(--sans)',
  fontMono: 'var(--mono)',
  bg: 'var(--bg-main)',
  cardBg: 'var(--bg-panel)',
  border: 'var(--border)',
  primary: 'var(--primary)',
  secondary: 'var(--secondary)',
  tertiary: 'var(--bg-panel-sec)',
  slate: 'var(--text-muted)',
  teal: 'var(--secondary)',
  accent: '#F59E0B',
  error: 'var(--error)',
  textMain: 'var(--text-main)',
  textMuted: 'var(--text-muted)'
};

const getDefaultFecha = () => {
  const today = new Date();
  const offset = today.getTimezoneOffset() * 60000;
  return (new Date(today.getTime() - offset)).toISOString().split('T')[0];
};

export const ReporteGerencialPage = () => {
  const [fechaOperacional, setFechaOperacional] = useState(getDefaultFecha());
  const [filtro, setFiltro] = useState<FiltroBrigada>('Todo');
  const [filtroZona, setFiltroZona] = useState<string>('Todas');
  const { reporte, loading, error, fetchReporte } = useReporteGerencial(fechaOperacional, filtro);

  // Zonas disponibles en los datos cargados
  const zonasDisponibles = reporte ? Array.from(new Set(reporte.zonas.map(z => z.zona))).sort() : [];

  // Datos filtrados por zona seleccionada
  const zonasFiltradas = reporte
    ? (filtroZona === 'Todas' ? reporte.zonas : reporte.zonas.filter(z => z.zona === filtroZona))
    : [];

  // Total recalculado según filtro de zona
  const totalFiltrado = (() => {
    if (!reporte) return null;
    if (filtroZona === 'Todas') return reporte.total;
    const z = zonasFiltradas[0];
    return z ? { ...z } : reporte.total;
  })();

  const porcentajeBrigadasEfectivas = totalFiltrado && totalFiltrado.total_brigadas > 0
    ? (totalFiltrado.brigadas_operativas / totalFiltrado.total_brigadas) * 100
    : 0;

  const realFuncionCumplimientoMetaPct = porcentajeBrigadasEfectivas > 0 && totalFiltrado
    ? (totalFiltrado.cumplimiento_meta_pct / porcentajeBrigadasEfectivas) * 100
    : 0;

  const realFuncionCumplimientoCargaPct = porcentajeBrigadasEfectivas > 0 && totalFiltrado
    ? (totalFiltrado.cumplimiento_corte_pct / porcentajeBrigadasEfectivas) * 100
    : 0;

  useEffect(() => {
    fetchReporte();
  }, [fetchReporte]);

  const handlePrint = () => window.print();

  const handleExportCSV = () => {
    if (!reporte || !totalFiltrado) return;
    const headers = [
      'Zona', 'Brigadas Operativas', 'Reconexiones Prog', 'Reconexiones Ejec', 
      'Corte Prog', 'Corte Ejec', 'Corte Poste', 'Corte Empalme', 'Visitas Fallidas',
      'Prom Reconexiones', 'Prom Cortes', 'Prom Actividad', 'Cumplimiento Meta %', 'Cumplimiento Corte %'
    ];
    const rows = zonasFiltradas.map(z => [
      z.zona, z.brigadas_operativas, z.reconexiones_programadas, z.reconexiones_ejecutadas,
      z.corte_programado, z.cortes_ejecutados, z.corte_en_poste, z.corte_en_empalme, z.visitas_fallidas,
      z.promedio_reconexiones, z.promedio_cortes, z.promedio_actividad, z.cumplimiento_meta_pct, z.cumplimiento_corte_pct
    ]);
    rows.push([
      filtroZona === 'Todas' ? 'Total General' : filtroZona,
      totalFiltrado.brigadas_operativas, totalFiltrado.reconexiones_programadas, totalFiltrado.reconexiones_ejecutadas,
      totalFiltrado.corte_programado, totalFiltrado.cortes_ejecutados, totalFiltrado.corte_en_poste, totalFiltrado.corte_en_empalme, totalFiltrado.visitas_fallidas,
      totalFiltrado.promedio_reconexiones, totalFiltrado.promedio_cortes, totalFiltrado.promedio_actividad, totalFiltrado.cumplimiento_meta_pct, totalFiltrado.cumplimiento_corte_pct
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Reporte_Gerencial_CyR_${fechaOperacional}_${filtro}_${filtroZona}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Styles ---
  const pageStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: THEME.bg,
    fontFamily: THEME.fontSans,
    padding: '0'
  };

  const topBarStyle: React.CSSProperties = {
    background: THEME.tertiary,
    padding: '16px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
  };

  const containerStyle: React.CSSProperties = {
    padding: '24px 32px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  };

  const kpiGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px',
    marginBottom: '12px'
  };

  const cardStyle: React.CSSProperties = {
    background: THEME.cardBg,
    border: `1px solid ${THEME.border}`,
    borderRadius: '4px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
  };

  const kpiTitleStyle: React.CSSProperties = {
    fontFamily: THEME.fontMono,
    fontSize: '10px',
    fontWeight: 600,
    color: THEME.textMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '8px'
  };

  const kpiValueStyle: React.CSSProperties = {
    fontSize: '36px',
    fontWeight: 700,
    color: THEME.primary,
    letterSpacing: '-0.02em',
    lineHeight: '44px',
    margin: 0
  };

  const kpiSubValueStyle: React.CSSProperties = {
    fontSize: '12px',
    color: THEME.slate,
    marginTop: '4px'
  };

  const chartGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
    gap: '12px',
    marginBottom: '12px'
  };

  const chartCardStyle: React.CSSProperties = {
    ...cardStyle,
    minHeight: '320px',
    justifyContent: 'flex-start'
  };

  const chartTitleStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 600,
    color: THEME.textMain,
    marginBottom: '16px'
  };

  const tableWrapperStyle: React.CSSProperties = {
    background: THEME.cardBg,
    border: `1px solid ${THEME.border}`,
    borderRadius: '4px',
    overflow: 'hidden'
  };

  const tableHeaderStyle: React.CSSProperties = {
    background: THEME.tertiary,
    color: 'var(--text-main)',
    fontSize: '12px',
    fontWeight: 600,
    textAlign: 'left',
    padding: '8px 12px'
  };

  const tableCellStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 500,
    color: THEME.textMain,
    padding: '8px 12px',
    borderBottom: '1px solid var(--border)'
  };

  const axisProps = {
    tick: { fontFamily: THEME.fontMono, fontSize: 10, fill: THEME.textMuted },
    axisLine: { stroke: THEME.border },
    tickLine: { stroke: THEME.border }
  };

  const btnStyle: React.CSSProperties = {
    background: 'transparent',
    color: 'var(--text-main)',
    border: '1px solid rgba(255,255,255,0.3)',
    padding: '8px 16px',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: THEME.fontSans
  };

  const btnPrimaryStyle: React.CSSProperties = {
    ...btnStyle,
    background: THEME.primary,
    border: 'none'
  };

  return (
    <div style={pageStyle}>
      <style>{printStyles}</style>

      {/* TOP BAR */}
      <div style={topBarStyle} className="no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>
            📊 Reporte Gerencial CyR
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Fecha:</label>
            <input
              type="date"
              value={fechaOperacional}
              onChange={(e) => setFechaOperacional(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.1)',
                color: 'var(--text-main)',
                fontFamily: THEME.fontMono,
                fontSize: '13px'
              }}
            />
          </div>
          {/* Filtro Zona */}
          <select
            value={filtroZona}
            onChange={(e) => setFiltroZona(e.target.value)}
            style={{
              padding: '5px 14px',
              borderRadius: '4px',
              border: '1px solid rgba(255,255,255,0.3)',
              background: filtroZona !== 'Todas' ? THEME.primary : 'rgba(255,255,255,0.1)',
              color: 'var(--text-main)',
              fontFamily: THEME.fontSans,
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="Todas" style={{ background: THEME.tertiary }}>Todas las zonas</option>
            {zonasDisponibles.map(z => (
              <option key={z} value={z} style={{ background: THEME.tertiary }}>{z}</option>
            ))}
          </select>
          {/* Filtro Tipo */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.1)', padding: '3px', borderRadius: '4px', gap: '2px' }}>
            {(['Todo', 'PXQ', 'CF'] as FiltroBrigada[]).map(f => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                style={{
                  background: filtro === f ? 'var(--primary)' : 'var(--bg-panel-sec)',
                  color: filtro === f ? 'var(--text-main)' : 'var(--text-muted)',
                  border: 'none',
                  padding: '5px 14px',
                  borderRadius: '3px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: THEME.fontSans,
                  transition: 'all 0.15s ease'
                }}
              >
                Ver {f}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={btnStyle} onClick={handleExportCSV}>Export CSV</button>
          <button style={btnPrimaryStyle} onClick={handlePrint}>Print PDF</button>
        </div>
      </div>

      {/* CONTENT */}
      <section style={containerStyle} className="print-container">
        {loading && <div style={{ textAlign: 'center', padding: '48px', color: THEME.textMuted }}>Cargando reporte...</div>}
        {error && <div style={{ padding: '16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '4px', color: THEME.error }}>{error}</div>}

        {reporte && totalFiltrado && (
          <>
            {/* KPI ROW */}
            <div style={kpiGridStyle}>
              <div style={cardStyle}>
                <div style={kpiTitleStyle}>Brigadas Operativas</div>
                <div style={{...kpiValueStyle, display: 'flex', alignItems: 'baseline', gap: '4px'}}>
                  {totalFiltrado.brigadas_operativas}
                  <span style={{ fontSize: '20px', color: THEME.slate, fontWeight: 500 }}>/ {totalFiltrado.total_brigadas}</span>
                </div>
                <div style={kpiSubValueStyle}>Reportadas vs Ctto</div>
              </div>
              <div style={cardStyle}>
                <div style={kpiTitleStyle}>Reconexiones Ejec.</div>
                <div style={kpiValueStyle}>{totalFiltrado.reconexiones_ejecutadas}</div>
                <div style={kpiSubValueStyle}>de {totalFiltrado.reconexiones_programadas} programadas</div>
              </div>
              <div style={cardStyle}>
                <div style={kpiTitleStyle}>Cortes Ejec.</div>
                <div style={kpiValueStyle}>{totalFiltrado.cortes_ejecutados}</div>
                <div style={kpiSubValueStyle}>de {totalFiltrado.corte_programado} programados</div>
              </div>
              <div style={{...cardStyle, border: `1px solid ${THEME.primary}`}}>
                <div style={kpiTitleStyle}>Real función Meta</div>
                <div style={kpiValueStyle}>{realFuncionCumplimientoMetaPct.toFixed(2)}%</div>
                <div style={{...kpiSubValueStyle, color: THEME.primary}}>Cumpl. prom. / brigadas efectivas</div>
              </div>
              <div style={cardStyle}>
                <div style={kpiTitleStyle}>Real función Carga</div>
                <div style={kpiValueStyle}>{realFuncionCumplimientoCargaPct.toFixed(2)}%</div>
                <div style={kpiSubValueStyle}>Corte carga / brigadas efectivas</div>
              </div>
              <div style={cardStyle}>
                <div style={kpiTitleStyle}>Visitas Fallidas</div>
                <div style={{...kpiValueStyle, color: THEME.error}}>{totalFiltrado.visitas_fallidas}</div>
                <div style={kpiSubValueStyle}>Atención requerida</div>
              </div>
            </div>

            {/* CHARTS GRID */}
            <div style={chartGridStyle}>
              {/* 1. Cumplimiento % meta por zona */}
              <div style={chartCardStyle}>
                <div style={chartTitleStyle}>% Cumplimiento Meta por Zona</div>
                <div style={{ flex: 1, minHeight: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={zonasFiltradas} margin={{ left: 20, right: 30, top: 0, bottom: 0 }}>
                      <XAxis type="number" domain={[0, 100]} hide />
                      <YAxis dataKey="zona" type="category" width={60} {...axisProps} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{fill: THEME.bg}} contentStyle={{ borderRadius: 4, border: `1px solid ${THEME.border}` }} />
                      <Bar dataKey="cumplimiento_meta_pct" fill={THEME.primary} radius={[0, 4, 4, 0]} barSize={16} background={{ fill: THEME.border }}>
                        <LabelList dataKey="cumplimiento_meta_pct" position="right" formatter={(v: any) => `${v}%`} style={{ fontSize: 10, fontFamily: THEME.fontMono, fill: THEME.textMuted }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 2. Corte Poste vs Empalme */}
              <div style={chartCardStyle}>
                <div style={chartTitleStyle}>Corte: Poste, Empalme y F. Rango</div>
                <div style={{ flex: 1, minHeight: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={zonasFiltradas} margin={{ top: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={THEME.bg} />
                      <XAxis dataKey="zona" {...axisProps} tickMargin={10} />
                      <YAxis hide />
                      <Tooltip cursor={{fill: THEME.bg}} />
                      <Legend iconType="square" wrapperStyle={{ fontFamily: THEME.fontMono, fontSize: '10px' }} />
                      <Bar dataKey="corte_en_poste" stackId="a" fill={THEME.primary} name="Poste" barSize={24}>
                        <LabelList dataKey="corte_en_poste" position="center" style={{ fontSize: 10, fontFamily: THEME.fontMono, fill: 'var(--text-main)' }} />
                      </Bar>
                      <Bar dataKey="corte_en_empalme" stackId="a" fill={THEME.secondary} name="Empalme">
                        <LabelList dataKey="corte_en_empalme" position="center" style={{ fontSize: 10, fontFamily: THEME.fontMono, fill: 'var(--text-main)' }} />
                      </Bar>
                      <Bar dataKey="corte_fuera_de_rango" stackId="a" fill="#a78bfa" name="F. Rango" radius={[4, 4, 0, 0]}>
                        <LabelList dataKey="corte_fuera_de_rango" position="top" style={{ fontSize: 10, fontFamily: THEME.fontMono, fill: THEME.textMuted }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 3. Corte programado vs ejecutado */}
              <div style={chartCardStyle}>
                <div style={chartTitleStyle}>Corte Programado vs Ejecutado</div>
                <div style={{ flex: 1, minHeight: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={zonasFiltradas} margin={{ top: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={THEME.bg} />
                      <XAxis dataKey="zona" {...axisProps} tickMargin={10} />
                      <YAxis hide />
                      <Tooltip cursor={{fill: THEME.bg}} />
                      <Legend iconType="square" wrapperStyle={{ fontFamily: THEME.fontMono, fontSize: '10px' }} />
                      <Bar dataKey="corte_programado" fill={THEME.primary} name="Prog." barSize={16}>
                        <LabelList dataKey="corte_programado" position="top" style={{ fontSize: 10, fontFamily: THEME.fontMono, fill: THEME.textMuted }} />
                      </Bar>
                      <Bar dataKey="cortes_ejecutados" fill="#F59E0B" name="Ejec." barSize={16}>
                        <LabelList dataKey="cortes_ejecutados" position="top" style={{ fontSize: 10, fontFamily: THEME.fontMono, fill: THEME.textMuted }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 4. Reconexiones programadas vs ejecutadas */}
              <div style={chartCardStyle}>
                <div style={chartTitleStyle}>Reconexiones: Prog. vs Ejec.</div>
                <div style={{ flex: 1, minHeight: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={zonasFiltradas} margin={{ top: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={THEME.bg} />
                      <XAxis dataKey="zona" {...axisProps} tickMargin={10} />
                      <YAxis hide />
                      <Tooltip cursor={{fill: THEME.bg}} />
                      <Legend iconType="square" wrapperStyle={{ fontFamily: THEME.fontMono, fontSize: '10px' }} />
                      <Bar dataKey="reconexiones_programadas" fill={THEME.primary} name="Prog." barSize={16}>
                        <LabelList dataKey="reconexiones_programadas" position="top" style={{ fontSize: 10, fontFamily: THEME.fontMono, fill: THEME.textMuted }} />
                      </Bar>
                      <Bar dataKey="reconexiones_ejecutadas" fill={THEME.accent} name="Ejec." barSize={16}>
                        <LabelList dataKey="reconexiones_ejecutadas" position="top" style={{ fontSize: 10, fontFamily: THEME.fontMono, fill: THEME.textMuted }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 5. Promedio actividad por zona */}
              <div style={chartCardStyle}>
                <div style={chartTitleStyle}>Promedio Actividad Diaria por Zona</div>
                <div style={{ flex: 1, minHeight: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={zonasFiltradas} margin={{ left: 20, right: 30, top: 0, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="zona" type="category" width={60} {...axisProps} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{fill: THEME.bg}} />
                      <Bar dataKey="promedio_actividad" fill={THEME.primary} radius={[0, 4, 4, 0]} barSize={16} background={{ fill: THEME.border }}>
                        <LabelList dataKey="promedio_actividad" position="right" style={{ fontSize: 10, fontFamily: THEME.fontMono, fill: THEME.textMuted }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 6. Visitas fallidas por zona */}
              <div style={chartCardStyle}>
                <div style={chartTitleStyle}>Visitas Fallidas</div>
                <div style={{ flex: 1, minHeight: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={zonasFiltradas} margin={{ top: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={THEME.bg} />
                      <XAxis dataKey="zona" {...axisProps} tickMargin={10} />
                      <YAxis hide />
                      <Tooltip cursor={{fill: THEME.bg}} />
                      <Bar dataKey="visitas_fallidas" fill={THEME.primary} name="Fallidas" barSize={32} radius={[4, 4, 0, 0]}>
                        <LabelList dataKey="visitas_fallidas" position="top" style={{ fontSize: 10, fontFamily: THEME.fontMono, fill: THEME.textMuted }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* TABLE */}
            <div style={tableWrapperStyle}>
              <div style={{ padding: '16px', background: THEME.tertiary, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '14px', fontWeight: 600 }}>Estado por Cuadrilla Detallado (Multi-Zona)</h3>
              </div>
              <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                  <thead>
                    <tr>
                      <th style={tableHeaderStyle}>Zona</th>
                      <th style={tableHeaderStyle}>Brig. Op.</th>
                      <th style={tableHeaderStyle}>Rec. Prog</th>
                      <th style={tableHeaderStyle}>Rec. Ejec</th>
                      <th style={tableHeaderStyle}>Corte Prog</th>
                      <th style={tableHeaderStyle}>Corte Ejec</th>
                      <th style={tableHeaderStyle}>Poste</th>
                      <th style={tableHeaderStyle}>Empalme</th>
                      <th style={tableHeaderStyle}>Fallidas</th>
                      <th style={tableHeaderStyle}>Prom. Rec.</th>
                      <th style={tableHeaderStyle}>Prom. Cort.</th>
                      <th style={tableHeaderStyle}>Prom. Act.</th>
                      <th style={tableHeaderStyle}>% Meta</th>
                      <th style={tableHeaderStyle}>% Corte</th>
                    </tr>
                  </thead>
                  <tbody>
                    {zonasFiltradas.map((z, idx) => (
                      <tr key={idx}>
                        <td style={tableCellStyle}>{z.zona}</td>
                        <td style={tableCellStyle}>{z.brigadas_operativas}</td>
                        <td style={tableCellStyle}>{z.reconexiones_programadas}</td>
                        <td style={tableCellStyle}>{z.reconexiones_ejecutadas}</td>
                        <td style={tableCellStyle}>{z.corte_programado}</td>
                        <td style={tableCellStyle}>{z.cortes_ejecutados}</td>
                        <td style={tableCellStyle}>{z.corte_en_poste}</td>
                        <td style={tableCellStyle}>{z.corte_en_empalme}</td>
                        <td style={tableCellStyle}>{z.visitas_fallidas}</td>
                        <td style={tableCellStyle}>{z.promedio_reconexiones}</td>
                        <td style={tableCellStyle}>{z.promedio_cortes}</td>
                        <td style={tableCellStyle}>{z.promedio_actividad}</td>
                        <td style={tableCellStyle}>{z.cumplimiento_meta_pct}%</td>
                        <td style={tableCellStyle}>{z.cumplimiento_corte_pct}%</td>
                      </tr>
                    ))}
                    <tr style={{ background: 'var(--bg-panel-sec)' }}>
                      <td style={{...tableCellStyle, fontWeight: 700}}>{filtroZona === 'Todas' ? 'Total General' : totalFiltrado.zona}</td>
                      <td style={{...tableCellStyle, fontWeight: 700}}>{totalFiltrado.brigadas_operativas}</td>
                      <td style={{...tableCellStyle, fontWeight: 700}}>{totalFiltrado.reconexiones_programadas}</td>
                      <td style={{...tableCellStyle, fontWeight: 700}}>{totalFiltrado.reconexiones_ejecutadas}</td>
                      <td style={{...tableCellStyle, fontWeight: 700}}>{totalFiltrado.corte_programado}</td>
                      <td style={{...tableCellStyle, fontWeight: 700}}>{totalFiltrado.cortes_ejecutados}</td>
                      <td style={{...tableCellStyle, fontWeight: 700}}>{totalFiltrado.corte_en_poste}</td>
                      <td style={{...tableCellStyle, fontWeight: 700}}>{totalFiltrado.corte_en_empalme}</td>
                      <td style={{...tableCellStyle, fontWeight: 700}}>{totalFiltrado.visitas_fallidas}</td>
                      <td style={{...tableCellStyle, fontWeight: 700}}>{totalFiltrado.promedio_reconexiones}</td>
                      <td style={{...tableCellStyle, fontWeight: 700}}>{totalFiltrado.promedio_cortes}</td>
                      <td style={{...tableCellStyle, fontWeight: 700}}>{totalFiltrado.promedio_actividad}</td>
                      <td style={{...tableCellStyle, fontWeight: 700, color: THEME.primary}}>{totalFiltrado.cumplimiento_meta_pct}%</td>
                      <td style={{...tableCellStyle, fontWeight: 700, color: THEME.primary}}>{totalFiltrado.cumplimiento_corte_pct}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
};
