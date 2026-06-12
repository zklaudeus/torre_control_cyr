export interface UsuarioApp {
  id: string;
  nombre: string;
  usuario: string;
  password?: string;
  rol: 'supervisor' | 'admin' | 'superadmin';
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
  }
];
