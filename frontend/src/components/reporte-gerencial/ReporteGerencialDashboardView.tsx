import { useEffect, useState } from 'react';
import { DashboardLayout } from '../dashboard/DashboardLayout';
import { DashboardHeader } from '../dashboard/DashboardHeader';
import { AlertMessage } from '../dashboard/AlertMessage';
import { useReporteGerencial } from '../../hooks/useReporteGerencial';
import type { FiltroBrigada } from '../../hooks/useReporteGerencial';
import type { FormularioActivo } from '../../pages/DashboardPage';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList
} from 'recharts';

interface ReporteGerencialDashboardViewProps {
  fechaOperacional: string;
  onChangeFecha: (fecha: string) => void;
  formularioActivo?: FormularioActivo;
  onChangeFormulario?: (form: FormularioActivo) => void;
  activeSection: string;
  onChangeSection: (section: string) => void;
}

const printStyles = `
  @media print {
    body { background: white !important; color: black !important; }
    .no-print { display: none !important; }
    .print-only { display: block !important; }
    .print-container { padding: 0 !important; margin: 0 !important; width: 100% !important; overflow: visible !important; }
    .recharts-wrapper { max-width: 100% !important; }
  }
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@600&display=swap');
`;

const THEME = {
  bg: '#f7f9fb',
  cardBg: '#ffffff',
  border: '#E2E8F0', // Using the recommended soft outline
  primary: '#0059bb',
  secondary: '#00daf3',
  tertiary: '#0A192F',
  slate: '#67758f',
  teal: '#006875',
  error: '#ba1a1a',
  textMain: '#191c1e',
  textMuted: '#414754',
  fontMain: '"Inter", sans-serif',
  fontMono: '"JetBrains Mono", monospace'
};

export const ReporteGerencialDashboardView = ({
  fechaOperacional,
  onChangeFecha,
  formularioActivo,
  onChangeFormulario,
  activeSection,
  onChangeSection
}: ReporteGerencialDashboardViewProps) => {
  const [filtro, setFiltro] = useState<FiltroBrigada>('Todo');
  const [filtroZona, setFiltroZona] = useState<string>('Todas');
  const { reporte, loading, error, fetchReporte } = useReporteGerencial(fechaOperacional, filtro);

  // Zonas disponibles según datos cargados
  const zonasDisponibles = reporte ? Array.from(new Set(reporte.zonas.map(z => z.zona))).sort() : [];

  // Datos filtrados por zona
  const zonasFiltradas = reporte
    ? (filtroZona === 'Todas' ? reporte.zonas : reporte.zonas.filter(z => z.zona === filtroZona))
    : [];

  // Recalcular total según zonas filtradas
  const totalFiltrado = (() => {
    if (!reporte) return reporte?.total;
    if (filtroZona === 'Todas') return reporte.total;
    // Para una sola zona, usar sus datos directamente como "total"
    const z = zonasFiltradas[0];
    return z ? { ...z, zona: z.zona } : reporte.total;
  })();

  useEffect(() => {
    fetchReporte();
  }, [fetchReporte]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!reporte) return;
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
    const t = totalFiltrado!;
    rows.push([
      t.zona, t.brigadas_operativas, t.reconexiones_programadas, t.reconexiones_ejecutadas,
      t.corte_programado, t.cortes_ejecutados, t.corte_en_poste, t.corte_en_empalme, t.visitas_fallidas,
      t.promedio_reconexiones, t.promedio_cortes, t.promedio_actividad, t.cumplimiento_meta_pct, t.cumplimiento_corte_pct
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Reporte_Gerencial_CyR_${fechaOperacional}_${filtro}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Styles ---
  const containerStyle = {
    padding: '24px',
    background: THEME.bg,
    minHeight: '100%',
    fontFamily: THEME.fontMain,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px'
  };

  const headerRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: '12px'
  };

  const titleStyle = {
    fontSize: '24px',
    fontWeight: 600,
    color: THEME.textMain,
    margin: 0,
    lineHeight: '32px'
  };

  const btnContainerStyle = {
    display: 'flex',
    gap: '8px'
  };

  const btnPrimaryStyle = {
    background: THEME.primary,
    color: '#fff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: THEME.fontMain
  };

  const btnGhostStyle = {
    background: 'transparent',
    color: THEME.primary,
    border: `1px solid ${THEME.primary}`,
    padding: '8px 16px',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: THEME.fontMain
  };

  const kpiGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px',
    marginBottom: '12px'
  };

  const cardStyle = {
    background: THEME.cardBg,
    border: `1px solid ${THEME.border}`,
    borderRadius: '4px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center'
  };

  const kpiTitleStyle = {
    fontFamily: THEME.fontMono,
    fontSize: '10px',
    fontWeight: 600,
    color: THEME.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: '8px'
  };

  const kpiValueStyle = {
    fontSize: '36px',
    fontWeight: 700,
    color: THEME.primary,
    letterSpacing: '-0.02em',
    lineHeight: '44px',
    margin: 0
  };

  const kpiSubValueStyle = {
    fontSize: '12px',
    color: THEME.slate,
    marginTop: '4px'
  };

  const chartGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
    gap: '12px',
    marginBottom: '12px'
  };

  const chartCardStyle = {
    ...cardStyle,
    minHeight: '320px',
    justifyContent: 'flex-start'
  };

  const chartTitleStyle = {
    fontSize: '14px',
    fontWeight: 600,
    color: THEME.textMain,
    marginBottom: '16px'
  };

  const tableWrapperStyle = {
    background: THEME.cardBg,
    border: `1px solid ${THEME.border}`,
    borderRadius: '4px',
    overflow: 'hidden'
  };

  const tableHeaderStyle = {
    background: THEME.tertiary,
    color: '#fff',
    fontSize: '12px',
    fontWeight: 600,
    textAlign: 'left' as const,
    padding: '8px 12px'
  };

  const tableCellStyle = {
    fontSize: '13px',
    fontWeight: 500,
    color: THEME.textMain,
    padding: '8px 12px',
    borderBottom: `1px solid #F1F5F9`
  };

  // Custom tooltips & axis styles for Recharts
  const axisProps = {
    tick: { fontFamily: THEME.fontMono, fontSize: 10, fill: THEME.textMuted },
    axisLine: { stroke: THEME.border },
    tickLine: { stroke: THEME.border }
  };

  return (
    <DashboardLayout 
      formularioActivo={formularioActivo}
      onChangeFormulario={onChangeFormulario}
      activeSection={activeSection} 
      onChangeSection={onChangeSection}
    >
      <style>{printStyles}</style>
      <div className="no-print">
        <DashboardHeader
          fechaOperacional={fechaOperacional}
          onChangeFecha={onChangeFecha}
          loading={loading}
          saving={false}
        />
      </div>

      <AlertMessage type="error" message={error || ''} />

      <section style={containerStyle} className="print-container">
        <div style={headerRowStyle} className="no-print">
          <div>
            <h2 style={titleStyle}>Reporte Operativo de Brigadas</h2>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            {/* Filtro Zona */}
            <select
              value={filtroZona}
              onChange={(e) => setFiltroZona(e.target.value)}
              style={{
                background: '#1e293b',
                color: '#e2e8f0',
                border: '1px solid #334155',
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: THEME.fontMain,
                outline: 'none',
              }}
            >
              <option value="Todas">Todas las zonas</option>
              {zonasDisponibles.map(z => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
            {/* Filtro Tipo */}
            <div style={{ display: 'flex', background: THEME.border, padding: '4px', borderRadius: '4px', gap: '4px' }}>
              {(['Todo', 'PXQ', 'CF'] as FiltroBrigada[]).map(f => (
                <button 
                  key={f}
                  onClick={() => setFiltro(f)}
                  style={{
                    background: filtro === f ? THEME.primary : 'transparent',
                    color: filtro === f ? '#ffffff' : '#000000',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: THEME.fontMain,
                    boxShadow: filtro === f ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                  }}
                >
                  Ver {f}
                </button>
              ))}
            </div>
            <div style={btnContainerStyle}>
              <button style={btnGhostStyle} onClick={handleExportCSV}>Export CSV</button>
              <button style={btnPrimaryStyle} onClick={handlePrint}>Print PDF</button>
            </div>
          </div>
        </div>

        {reporte && (
          <>
            {/* KPI ROW */}
            <div style={kpiGridStyle}>
              <div style={cardStyle}>
                <div style={kpiTitleStyle}>Brigadas Operativas</div>
                <div style={kpiValueStyle}>{totalFiltrado!.brigadas_operativas}</div>
                <div style={kpiSubValueStyle}>Total activas hoy</div>
              </div>
              <div style={cardStyle}>
                <div style={kpiTitleStyle}>Reconexiones Ejec.</div>
                <div style={kpiValueStyle}>{totalFiltrado!.reconexiones_ejecutadas}</div>
                <div style={kpiSubValueStyle}>de {totalFiltrado!.reconexiones_programadas} programadas</div>
              </div>
              <div style={cardStyle}>
                <div style={kpiTitleStyle}>Cortes Ejec.</div>
                <div style={kpiValueStyle}>{totalFiltrado!.cortes_ejecutados}</div>
                <div style={kpiSubValueStyle}>de {totalFiltrado!.corte_programado} programados</div>
              </div>
              <div style={{...cardStyle, border: `1px solid ${THEME.primary}`}}>
                <div style={kpiTitleStyle}>Cumpl. % Prom. según Meta</div>
                <div style={kpiValueStyle}>{totalFiltrado!.cumplimiento_meta_pct}%</div>
              </div>
              <div style={cardStyle}>
                <div style={kpiTitleStyle}>Cumpl. Corte s/Carga</div>
                <div style={kpiValueStyle}>{totalFiltrado!.cumplimiento_corte_pct}%</div>
                <div style={kpiSubValueStyle}>Eficiencia</div>
              </div>
              <div style={cardStyle}>
                <div style={kpiTitleStyle}>Visitas Fallidas</div>
                <div style={{...kpiValueStyle, color: THEME.error}}>{totalFiltrado!.visitas_fallidas}</div>
                <div style={kpiSubValueStyle}>Atención requerida</div>
              </div>
            </div>

            {/* CHARTS GRID */}
            <div style={chartGridStyle}>
              
              {/* 1. Cumplimiento % meta por zona */}
              <div style={chartCardStyle}>
                <div style={chartTitleStyle}>Cumpl. % Prom. según Meta por Zona</div>
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

              {/* 2. Corte Poste vs Empalme (Stacked) */}
              <div style={chartCardStyle}>
                <div style={chartTitleStyle}>Corte: Poste vs Empalme</div>
                <div style={{ flex: 1, minHeight: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={zonasFiltradas} margin={{ top: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={THEME.bg} />
                      <XAxis dataKey="zona" {...axisProps} tickMargin={10} />
                      <YAxis hide />
                      <Tooltip cursor={{fill: THEME.bg}} />
                      <Legend iconType="square" wrapperStyle={{ fontFamily: THEME.fontMono, fontSize: '10px' }} />
                      <Bar dataKey="corte_en_poste" stackId="a" fill={THEME.primary} name="Poste" barSize={24}>
                        <LabelList dataKey="corte_en_poste" position="center" style={{ fontSize: 10, fontFamily: THEME.fontMono, fill: '#fff' }} />
                      </Bar>
                      <Bar dataKey="corte_en_empalme" stackId="a" fill={THEME.secondary} name="Empalme" radius={[4, 4, 0, 0]}>
                        <LabelList dataKey="corte_en_empalme" position="top" style={{ fontSize: 10, fontFamily: THEME.fontMono, fill: THEME.textMuted }} />
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
                      <Bar dataKey="cortes_ejecutados" fill={THEME.slate} name="Ejec." barSize={16}>
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
                      <Bar dataKey="reconexiones_programadas" fill={THEME.teal} name="Prog." barSize={16}>
                        <LabelList dataKey="reconexiones_programadas" position="top" style={{ fontSize: 10, fontFamily: THEME.fontMono, fill: THEME.textMuted }} />
                      </Bar>
                      <Bar dataKey="reconexiones_ejecutadas" fill={THEME.secondary} name="Ejec." barSize={16}>
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
                <h3 style={{ margin: 0, color: '#fff', fontSize: '14px', fontWeight: 600 }}>Estado por Cuadrilla Detallado (Multi-Zona)</h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
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
                      <th style={tableHeaderStyle}>Cumpl. % Prom. según Meta</th>
                      <th style={tableHeaderStyle}>Cumpl. Corte s/Carga</th>
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
                    <tr style={{ background: '#f2f4f6' }}>
                      <td style={{...tableCellStyle, fontWeight: 700}}>{filtroZona === 'Todas' ? totalFiltrado!.zona : totalFiltrado!.zona}</td>
                      <td style={{...tableCellStyle, fontWeight: 700}}>{totalFiltrado!.brigadas_operativas}</td>
                      <td style={{...tableCellStyle, fontWeight: 700}}>{totalFiltrado!.reconexiones_programadas}</td>
                      <td style={{...tableCellStyle, fontWeight: 700}}>{totalFiltrado!.reconexiones_ejecutadas}</td>
                      <td style={{...tableCellStyle, fontWeight: 700}}>{totalFiltrado!.corte_programado}</td>
                      <td style={{...tableCellStyle, fontWeight: 700}}>{totalFiltrado!.cortes_ejecutados}</td>
                      <td style={{...tableCellStyle, fontWeight: 700}}>{totalFiltrado!.corte_en_poste}</td>
                      <td style={{...tableCellStyle, fontWeight: 700}}>{totalFiltrado!.corte_en_empalme}</td>
                      <td style={{...tableCellStyle, fontWeight: 700}}>{totalFiltrado!.visitas_fallidas}</td>
                      <td style={{...tableCellStyle, fontWeight: 700}}>{totalFiltrado!.promedio_reconexiones}</td>
                      <td style={{...tableCellStyle, fontWeight: 700}}>{totalFiltrado!.promedio_cortes}</td>
                      <td style={{...tableCellStyle, fontWeight: 700}}>{totalFiltrado!.promedio_actividad}</td>
                      <td style={{...tableCellStyle, fontWeight: 700, color: THEME.primary}}>{totalFiltrado!.cumplimiento_meta_pct}%</td>
                      <td style={{...tableCellStyle, fontWeight: 700, color: THEME.primary}}>{totalFiltrado!.cumplimiento_corte_pct}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </section>
    </DashboardLayout>
  );
};
