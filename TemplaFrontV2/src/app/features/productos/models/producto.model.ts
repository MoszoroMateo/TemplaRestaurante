/** @see backend — producto types matching the original ProductoModel.ts */
export enum TipoProducto {
  INSUMO = 'INSUMO',
  ACOMPAÑANTE = 'ACOMPAÑANTE',
  BEBIDA = 'BEBIDA',
}

export enum UnidadMedida {
  KILOGRAMO = 'KILOGRAMO',
  LITRO = 'LITRO',
  GRAMO = 'GRAMO',
  UNIDAD = 'UNIDAD',
}

/** @see backend — ProductoDTO contract */
export interface ProductoDTO {
  id?: number;
  nombre: string;
  precio: number;
  stockActual: number;
  stockMinimo: number;
  stockMaximo?: number;
  tipo: TipoProducto;
  unidadMedida: UnidadMedida;
  activo: boolean;
}

/** Request body for POST /producto/crear and PUT /producto/editar/{id} */
export interface PostProductoDTO {
  nombre: string;
  precio: number;
  stockActual: number;
  stockMinimo: number;
  stockMaximo?: number;
  tipo: TipoProducto;
  unidadMedida: UnidadMedida;
  activo?: boolean;
}

/** Global KPIs from GET /api/producto/stats */
export interface ProductoStats {
  total: number;
  activos: number;
  inactivos: number;
  insumos: number;
  acompanantes: number;
  bebidas: number;
  stockCritico: number;
  stockBajo: number;
  stockSaludable: number;
  valorInventario: number;
}

/** Client-side filters for the server-side endpoint */
export interface FiltroProducto {
  busqueda?: string;
  tipo?: TipoProducto;
  activo?: string;       // ACTIVOS | INACTIVOS | TODOS
  page: number;
  size: number;
}
