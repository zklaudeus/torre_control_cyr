export interface UsuarioApp {
  id: string;
  nombre: string;
  usuario: string;
  password?: string;
  rol: 'supervisor' | 'admin' | 'superadmin' | 'torre_control' | 'gerencia';
  zonasAsignadas?: string[];
  tiposBrigadaPermitidos?: ('PXQ' | 'CF')[];
  supervisorId?: number;
}

export const USUARIOS_TEMP: UsuarioApp[] = [
  {
    id: 'superadmin',
    nombre: 'Super Admin',
    usuario: 'superadmin',
    rol: 'superadmin',
    zonasAsignadas: ['TODAS'],
    tiposBrigadaPermitidos: ['PXQ', 'CF'],
  },
  {
    id: 'torre-control-claudio',
    nombre: 'Claudio',
    usuario: 'claudio',
    rol: 'torre_control',
  },
  {
    id: 'supervisor-juan-munoz',
    nombre: 'Juan Muñoz',
    usuario: 'juan.munoz',
    rol: 'supervisor',
    zonasAsignadas: ['Concepción', 'Los Ángeles', 'Chillán'],
    tiposBrigadaPermitidos: ['PXQ'],
    supervisorId: 1,
  },
  {
    id: 'supervisor-jose-masso',
    nombre: 'Jose Masso',
    usuario: 'jose.masso',
    rol: 'supervisor',
    zonasAsignadas: ['Talca'],
    tiposBrigadaPermitidos: ['PXQ', 'CF'],
    supervisorId: 3,
  },
  {
    id: 'supervisor-eduardo-beltran',
    nombre: 'Eduardo Beltrán',
    usuario: 'eduardo.beltran',
    rol: 'supervisor',
    zonasAsignadas: ['Iquique'],
    tiposBrigadaPermitidos: ['PXQ'],
    supervisorId: 4,
  },
  {
    id: 'supervisor-nicolas-farias',
    nombre: 'Nicolas Farias',
    usuario: 'nicolas.farias',
    rol: 'supervisor',
    zonasAsignadas: ['Coquimbo'],
    tiposBrigadaPermitidos: ['PXQ', 'CF'],
    supervisorId: 5,
  },
  {
    id: 'supervisor-cynthia-garrido',
    nombre: 'Cynthia Garrido',
    usuario: 'cynthia.garrido',
    rol: 'supervisor',
    zonasAsignadas: ['Santa Cruz'],
    tiposBrigadaPermitidos: ['PXQ'],
    supervisorId: 6,
  },
];
