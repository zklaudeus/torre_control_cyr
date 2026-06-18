import React, { useState, useRef } from 'react';

interface ProcesamientoResultado {
  ok: boolean;
  fecha_operacional: string | null;
  total_filas_leidas: number;
  total_filas_limpias: number;
  duplicados_eliminados: number;
  total_resultados_calculados: number;
  total_brigadas_actualizadas: number;
  usuarios_sin_sap: string[];
  sap_sin_match: string[];
  sap_duplicados: string[];
  errores: string[];
  error?: string;
  fecha_frontend?: string;
  fecha_excel_detectada?: string;
}

interface ProcesadorOperacionalProps {
  fechaOperacional: string;
  onProcessingComplete: () => void;
}

export const ProcesadorOperacional: React.FC<ProcesadorOperacionalProps> = ({ 
  fechaOperacional,
  onProcessingComplete 
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<ProcesamientoResultado | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));
      setResultado(null);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles(Array.from(e.dataTransfer.files));
      setResultado(null);
      setError(null);
    }
  };

  const procesarArchivos = async () => {
    if (files.length === 0) return;
    
    setLoading(true);
    setError(null);
    setResultado(null);
    
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    formData.append('fecha_operacional', fechaOperacional);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/procesamiento/actualizar-resultados-brigadas`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Error en servidor: ${response.statusText}`);
      }

      const data = await response.json();
      setResultado(data);
      if (data.ok) {
        onProcessingComplete(); // Refrescar los datos del dashboard
      } else if (data.error) {
        setError(data.error);
      } else if (data.errores && data.errores.length > 0) {
        setError(data.errores.join(', '));
      }
    } catch (err: any) {
      setError(err.message || 'Error procesando archivos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h3 style={{ margin: 0, fontSize: '1rem', color: '#1E293B' }}>
          📊 Procesar Resultados Operacionales SAP
        </h3>
        <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748B' }}>
          Sube los Excel operacionales de la jornada para calcular y actualizar automáticamente los resultados de las brigadas.
        </p>
      </div>

      <div 
        style={{...dropZoneStyle, borderColor: files.length > 0 ? '#3B82F6' : '#CBD5E1'}}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          multiple 
          accept=".xlsx,.xls" 
          style={{ display: 'none' }} 
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        {files.length > 0 ? (
          <div>
            <span style={{ fontWeight: 600, color: '#3B82F6' }}>{files.length} archivo(s) seleccionado(s)</span>
            <ul style={{ margin: '8px 0 0', paddingLeft: '20px', fontSize: '0.85rem', textAlign: 'left', color: '#475569' }}>
              {files.map(f => <li key={f.name}>{f.name}</li>)}
            </ul>
          </div>
        ) : (
          <div>
            <span style={{ fontWeight: 600, color: '#64748B' }}>Haz clic o arrastra los archivos Excel aquí</span>
            <br />
            <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>(Puedes subir múltiples archivos de SAPUI5 a la vez)</span>
          </div>
        )}
      </div>

      <div style={actionsStyle}>
        <button 
          onClick={() => { setFiles([]); setResultado(null); setError(null); }} 
          disabled={files.length === 0 || loading}
          style={clearBtnStyle}
        >
          Limpiar
        </button>
        <button 
          onClick={procesarArchivos} 
          disabled={files.length === 0 || loading}
          style={processBtnStyle}
        >
          {loading ? 'Procesando...' : 'Procesar Resultados'}
        </button>
      </div>

      {error && (
        <div style={errorStyle}>
          <strong>Error:</strong> {error}
          
          {resultado && resultado.fecha_frontend && resultado.fecha_excel_detectada && (
            <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #FECACA' }}>
              <div>Fecha seleccionada: <strong>{resultado.fecha_frontend}</strong></div>
              <div>Fecha en Excel: <strong>{resultado.fecha_excel_detectada}</strong></div>
            </div>
          )}
        </div>
      )}

      {resultado && resultado.ok && (
        <div style={resultStyle}>
          <h4 style={{ margin: '0 0 8px', color: '#166534' }}>✅ Procesamiento Completado</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.9rem' }}>
            <div>Filas leídas: <strong>{resultado.total_filas_leidas}</strong></div>
            <div>Duplicados eliminados: <strong>{resultado.duplicados_eliminados}</strong></div>
            <div>Usuarios calculados: <strong>{resultado.total_resultados_calculados}</strong></div>
            <div>Brigadas actualizadas: <strong style={{ color: '#047857' }}>{resultado.total_brigadas_actualizadas}</strong></div>
          </div>
          
          {(resultado.sap_sin_match.length > 0 || resultado.usuarios_sin_sap.length > 0) && (
            <div style={warningsStyle}>
              <strong style={{ color: '#B45309' }}>Advertencias:</strong>
              {resultado.sap_sin_match.length > 0 && (
                <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                  Códigos SAP en Excel que no están planificados hoy: {resultado.sap_sin_match.join(', ')}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Styles
const containerStyle: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  borderRadius: '8px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  border: '1px solid #E2E8F0',
  padding: '16px',
  marginBottom: '20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px'
};

const headerStyle: React.CSSProperties = {
  borderBottom: '1px solid #F1F5F9',
  paddingBottom: '8px',
};

const dropZoneStyle: React.CSSProperties = {
  border: '2px dashed',
  borderRadius: '6px',
  padding: '24px',
  textAlign: 'center',
  cursor: 'pointer',
  backgroundColor: '#F8FAFC',
  transition: 'all 0.2s',
};

const actionsStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '12px',
};

const btnBaseStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: '4px',
  fontWeight: 500,
  fontSize: '0.9rem',
  cursor: 'pointer',
  border: 'none',
  transition: 'background-color 0.2s',
};

const processBtnStyle: React.CSSProperties = {
  ...btnBaseStyle,
  backgroundColor: '#3B82F6',
  color: 'white',
};

const clearBtnStyle: React.CSSProperties = {
  ...btnBaseStyle,
  backgroundColor: '#F1F5F9',
  color: '#475569',
};

const resultStyle: React.CSSProperties = {
  backgroundColor: '#F0FDF4',
  border: '1px solid #BBF7D0',
  borderRadius: '6px',
  padding: '12px',
  color: '#166534',
};

const errorStyle: React.CSSProperties = {
  backgroundColor: '#FEF2F2',
  border: '1px solid #FECACA',
  borderRadius: '6px',
  padding: '12px',
  color: '#991B1B',
  fontSize: '0.9rem',
};

const warningsStyle: React.CSSProperties = {
  backgroundColor: '#FFFBEB',
  border: '1px solid #FDE68A',
  borderRadius: '4px',
  padding: '8px',
  marginTop: '8px',
  color: '#92400E',
};
