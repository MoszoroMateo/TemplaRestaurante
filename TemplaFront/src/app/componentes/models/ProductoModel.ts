export interface Producto {
    id?: number;
    nombre: string;
    tipo: TipoProducto;
    unidadMedida: UnidadMedida;
    stockActual: number;
    stockMinimo: number;
    stockMaximo: number;
    activo?: boolean;
    precio: number;
}

export interface PostProductoDTO {
    nombre: string;
    tipo: TipoProducto;
    unidadMedida: UnidadMedida;
    stockActual: number;
    stockMinimo: number;
    stockMaximo: number;
    activo?: boolean;
    precio: number;
}

export interface ProductoDTO {
    id?: number;
    nombre: string;
    tipo: TipoProducto;
    unidadMedida: UnidadMedida;
    stockActual: number;
    stockMinimo: number;
    stockMaximo: number;
    activo?: boolean;
    precio: number;
}

// ✅ DTO para filtros que coincide con tu backend
export interface GetProductosFiltroDTO {
    buscar?: string;
    tipoProducto?: string; // 'INSUMO' | 'ACOMPAÑANTE' | 'BEBIDA' | ''
    activo?: string; // 'ACTIVOS' | 'INACTIVOS' | 'TODOS'
    page?: number;
    size?: number;
}

// ✅ Interface para filtros del frontend
export interface FiltroProducto {
    busqueda?: string;
    tipo?: TipoProducto | '';
    activo?: boolean;
    page: number;
    size: number;
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