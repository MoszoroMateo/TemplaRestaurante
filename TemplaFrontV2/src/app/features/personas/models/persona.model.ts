/** @see PersonaDto.java — backend contract */
export interface Persona {
  id?: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  dni: number;
  tipoPersona: TipoPersona;
  fechaBaja?: string | null;
}

/** @see PostPersonaDto.java — backend create contract */
export interface PostPersonaDto {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  dni: number;
  tipoPersona: TipoPersona;
  userAlta: number;
}

export enum TipoPersona {
  PERSONAL = 'PERSONAL',
  CLIENTE = 'CLIENTE',
}

export interface FiltroPersona {
  busqueda?: string;
  tipo?: TipoPersona;
  activo?: boolean;
  page: number;
  size: number;
}

/** Standard Spring Boot Page response */
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
}
