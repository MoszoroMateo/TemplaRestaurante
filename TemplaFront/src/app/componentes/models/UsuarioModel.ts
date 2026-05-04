// UsuarioDTO.ts - Modelo corregido
export interface Usuario {
  id?: number;
  username: string;
  password?: string;
  rolUsuario: RolUsuario;
  personaId?: number;
  activo?: boolean;
}

export interface UsuarioCreateDTO {
  username: string;
  password: string;
  rolUsuario: RolUsuario;
  personaDni?: number | null; // ✅ Opcional: puede no tener persona asociada
}

// Interface que coincide con lo que devuelve tu backend
export interface UsuarioDTO {
  id?: number;
  username: string;
  rolUsuario: RolUsuario;
  activo: boolean;
  personaNombre?: string;
}

export interface UsuarioUpdateDTO {
  username: string;
  password?: string;
  rolUsuario: RolUsuario;
  activo: boolean;
  personaDni?: number;
}

export enum RolUsuario {
  ADMINISTRADOR = 'ADMINISTRADOR',
  MOZO = 'MOZO',
  COCINA = 'COCINA',
  ENCARGADO = 'ENCARGADO',
  CLIENTE = 'CLIENTE'
}

export interface FiltroUsuario {
  busqueda?: string;
  rol?: RolUsuario | '';
  activo?: boolean;
  page?: number;
  size?: number;
}

// Si necesitas paginación en el frontend
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}