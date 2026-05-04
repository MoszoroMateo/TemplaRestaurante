import { EventoReserva } from './EventoReserva';

/**
 * Datos de la reserva para crear una reserva VIP con pago
 */
export interface ReservaVipData {
  idPersona: number;
  //idDisponibilidad: number;
  nroReserva: number;
  cantidadComensales: number;
  fechaReserva: string; // formato "yyyy-MM-dd"
  evento: EventoReserva.VIP; // Debe ser VIP
  horario: string; // formato "HH:mm"
  nombreCliente?: string;
  telefonoCliente?: string;
  ocasionEspecial?: string;
}

/**
 * Request completo para crear una reserva VIP con Mercado Pago
 */
export interface ReservaVipRequest {
  reservaData: ReservaVipData;
  emailCliente: string;
  nombreCliente: string;
}

/**
 * Respuesta del backend al crear una reserva VIP
 * Contiene los links de pago de Mercado Pago
 */
export interface ReservaVipResponse {
  reservaId: number;
  preferenceId: string;
  initPoint: string; // URL de pago para producción
  sandboxInitPoint: string; // URL de pago para pruebas (sandbox)
  publicKey: string; // Public key de Mercado Pago para el checkout
  requierePago: boolean;
  monto: number; // Precio de la reserva VIP en ARS
}

/**
 * Estados posibles de un pago en Mercado Pago
 */
export enum EstadoPago {
  APPROVED = 'approved',
  PENDING = 'pending',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  IN_PROCESS = 'in_process',
  IN_MEDIATION = 'in_mediation',
  CHARGED_BACK = 'charged_back'
}

/**
 * Respuesta del endpoint de verificación de pago
 */
export interface VerificarPagoResponse {
  estado: EstadoPago;
  mensaje?: string;
}
