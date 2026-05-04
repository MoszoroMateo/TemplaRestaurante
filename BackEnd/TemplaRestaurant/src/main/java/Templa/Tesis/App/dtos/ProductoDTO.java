package Templa.Tesis.App.dtos;

import Templa.Tesis.App.Enums.TipoProducto;
import Templa.Tesis.App.Enums.UnidadMedida;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductoDTO {
    private Integer id;
    private String nombre;
    private TipoProducto tipo;
    private UnidadMedida unidadMedida;
    private Double stockActual;
    private Double stockMinimo;
    private Double stockMaximo;
    private boolean activo;
    private Double precio;
}
