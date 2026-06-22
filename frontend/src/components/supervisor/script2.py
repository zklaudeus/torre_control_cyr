import re

path = 'c:/Users/claud/Desktop/TorreDeControl/frontend/src/components/supervisor/SupervisorBitacoraView.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

inline_tbody = '''              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.id} style={{ background: row.id === editId ? `${K.secondary}22` : (i % 2 === 0 ? 'transparent' : K.tertiary), transition: 'background 0.2s' }}>
                    <td style={{ padding: '0.85rem 1rem', borderBottom: `1px solid ${K.border}`, fontSize: '0.85rem', color: K.neutral }}>
                      <input 
                        value={row.patente} 
                        onChange={e => handleInlineChange(row.id, 'patente', e.target.value)} 
                        maxLength={6} 
                        style={{ ...inputStyle(!!row._errors?.patente), padding: '0.4rem', width: '80px' }} 
                        title={row._errors?.patente}
                      />
                    </td>
                    <td style={{ padding: '0.85rem 1rem', borderBottom: `1px solid ${K.border}`, fontSize: '0.85rem', color: K.neutral }}>
                      <select 
                        value={row.cuenta} 
                        onChange={e => handleInlineChange(row.id, 'cuenta', e.target.value)} 
                        style={{ ...inputStyle(!!row._errors?.cuenta), padding: '0.4rem', width: '120px' }}
                        title={row._errors?.cuenta}
                      >
                        <option value="">Sel...</option>
                        {Array.from(new Set([row.cuenta, ...cuentasDisponibles])).filter(Boolean).map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', borderBottom: `1px solid ${K.border}`, fontSize: '0.85rem', color: K.neutral }}>
                      <div title={row._errors?.usuarioSap} style={{ color: row._errors?.usuarioSap ? K.error : 'inherit' }}>
                        {row.usuarioSap}
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', borderBottom: `1px solid ${K.border}`, fontSize: '0.85rem', color: K.neutral }}>
                      <input 
                        value={row.brigada} 
                        onChange={e => handleInlineChange(row.id, 'brigada', e.target.value)} 
                        style={{ ...inputStyle(!!row._errors?.brigada), padding: '0.4rem', width: '100px' }} 
                        title={row._errors?.brigada}
                      />
                    </td>
                    <td style={{ padding: '0.85rem 1rem', borderBottom: `1px solid ${K.border}`, fontSize: '0.85rem', color: K.neutral }}>
                      <select 
                        value={row.tipoBrigada} 
                        onChange={e => handleInlineChange(row.id, 'tipoBrigada', e.target.value)} 
                        style={{ ...inputStyle(!!row._errors?.tipoBrigada), padding: '0.4rem', width: '70px' }}
                        title={row._errors?.tipoBrigada}
                      >
                        <option value="PXQ">PXQ</option>
                        {(!(user?.rol === 'supervisor') || (user as any)?.tiposBrigadaPermitidos?.includes('CF')) && (
                          <option value="CF">CF</option>
                        )}
                      </select>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', borderBottom: `1px solid ${K.border}`, fontSize: '0.85rem', color: K.neutral }}>
                      <input 
                        value={row.pareja} 
                        onChange={e => handleInlineChange(row.id, 'pareja', e.target.value)} 
                        style={{ ...inputStyle(!!row._errors?.pareja), padding: '0.4rem', width: '100px' }} 
                        title={row._errors?.pareja}
                      />
                    </td>
                    <td style={{ padding: '0.85rem 1rem', borderBottom: `1px solid ${K.border}`, fontSize: '0.85rem', color: K.neutral }}>
                      {row.zona || obtenerZonaPorComuna(row.comuna, comunasMap)}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', borderBottom: `1px solid ${K.border}`, fontSize: '0.85rem', color: K.neutral }}>
                      <input 
                        type="number" min="0"
                        value={row.carga} 
                        onChange={e => handleInlineChange(row.id, 'carga', e.target.value)} 
                        style={{ ...inputStyle(!!row._errors?.carga), padding: '0.4rem', width: '60px' }} 
                        title={row._errors?.carga}
                      />
                    </td>
                    <td style={{ padding: '0.85rem 1rem', borderBottom: `1px solid ${K.border}`, fontSize: '0.85rem', color: K.neutral }}>
                      <input 
                        type="number" min="0"
                        value={row.reconexiones} 
                        onChange={e => handleInlineChange(row.id, 'reconexiones', e.target.value)} 
                        style={{ ...inputStyle(!!row._errors?.reconexiones), padding: '0.4rem', width: '60px' }} 
                        title={row._errors?.reconexiones}
                      />
                    </td>
                    <td style={{ padding: '0.85rem 1rem', borderBottom: `1px solid ${K.border}`, fontSize: '0.85rem', color: K.neutral }}>
                      <select 
                        value={row.estado} 
                        onChange={e => handleInlineChange(row.id, 'estado', e.target.value)} 
                        style={{ ...inputStyle(!!row._errors?.estado), padding: '0.4rem', width: '90px', color: row.estado === 'Operativa' ? K.secondary : K.error }}
                        title={row._errors?.estado}
                      >
                        <option value="Operativa">Operativa</option>
                        <option value="Inactiva">Inactiva</option>
                      </select>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', borderBottom: `1px solid ${K.border}`, textAlign: 'right' }}>
                      <button onClick={() => editarFila(row.id)} title="Editar Formulario Completo" style={{ background: 'transparent', color: K.primary, border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0 0.5rem', marginRight: '0.25rem' }}>✎</button>
                      <button onClick={() => eliminarFila(row.id)} title="Eliminar" style={{ background: 'transparent', color: K.error, border: 'none', cursor: 'pointer', fontSize: '1.4rem', padding: '0 0.5rem' }}>×</button>
                    </td>
                  </tr>
                ))}
              </tbody>'''

content = re.sub(r'              <tbody>.*?</tbody>', inline_tbody, content, flags=re.DOTALL | re.MULTILINE)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
