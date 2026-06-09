import { useState, useEffect } from 'react';
import { getBrigadas, getResumenBrigadas, createBrigada, updateBrigada, deleteBrigada } from '../api/brigadasDia.api';
import { getZonasActivas } from '../api/parametros.api';
import type { BrigadaDiaria, BrigadaDiariaCreate, ResumenBrigadasZona } from '../types/brigadaDia';
import type { ParametroZona } from '../types/programacionZona';

interface BrigadasDiaPageProps {
  fechaOperacional: string;
  onBack: () => void;
}

export const BrigadasDiaPage = ({ fechaOperacional, onBack }: BrigadasDiaPageProps) => {
  const [brigadas, setBrigadas] = useState<BrigadaDiaria[]>([]);
  const [resumen, setResumen] = useState<ResumenBrigadasZona[]>([]);
  const [zonas, setZonas] = useState<ParametroZona[]>([]);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<BrigadaDiariaCreate>({
    fecha_operacional: fechaOperacional,
    zona: '',
    codigo_sap: '',
    patente: '',
    usuario: '',
    tipo_brigada: 'PXQ',
    estado_brigada: 'Operativa',
    hora_primer_movimiento: '',
    observacion_brigada: ''
  });

  useEffect(() => {
    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaOperacional]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [brigadasData, resumenData, zonasData] = await Promise.all([
        getBrigadas(fechaOperacional),
        getResumenBrigadas(fechaOperacional),
        getZonasActivas()
      ]);
      setBrigadas(brigadasData);
      setResumen(resumenData);
      setZonas(zonasData);
      
      if (zonasData.length > 0 && !formData.zona) {
        setFormData(prev => ({ ...prev, zona: zonasData[0].zona }));
      }
    } catch (err) {
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleOpenForm = (brigada?: BrigadaDiaria) => {
    if (brigada) {
      setEditingId(brigada.id);
      setFormData({
        fecha_operacional: brigada.fecha_operacional,
        zona: brigada.zona,
        codigo_sap: brigada.codigo_sap,
        patente: brigada.patente,
        usuario: brigada.usuario,
        tipo_brigada: brigada.tipo_brigada,
        estado_brigada: brigada.estado_brigada,
        hora_primer_movimiento: brigada.hora_primer_movimiento || '',
        observacion_brigada: brigada.observacion_brigada || ''
      });
    } else {
      setEditingId(null);
      setFormData({
        fecha_operacional: fechaOperacional,
        zona: zonas.length > 0 ? zonas[0].zona : '',
        codigo_sap: '',
        patente: '',
        usuario: '',
        tipo_brigada: 'PXQ',
        estado_brigada: 'Operativa',
        hora_primer_movimiento: '',
        observacion_brigada: ''
      });
    }
    setError(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar esta brigada?')) return;
    try {
      await deleteBrigada(id);
      showSuccess('Brigada eliminada');
      fetchInitialData();
    } catch (err) {
      setError('Error al eliminar brigada');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validations
    if (!formData.zona || !formData.codigo_sap || !formData.patente || !formData.usuario) {
      setError('Por favor complete todos los campos obligatorios');
      return;
    }

    if (formData.estado_brigada === 'Inactiva' && !formData.observacion_brigada) {
      setError('Si el estado es Inactiva, la observación es obligatoria');
      return;
    }

    try {
      if (editingId) {
        await updateBrigada(editingId, formData);
        showSuccess('Brigada actualizada');
      } else {
        await createBrigada(formData);
        showSuccess('Brigada creada');
      }
      setIsFormOpen(false);
      fetchInitialData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al guardar brigada');
    }
  };

  if (loading) return <p>Cargando brigadas...</p>;

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <button onClick={onBack} style={{ marginBottom: '1rem', cursor: 'pointer' }}>
        &larr; Volver
      </button>

      <h1>Brigadas del día</h1>
      <h3 style={{ color: '#555' }}>Fecha operacional: {fechaOperacional}</h3>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green', fontWeight: 'bold' }}>{success}</p>}

      {!isFormOpen ? (
        <>
          <div style={{ marginBottom: '1rem' }}>
            <button 
              onClick={() => handleOpenForm()} 
              style={{ padding: '0.5rem 1rem', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              + Agregar brigada
            </button>
          </div>

          <h3>Listado de Brigadas</h3>
          {brigadas.length === 0 ? (
            <p>No hay brigadas registradas para esta fecha.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
              <thead>
                <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
                  <th style={{ padding: '0.5rem', border: '1px solid #ccc' }}>Zona</th>
                  <th style={{ padding: '0.5rem', border: '1px solid #ccc' }}>SAP</th>
                  <th style={{ padding: '0.5rem', border: '1px solid #ccc' }}>Patente</th>
                  <th style={{ padding: '0.5rem', border: '1px solid #ccc' }}>Usuario</th>
                  <th style={{ padding: '0.5rem', border: '1px solid #ccc' }}>Tipo</th>
                  <th style={{ padding: '0.5rem', border: '1px solid #ccc' }}>Estado</th>
                  <th style={{ padding: '0.5rem', border: '1px solid #ccc' }}>Hora GPS</th>
                  <th style={{ padding: '0.5rem', border: '1px solid #ccc' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {brigadas.map(b => (
                  <tr key={b.id}>
                    <td style={{ padding: '0.5rem', border: '1px solid #ccc' }}>{b.zona}</td>
                    <td style={{ padding: '0.5rem', border: '1px solid #ccc' }}>{b.codigo_sap}</td>
                    <td style={{ padding: '0.5rem', border: '1px solid #ccc' }}>{b.patente}</td>
                    <td style={{ padding: '0.5rem', border: '1px solid #ccc' }}>{b.usuario}</td>
                    <td style={{ padding: '0.5rem', border: '1px solid #ccc' }}>{b.tipo_brigada}</td>
                    <td style={{ padding: '0.5rem', border: '1px solid #ccc', color: b.estado_brigada === 'Operativa' ? 'green' : 'red' }}>
                      {b.estado_brigada}
                    </td>
                    <td style={{ padding: '0.5rem', border: '1px solid #ccc' }}>{b.hora_primer_movimiento || '-'}</td>
                    <td style={{ padding: '0.5rem', border: '1px solid #ccc' }}>
                      <button onClick={() => handleOpenForm(b)} style={{ marginRight: '0.5rem' }}>Editar</button>
                      <button onClick={() => handleDelete(b.id)} style={{ color: 'red' }}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h3>Resumen Básico por Zona</h3>
          {resumen.length === 0 ? (
            <p>No hay datos para resumir.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
              <thead>
                <tr style={{ background: '#e0f7fa', textAlign: 'left' }}>
                  <th style={{ padding: '0.5rem', border: '1px solid #ccc' }}>Zona</th>
                  <th style={{ padding: '0.5rem', border: '1px solid #ccc' }}>PXQ</th>
                  <th style={{ padding: '0.5rem', border: '1px solid #ccc' }}>CF</th>
                  <th style={{ padding: '0.5rem', border: '1px solid #ccc' }}>Convenio</th>
                  <th style={{ padding: '0.5rem', border: '1px solid #ccc' }}>Total</th>
                  <th style={{ padding: '0.5rem', border: '1px solid #ccc' }}>Operativas</th>
                  <th style={{ padding: '0.5rem', border: '1px solid #ccc' }}>Inactivas</th>
                  <th style={{ padding: '0.5rem', border: '1px solid #ccc' }}>Observación</th>
                </tr>
              </thead>
              <tbody>
                {resumen.map(r => (
                  <tr key={r.zona}>
                    <td style={{ padding: '0.5rem', border: '1px solid #ccc' }}>{r.zona}</td>
                    <td style={{ padding: '0.5rem', border: '1px solid #ccc' }}>{r.brigadas_pxq}</td>
                    <td style={{ padding: '0.5rem', border: '1px solid #ccc' }}>{r.brigadas_cf}</td>
                    <td style={{ padding: '0.5rem', border: '1px solid #ccc' }}>{r.brigadas_convenio}</td>
                    <td style={{ padding: '0.5rem', border: '1px solid #ccc', fontWeight: 'bold' }}>{r.total_brigadas_reportadas}</td>
                    <td style={{ padding: '0.5rem', border: '1px solid #ccc', color: 'green' }}>{r.brigadas_operativas}</td>
                    <td style={{ padding: '0.5rem', border: '1px solid #ccc', color: 'red' }}>{r.brigadas_inactivas}</td>
                    <td style={{ padding: '0.5rem', border: '1px solid #ccc', color: 'gray' }}>{r.observacion_automatica}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      ) : (
        <div style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px', maxWidth: '600px' }}>
          <h3>{editingId ? 'Editar Brigada' : 'Agregar Nueva Brigada'}</h3>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            <label>Zona:
              <select value={formData.zona} onChange={e => setFormData({...formData, zona: e.target.value})} style={{ width: '100%', padding: '0.5rem' }}>
                {zonas.map(z => <option key={z.id} value={z.zona}>{z.zona}</option>)}
              </select>
            </label>

            <label>Código SAP:
              <input type="text" value={formData.codigo_sap} onChange={e => setFormData({...formData, codigo_sap: e.target.value})} style={{ width: '100%', padding: '0.5rem' }} />
            </label>

            <label>Patente:
              <input type="text" value={formData.patente} onChange={e => setFormData({...formData, patente: e.target.value})} style={{ width: '100%', padding: '0.5rem' }} />
            </label>

            <label>Usuario:
              <input type="text" value={formData.usuario} onChange={e => setFormData({...formData, usuario: e.target.value})} style={{ width: '100%', padding: '0.5rem' }} />
            </label>

            <label>Tipo de Brigada:
              <select value={formData.tipo_brigada} onChange={e => setFormData({...formData, tipo_brigada: e.target.value})} style={{ width: '100%', padding: '0.5rem' }}>
                <option value="PXQ">PXQ</option>
                <option value="CF">CF</option>
                <option value="Convenio">Convenio</option>
              </select>
            </label>

            <label>Estado de Brigada:
              <select value={formData.estado_brigada} onChange={e => setFormData({...formData, estado_brigada: e.target.value})} style={{ width: '100%', padding: '0.5rem' }}>
                <option value="Operativa">Operativa</option>
                <option value="Inactiva">Inactiva</option>
              </select>
            </label>

            <label>Hora GPS (opcional):
              <input type="time" value={formData.hora_primer_movimiento || ''} onChange={e => setFormData({...formData, hora_primer_movimiento: e.target.value})} style={{ width: '100%', padding: '0.5rem' }} />
            </label>

            <label>Observación {formData.estado_brigada === 'Inactiva' && <span style={{color: 'red'}}>(Requerido)</span>}:
              <textarea value={formData.observacion_brigada || ''} onChange={e => setFormData({...formData, observacion_brigada: e.target.value})} style={{ width: '100%', padding: '0.5rem' }} rows={3} />
            </label>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" style={{ padding: '0.5rem 1rem', background: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                {editingId ? 'Guardar Cambios' : 'Crear Brigada'}
              </button>
              <button type="button" onClick={() => setIsFormOpen(false)} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>

          </form>
        </div>
      )}
    </div>
  );
};
