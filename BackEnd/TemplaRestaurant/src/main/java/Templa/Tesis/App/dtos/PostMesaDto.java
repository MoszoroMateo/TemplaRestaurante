package Templa.Tesis.App.dtos;

import Templa.Tesis.App.Enums.EstadoMesa;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PostMesaDto {
    private String numeroMesa;
    private EstadoMesa estadoMesa;
}
