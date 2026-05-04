export interface DisponibilidadModel {
  id?: number;
  fecha: string; // formato "yyyy-MM-dd"
  cuposOcupados: number;
  cuposMaximos: number;
  activo: boolean;
}

export interface PostDisponibilidadModel {
  fecha: string; // formato "yyyy-MM-dd"
  cuposOcupados: number;
  cuposMaximos: number;
  activo: boolean;
}