package Templa.Tesis.App.dtos;

import Templa.Tesis.App.Enums.TipoPersona;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PostPersonaDto {
    private String nombre;
    private String apellido;

    private String email;
    private String telefono;

    private int dni;
    private TipoPersona tipoPersona;
    private int userAlta;
}
