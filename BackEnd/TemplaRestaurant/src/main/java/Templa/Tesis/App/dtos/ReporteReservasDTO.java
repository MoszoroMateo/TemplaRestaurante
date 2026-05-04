package Templa.Tesis.App.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReporteReservasDTO {
    private String periodo; //fehca o horario
    private Long totalReservas;
    private Long totalComensales;
}
