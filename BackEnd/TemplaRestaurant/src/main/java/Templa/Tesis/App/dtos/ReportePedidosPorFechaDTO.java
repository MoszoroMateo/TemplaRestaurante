package Templa.Tesis.App.dtos;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReportePedidosPorFechaDTO {
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate fecha;
    private Integer cantidadPedidos;
}
