// Modelo para los menús del restaurante (coincide con backend)
export interface GetMenuDTO {
    id?: number;
    nombre: string;
    descripcion?: string;
    precio: number;
    disponibleDesde?: string; // LocalDate como string
    disponibleHasta?: string; // LocalDate como string
    activo: boolean;
    productos: GetProductosMenuDto[];
}

export interface GetProductosMenuDto {
    idPlato?: number;
    idProducto?: number;
}

export interface PostMenuDTO {
    nombre: string;
    descripcion?: string;
    precio: number;
    disponibleDesde?: string; // LocalDate como string "yyyy-MM-dd"
    disponibleHasta?: string; // LocalDate como string "yyyy-MM-dd"
    productos: PostProductosMenuDto[];
}

export interface PostProductosMenuDto {
    idPlato?: number;
    idProducto?: number;
   

}

export interface FiltroMenu {
    busqueda?: string;
    estado?: string; // 'ACTIVO' | 'INACTIVO' | 'TODOS'
    page: number;
    size: number;
}

// Interfaces adicionales para la UI
export interface MenuConDetalles extends GetMenuDTO {
    // Información enriquecida para mostrar en la UI
    nombrePlato?: string;
    nombreProducto?: string;
    precioPlato?: number;
    precioProducto?: number;
    tipoProducto?: string;
}