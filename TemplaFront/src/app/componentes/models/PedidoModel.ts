export interface GetPedidoDto {
    idPedido: number;
    numeroMesa: string;
    nombreUsuario: string;
    fechaHora: number[]|string; 
    total: number;
    estado: string;
    detalles: GetPedidoDetalleDto[];
}

export interface GetPedidoDetalleDto {
    idPedidoDetalle: number;
    idItem: number; 
    nombreItem: string; 
    tipo: 'PLATO' | 'MENU' | 'PRODUCTO';
    cantidad: number;
    precioUnitario: number;
    estado: EstadoPedidoDetalle;
}

export interface PostPedidoDto {
    idMesa: number;
    idMozo: number;
    detalles: PostPedidoDetalleDto[];
}

export interface PostPedidoDetalleDto {
    idPlato?: number;
    idMenu?: number;
    idProducto?: number;
    cantidad: number;
}

export enum EstadoPedido {
    ORDENADO = 'ORDENADO',
    EN_PROCESO = 'EN_PROCESO',
    LISTO_PARA_ENTREGAR = 'LISTO_PARA_ENTREGAR',
    ENTREGADO = 'ENTREGADO',
    FINALIZADO = 'FINALIZADO',
    CANCELADO = 'CANCELADO'
}

export enum EstadoPedidoDetalle {
    PENDIENTE = 'PENDIENTE',
    EN_PREPARACION = 'EN_PREPARACION',
    LISTO_PARA_ENTREGAR = 'LISTO_PARA_ENTREGAR',
    ENTREGADO = 'ENTREGADO',
    CANCELADO = 'CANCELADO'
}

export interface FiltrosPedido {
    buscarFiltro?: string;
    estado?: string;
    fechaDesde?: string; 
    fechaHasta?: string;
}