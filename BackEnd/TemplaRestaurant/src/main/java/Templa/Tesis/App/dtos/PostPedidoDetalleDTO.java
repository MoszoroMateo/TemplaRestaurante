package Templa.Tesis.App.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostPedidoDetalleDTO {
    private Integer idPlato;
    private Integer idMenu;
    private Integer idProducto;
    private double cantidad;
}
