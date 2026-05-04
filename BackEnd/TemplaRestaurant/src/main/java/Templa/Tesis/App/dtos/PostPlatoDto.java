package Templa.Tesis.App.dtos;

import Templa.Tesis.App.Enums.TipoPlato;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PostPlatoDto {
    private String nombre;
    private String descripcion;
    private Double precio;
    private TipoPlato tipoPlato;
    private List<PostIngredientesDto> ingredientes;
}
