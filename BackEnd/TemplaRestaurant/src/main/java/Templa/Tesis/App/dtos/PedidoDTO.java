package Templa.Tesis.App.dtos;

import Templa.Tesis.App.Enums.EstadoPedido;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PedidoDTO {
    private Integer idPedido;
    private String numeroMesa;
    private String nombreUsuario;
    private LocalDateTime fechaHora;
    private double total;
    private String estado;
    private List<GetPedidoDetalleDTO> detalles;
}
