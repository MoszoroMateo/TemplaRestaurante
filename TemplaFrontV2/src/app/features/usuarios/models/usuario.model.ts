/** @see RolUsuario.java — backend contract */
export enum RolUsuario {
  ADMINISTRADOR = 'ADMINISTRADOR',
  MOZO = 'MOZO',
  COCINA = 'COCINA',
  ENCARGADO = 'ENCARGADO',
}

/** @see UsuarioDTO.java — backend contract */
export interface UsuarioDTO {
  id: number;
  username: string;
  rolUsuario: RolUsuario;
  activo: boolean;
  personaNombre: string | null;
}

/** @see UsuarioCreateDTO.java — backend create contract */
export interface UsuarioCreateDTO {
  username: string;
  password: string;
  rolUsuario: RolUsuario;
  personaDni?: number;
}

/** @see UsuarioUpdateDTO.java — backend update contract */
export interface UsuarioUpdateDTO {
  username: string;
  password?: string;
  rolUsuario: RolUsuario;
  activo: boolean;
}

/** Client-side filters (no server pagination — computed signals) */
export interface FiltroUsuario {
  busqueda?: string;
  rol?: RolUsuario;
  activo?: boolean;
  page: number;
  size: number;
}
