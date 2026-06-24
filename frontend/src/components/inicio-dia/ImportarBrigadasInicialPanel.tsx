import { useState } from 'react';
import { AccordionPanel } from '../dashboard/AccordionPanel';
import { actionBtnStyle } from '../../styles/dashboardStyles';

interface ImportarBrigadasInicialPanelProps {
  onProcesar: (texto: string) => void;
  loading: boolean;
}

export const ImportarBrigadasInicialPanel = ({ onProcesar, loading }: ImportarBrigadasInicialPanelProps) => {
  const [texto, setTexto] = useState('');

  return (
    <AccordionPanel title="IMPORTAR REPORTE DEL SUPERVISOR" defaultOpen={true}>
      <div style={{ padding: '1rem' }}>
        <p style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
          Pega aquí las filas desde Excel. Asegúrate de incluir los encabezados (Zona, SAP, Patente, Usuario, Tipo).
        </p>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Pegar tabla aquí..."
          style={{
            width: '100%',
            height: '150px',
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            color: '#1E293B',
            padding: '0.5rem',
            borderRadius: '4px',
            fontFamily: 'var(--mono)',
            fontSize: '0.75rem',
            resize: 'vertical',
            boxSizing: 'border-box'
          }}
        />
        <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => onProcesar(texto)}
            disabled={loading || texto.trim().length === 0}
            style={{
              ...actionBtnStyle,
              background: '#0e7490',
              color: '#1E293B',
              border: 'none',
              opacity: loading || texto.trim().length === 0 ? 0.5 : 1
            }}
          >
            {loading ? 'Procesando...' : 'Analizar y Comparar'}
          </button>
        </div>
      </div>
    </AccordionPanel>
  );
};
