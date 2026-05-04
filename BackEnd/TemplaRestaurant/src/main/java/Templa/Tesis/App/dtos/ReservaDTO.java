package Templa.Tesis.App.dtos;

import Templa.Tesis.App.Enums.EstadoReserva;
import Templa.Tesis.App.Enums.EventoReserva;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReservaDTO {
    private Integer id;
    private int idPersona;
    private String nombrePersona;
    private int idDisponibilidad;
    private int nroReserva;
    private int cantidadComensales;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate fechaReserva;
    private EventoReserva evento;
    @JsonFormat(pattern = "HH:mm")
    private LocalTime horario;
    private Boolean requierePago;
    private Boolean pagoCompletado;
    private String mercadoPagoPaymentId;
    private EstadoReserva estadoReserva;
}
