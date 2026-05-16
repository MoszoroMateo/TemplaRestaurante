export enum RolUsuario {
  ADMINISTRADOR = 'ADMINISTRADOR',
  MOZO = 'MOZO',
  COCINA = 'COCINA',
  ENCARGADO = 'ENCARGADO',
  CLIENTE = 'CLIENTE'
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface JwtPayload {
  sub: string;      // username
  userId: number;   // ID del usuario
  rol: RolUsuario; // Rol
  iat: number;      // Issued At (automático)
  exp: number;      // Expiración
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface VerifyResetTokenRequest {
  email: string;
  token: string;
}

export interface ResetPasswordRequest {
  email: string;
  token: string;
  newPassword: string;
}