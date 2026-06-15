export interface UsuarioApp {
  id: string;
  nombre: string;
  usuario: string;
  password?: string;
  rol: 'supervisor' | 'admin' | 'superadmin' | 'torre_control';
  zonasAsignadas?: string[];
}

export const USUARIOS_TEMP: UsuarioApp[] = [
  {
    id: "superadmin",
    nombre: "Super Admin",
    usuario: "superadmin",
    password: "admin123",
    rol: "superadmin",
    zonasAsignadas: ["TODAS"]
  },
  {
    id: "supervisor-juan-munoz",
    nombre: "Juan Muñoz",
    usuario: "juan.munoz",
    password: "123", // simplificado para pruebas
    rol: "supervisor" as const,
    zonasAsignadas: ["Concepción", "Los Ángeles", "Chillán"]
  },
  {
    // Temporal, se migrará a auth real en backend
    id: "supervisor-talca-piloto",
    nombre: "Supervisor Talca Piloto",
    usuario: "supervisor.talca",
    password: "admin123",
    rol: "supervisor" as const,
    zonasAsignadas: ["Talca"]
  },
  {
    id: "torre-control-claudio",
    nombre: "Claudio",
    usuario: "claudio",
    password: btoa("admin123"), // Ofuscado temporalmente, backend no usa hash todavía
    rol: "torre_control" as const,
  }
];
