export interface GetMesaDto{
    idMesa: number;
    numeroMesa: string;
    estadoMesa: EstadoMesa;
    posX?: number;
    posY?: number;
    piso?: number;
}

export enum EstadoMesa{
    DISPONIBLE = 'DISPONIBLE',
    OCUPADA = 'OCUPADA',
    RESERVADA = 'RESERVADA',
    FUERA_SERVICIO = 'FUERA_SERVICIO',
    TODOS = 'TODOS'
}

export interface PostMesaDto{
    numeroMesa: string;
    estadoMesa: EstadoMesa;
    posX?: number;
    posY?: number;
    piso?: number;
}
