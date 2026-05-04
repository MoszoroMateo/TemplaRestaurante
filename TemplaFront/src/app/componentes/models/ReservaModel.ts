import { EventoReserva } from './EventoReserva';

export interface ReservaModel {
  id?: number;
  idPersona: number;
  //idDisponibilidad: number;
  nroReserva: number;
  cantidadComensales: number;
  fechaReserva: string; // formato "yyyy-MM-dd"
  evento: EventoReserva;
  horario: string; // formato "HH:mm"
  // Campo que viene del backend con el nombre completo de la persona
  nombrePersona?: string;
  // Datos opcionales del cliente (cuando estén disponibles)
  nombreCliente?: string;
  apellidoCliente?: string;
  // Campos de Mercado Pago
  requierePago?: boolean;
  pagoCompletado?: boolean;
  mercadoPagoPaymentId?: string;
  mercadoPagoPreferenceId?: string;
  estadoReserva?: EstadoReserva;
}

/**
 * Estados posibles de una reserva
 */
export enum EstadoReserva {
  PENDIENTE_PAGO = 'PENDIENTE_PAGO',
  CONFIRMADA = 'CONFIRMADA',
  CANCELADA = 'CANCELADA'
}

export interface PostReservaModel {
  idPersona: number;
  //idDisponibilidad: number;
  nroReserva: number;
  cantidadComensales: number;
  fechaReserva: string; // formato "yyyy-MM-dd"
  evento: EventoReserva;
  horario: string; // formato "HH:mm"
  nombreCliente?: string;
  telefonoCliente?: string;
  ocasionEspecial?: string;
}