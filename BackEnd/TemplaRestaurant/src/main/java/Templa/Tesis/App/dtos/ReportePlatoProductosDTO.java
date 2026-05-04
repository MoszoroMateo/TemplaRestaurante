package Templa.Tesis.App.dtos;

import Templa.Tesis.App.Enums.TipoPlato;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReportePlatoProductosDTO {
    private  String nombrePlato;
    private Integer cantidadProductos;
    private Boolean platoActivo;
    private TipoPlato tipoPlato;
}
