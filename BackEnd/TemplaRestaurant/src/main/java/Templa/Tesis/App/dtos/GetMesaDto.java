package Templa.Tesis.App.dtos;

import Templa.Tesis.App.Enums.EstadoMesa;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GetMesaDto {
    private Integer idMesa;
    private String numeroMesa;
    private EstadoMesa estadoMesa;
    private Double posX;
    private Double posY;
    private Integer piso;
}
