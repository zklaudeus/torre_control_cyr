/**
 * supervisoresTemp.ts
 * -------------------
 * Cuentas temporales de acceso para el piloto EISESA CyR.
 * IMPORTANTE: Las claves aquí son de PRUEBA. Migrar a auth real en backend cuando se requiera.
 *
 * Reglas de negocio:
 *  - Solo nicolas.farias y jose.masso pueden operar con tipo brigada "CF".
 *  - Los demás supervisores solo ven y crean brigadas PXQ.
 *  - Cada supervisor solo ve sus zonas asignadas y sus usuarios SAP.
 */

export interface UsuarioApp {
  id: string;
  nombre: string;
  usuario: string;
  password?: string;
  rol: 'supervisor' | 'admin' | 'superadmin' | 'torre_control';
  zonasAsignadas?: string[];
  /** Tipos de brigada permitidos. Si está vacío o undefined, se asume solo PXQ. */
  tiposBrigadaPermitidos?: ('PXQ' | 'CF')[];
  /** ID numérico del supervisor en control_supervisores (para filtrar por supervisor_id) */
  supervisorId?: number;
}

// ─── Claves temporales de prueba — reemplazar con auth real en backend ─────────
export const USUARIOS_TEMP: UsuarioApp[] = [

  // ── Administradores ──────────────────────────────────────────────────────────

  {
    id: 'superadmin',
    nombre: 'Super Admin',
    usuario: 'superadmin',
    password: 'admin123', // TEMPORAL: clave de prueba
    rol: 'superadmin',
    zonasAsignadas: ['TODAS'],
    tiposBrigadaPermitidos: ['PXQ', 'CF'],
  },
  {
    id: 'torre-control-claudio',
    nombre: 'Claudio',
    usuario: 'claudio',
    password: btoa('admin123'), // TEMPORAL: ofuscado, no es hash real
    rol: 'torre_control',
  },

  // ── Supervisores CyR — Piloto EISESA ─────────────────────────────────────────

  {
    // Supervisor: Juan Muñoz — id BD: 1
    id: 'supervisor-juan-munoz',
    nombre: 'Juan Muñoz',
    usuario: 'juan.munoz',
    password: 'admin123', // TEMPORAL: clave de prueba
    rol: 'supervisor',
    zonasAsignadas: ['Concepción', 'Los Ángeles', 'Chillán'],
    tiposBrigadaPermitidos: ['PXQ'],
    supervisorId: 1,
  },
  {
    // Supervisor: Jose Masso — id BD: 3 — puede operar CF
    id: 'supervisor-jose-masso',
    nombre: 'Jose Masso',
    usuario: 'jose.masso',
    password: 'admin123', // TEMPORAL: clave de prueba
    rol: 'supervisor',
    zonasAsignadas: ['Talca'],
    tiposBrigadaPermitidos: ['PXQ', 'CF'],
    supervisorId: 3,
  },
  {
    // Supervisor: Eduardo Beltrán — id BD: 4
    id: 'supervisor-eduardo-beltran',
    nombre: 'Eduardo Beltrán',
    usuario: 'eduardo.beltran',
    password: 'admin123', // TEMPORAL: clave de prueba
    rol: 'supervisor',
    zonasAsignadas: ['Iquique'],
    tiposBrigadaPermitidos: ['PXQ'],
    supervisorId: 4,
  },
  {
    // Supervisor: Nicolas Farias — id BD: 5 — puede operar CF
    id: 'supervisor-nicolas-farias',
    nombre: 'Nicolas Farias',
    usuario: 'nicolas.farias',
    password: 'admin123', // TEMPORAL: clave de prueba
    rol: 'supervisor',
    zonasAsignadas: ['Coquimbo'],
    tiposBrigadaPermitidos: ['PXQ', 'CF'],
    supervisorId: 5,
  },
  {
    // Supervisor: Cynthia Garrido — id BD: 6
    id: 'supervisor-cynthia-garrido',
    nombre: 'Cynthia Garrido',
    usuario: 'cynthia.garrido',
    password: 'admin123', // TEMPORAL: clave de prueba
    rol: 'supervisor',
    zonasAsignadas: ['Santa Cruz'],
    tiposBrigadaPermitidos: ['PXQ'],
    supervisorId: 6,
  },
];
