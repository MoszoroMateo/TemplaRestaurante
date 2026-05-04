package Templa.Tesis.App.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificacionDTO {
    private String tipo;
    private String mensaje;
    private Object datos;
    private LocalDateTime timestamp;
}
