package Templa.Tesis.App.dtos;

import Templa.Tesis.App.Enums.EstadoPedidoDetalle;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GetPedidoDetalleDTO {
    private Integer idPedidoDetalle;
    private Integer idItem; // Puede ser idPlato, idMenu o idProducto
    private String nombreItem; // Nombre del plato/menú/producto
    private String tipo; // "PLATO", "MENU", "PRODUCTO"
    private Double cantidad;
    private double precioUnitario;
    private EstadoPedidoDetalle estado;
}
