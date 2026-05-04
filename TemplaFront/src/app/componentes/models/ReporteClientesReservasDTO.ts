import { EventoReserva } from './EventoReserva';

export interface ReporteClientesReservasDTO {
  nombreCompleto: string;
  email: string;
  telefono: string;
  totalReservas: number;
  eventoMasFrecuente: EventoReserva;
}

// ✅ Interface para datos del gráfico de torta
export interface ClienteReservaChartData {
  name: string;
  value: number;
  email: string;
  telefono: string;
  eventoFrecuente: string;
}