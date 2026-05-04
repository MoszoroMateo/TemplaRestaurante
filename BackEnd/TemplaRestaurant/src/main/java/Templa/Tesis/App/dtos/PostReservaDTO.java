package Templa.Tesis.App.dtos;

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
public class PostReservaDTO {
    private int idPersona;
    //private int idDisponibilidad;
    private int nroReserva;
    private int cantidadComensales;
    private LocalDate fechaReserva;
    private EventoReserva evento;
    @JsonFormat(pattern = "HH:mm")
    private LocalTime horario;

    // Campos adicionales para reservas VIP
    private String nombreCliente;
    private String telefonoCliente;
    private String ocasionEspecial;
}
