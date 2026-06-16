export interface BrigadaParseada {
  zona: string;
  codigo_sap: string;
  usuario: string;
  patente: string;
  tipo_brigada: string;
}

export const parseBrigadasIniciales = (text: string): BrigadaParseada[] => {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split('\t').map(h => h.toLowerCase().trim());
  
  const getIndex = (possibleNames: string[]) => {
    return headers.findIndex(h => possibleNames.some(p => h.includes(p)));
  };

  const idxZona = getIndex(['zona', 'zonal']);
  const idxSap = getIndex(['sap', 'código', 'codigo']);
  const idxUsuario = getIndex(['usuario', 'nombre', 'técnico', 'tecnico', 'brigada']);
  const idxPatente = getIndex(['patente', 'ppu']);
  const idxTipo = getIndex(['tipo']);

  const results: BrigadaParseada[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('\t').map(c => c.trim());
    
    // Safely get column values
    const zona = idxZona >= 0 ? cols[idxZona] : '';
    const codigo_sap = idxSap >= 0 ? cols[idxSap] : '';
    const usuario = idxUsuario >= 0 ? cols[idxUsuario] : '';
    const patente = idxPatente >= 0 ? cols[idxPatente] : '';
    let tipo_brigada = idxTipo >= 0 ? cols[idxTipo] : 'PXQ';
    if (!['PXQ', 'CF'].includes(tipo_brigada)) {
      tipo_brigada = 'PXQ';
    }

    if (codigo_sap || usuario || patente) {
      results.push({ zona, codigo_sap, usuario, patente, tipo_brigada });
    }
  }

  return results;
};
