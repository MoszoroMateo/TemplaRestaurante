export interface ReportePlatoProductosDTO {
  nombrePlato: string;
  cantidadProductos: number;
  platoActivo: boolean;
  tipoPlato: 'ENTRADA' | 'PLATO_PRINCIPAL' | 'POSTRE' | 'BEBIDA';
}