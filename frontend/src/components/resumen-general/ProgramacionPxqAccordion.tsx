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
import type { ProgramacionZona } from '../../types/programacionZona';

const displayNumber = (value: number | null | undefined): string => {
  return value === 0 || value === null || value === undefined ? '' : String(value);
};

interface ProgramacionPxqAccordionProps {
  pxqData: ProgramacionZona[];
  handlePxqChange: (zona: string, field: keyof ProgramacionZona, value: string) => void;
}

export const ProgramacionPxqAccordion = ({ pxqData, handlePxqChange }: ProgramacionPxqAccordionProps) => {
  return (
    <AccordionPanel
      title="PROGRAMACIÓN DIARIA POR ZONA (PXQ)"
      defaultOpen={true}
      meta={<span>{pxqData.length} zonas</span>}
    >
      <table style={tableStyle}>
        <thead>
          <tr style={tableHeadRowStyle}>
            <th style={{ ...thStyle, textAlign: 'left' }}>ZONA</th>
            <th style={thStyle}>CORTE PROG</th>
            <th style={thStyle}>ASIGN. CARGA</th>
            <th style={thStyle}>REC. PROGRAMADAS</th>
            <th style={thStyle}>ESTADO</th>
          </tr>
        </thead>
        <tbody>
          {pxqData.map((p) => (
            <tr key={p.zona} style={tableBodyRowStyle}>
              <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 'bold' }}>{p.zona}</td>
              <td style={tdStyle}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={displayNumber(p.corte_programado)}
                  onChange={(e) => handlePxqChange(p.zona, 'corte_programado', e.target.value)}
                  style={inputStyle}
                />
              </td>
              <td style={tdStyle}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={displayNumber(p.asignacion_carga)}
                  onChange={(e) => handlePxqChange(p.zona, 'asignacion_carga', e.target.value)}
                  style={inputStyle}
                />
              </td>
              <td style={tdStyle}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={displayNumber(p.reconexiones_programadas)}
                  onChange={(e) => handlePxqChange(p.zona, 'reconexiones_programadas', e.target.value)}
                  style={inputStyle}
                />
              </td>
              <td style={tdStyle}>
                {Number(p.reconexiones_programadas) > 0 ||
                Number(p.corte_programado) > 0 ||
                Number(p.asignacion_carga) > 0 ? (
                  <span style={okIconStyle}>✔</span>
                ) : (
                  <span style={warningIconStyle}>⚠</span>
                )}
              </td>
            </tr>
          ))}
          {pxqData.length === 0 && (
            <tr>
              <td colSpan={5} style={{ ...tdStyle, color: '#64748B' }}>
                No hay zonas PXQ disponibles.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </AccordionPanel>
  );
};
