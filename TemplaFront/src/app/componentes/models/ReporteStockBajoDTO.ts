export interface ReporteStockBajoDTO {
  nombreProducto: string;
  tipoProducto: TipoProducto;
  unidadMedida: UnidadMedida;
  stockActual: number;
  stockMinimo: number;
  cantidadFaltante: number;
  activo: boolean;
}

export enum TipoProducto {
  INSUMO = 'INSUMO',
  ACOMPAÑANTE = 'ACOMPAÑANTE',
  BEBIDA = 'BEBIDA'
}

export enum UnidadMedida {
  KILOGRAMO = 'KILOGRAMO',
  LITRO = 'LITRO',
  GRAMO = 'GRAMO',
  UNIDAD = 'UNIDAD'
}