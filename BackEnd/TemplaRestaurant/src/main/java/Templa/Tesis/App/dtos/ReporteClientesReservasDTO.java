package Templa.Tesis.App.dtos;

import Templa.Tesis.App.Enums.EventoReserva;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReporteClientesReservasDTO {
    private String nombreCompleto;
    private String email;
    private String telefono;
    private Long totalReservas;
    private EventoReserva eventoMasFrecuente;
}
