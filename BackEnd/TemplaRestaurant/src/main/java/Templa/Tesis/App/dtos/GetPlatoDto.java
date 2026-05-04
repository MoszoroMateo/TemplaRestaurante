package Templa.Tesis.App.dtos;

import Templa.Tesis.App.Enums.TipoPlato;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class GetPlatoDto {
    private Integer idPlato;
    private String nombre;
    private String descripcion;
    private Double precio;
    private TipoPlato tipoPlato;
    private Boolean disponible;
    private String foto;
    private List<GetIngredientesDto> ingredientes;
}
