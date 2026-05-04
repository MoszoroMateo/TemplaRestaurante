export interface GetPlatoDto {
    idPlato: number;
    nombre: string;
    descripcion: string;
    precio: number;
    tipoPlato: TipoPlato;
    disponible: boolean;
    foto: string;
    ingredientes: GetIngredientesDto[];
}

export interface GetIngredientesDto {
    idProducto: number;
    cantidad: number;
}

export enum TipoPlato {
    ENTRADA = 'ENTRADA',
    PRINCIPAL = 'PRINCIPAL',
    POSTRE = 'POSTRE',
    BEBIDA = 'BEBIDA'
}

export interface PostPlatoDto {
    nombre: string;
    descripcion: string;
    precio: number;
    tipoPlato: TipoPlato;
    ingredientes: PostIngredientesDto[];
}

export interface PostIngredientesDto {
    id: number;
    cantidad: number; 
}