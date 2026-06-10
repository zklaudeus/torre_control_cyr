import { AccordionPanel } from '../dashboard/AccordionPanel';
import {
  tableStyle,
  tableHeadRowStyle,
  thStyle,
  tableBodyRowStyle,
  tdStyle,
  inputStyle,
  okIconStyle,
  warningIconStyle,
} from '../../styles/dashboardStyles';
import type { ProgramacionCFZona } from '../../types/cf';

const displayNumber = (value: number | null | undefined): string => {
  return value === 0 || value === null || value === undefined ? '' : String(value);
};

interface ProgramacionCfAccordionProps {
  cfData: ProgramacionCFZona[];
  handleCfChange: (zona: string, field: keyof ProgramacionCFZona, value: string) => void;
}

export const ProgramacionCfAccordion = ({ cfData, handleCfChange }: ProgramacionCfAccordionProps) => {
  const cfRows = cfData.filter((c) => c.zona === 'Coquimbo' || c.zona === 'Talca');

  return (
    <AccordionPanel
      title="PROGRAMACIÓN DIARIA POR ZONA (CF)"
      meta={<span>{cfRows.length} zonas</span>}
    >
      <table style={tableStyle}>
        <thead>
          <tr style={tableHeadRowStyle}>
            <th style={{ ...thStyle, textAlign: 'left' }}>ZONA</th>
            <th style={thStyle}>CORTES PROG</th>
            <th style={thStyle}>TOTAL REC. PROGRAMADAS</th>
            <th style={thStyle}>ESTADO</th>
          </tr>
        </thead>
        <tbody>
          {cfRows.map((c) => (
            <tr key={c.zona} style={tableBodyRowStyle}>
              <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 'bold' }}>{c.zona}</td>
              <td style={tdStyle}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={displayNumber(c.cortes_programados)}
                  onChange={(e) => handleCfChange(c.zona, 'cortes_programados', e.target.value)}
                  style={inputStyle}
                />
              </td>
              <td style={tdStyle}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={displayNumber(c.reconexiones_programadas)}
                  onChange={(e) => handleCfChange(c.zona, 'reconexiones_programadas', e.target.value)}
                  style={inputStyle}
                />
              </td>
              <td style={tdStyle}>
                {Number(c.cortes_programados) > 0 || Number(c.reconexiones_programadas) > 0 ? (
                  <span style={okIconStyle}>✔</span>
                ) : (
                  <span style={warningIconStyle}>⚠</span>
                )}
              </td>
            </tr>
          ))}
          {cfRows.length === 0 && (
            <tr>
              <td colSpan={4} style={{ ...tdStyle, color: '#64748B' }}>
                No hay datos CF para Coquimbo o Talca.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </AccordionPanel>
  );
};
