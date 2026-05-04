package Templa.Tesis.App.dtos;

import Templa.Tesis.App.Enums.TipoProducto;
import Templa.Tesis.App.Enums.UnidadMedida;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReporteStockBajoDTO {
    private String nombreProducto;
    private TipoProducto tipoProducto;
    private UnidadMedida unidadMedida;
    private Double stockActual;
    private Double stockMinimo;
    private Double cantidadFaltante;
    private Boolean activo;
}
