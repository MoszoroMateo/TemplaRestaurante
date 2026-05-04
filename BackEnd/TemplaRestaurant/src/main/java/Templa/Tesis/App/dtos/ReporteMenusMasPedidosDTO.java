package Templa.Tesis.App.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReporteMenusMasPedidosDTO {
    private String nombreMenu;
    private Integer cantidadPedidos;
}
