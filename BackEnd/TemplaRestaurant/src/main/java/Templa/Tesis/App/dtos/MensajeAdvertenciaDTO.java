package Templa.Tesis.App.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para retornar mensajes de advertencia en operaciones exitosas.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class MensajeAdvertenciaDTO {
    private String mensaje;
}
