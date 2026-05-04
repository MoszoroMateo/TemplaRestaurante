export interface Persona {
  id?: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  dni: string;
  tipoPersona: TipoPersona | null;
  fechaBaja?: string;
  activo?: boolean;
}

export interface PostPersonaDto {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  dni: number;           // ✅ int, no string
  tipoPersona: TipoPersona; // ✅ tipoPersona, no tipo
  userAlta: number;      // ✅ ID del usuario que crea
}

export enum TipoPersona {
  PERSONAL = 'PERSONAL',
  CLIENTE = 'CLIENTE'
}

export enum EstadoPersona {
  ACTIVO = 'ACTIVO',
  BAJA = 'BAJA',
  TODOS = 'TODOS'
}

export interface FiltroPersona {
  busqueda?: string; // Para nombre, apellido, email, telefono, dni
  tipo?: TipoPersona | '';
  activo?: boolean;
  page?: number;
  size?: number;
}