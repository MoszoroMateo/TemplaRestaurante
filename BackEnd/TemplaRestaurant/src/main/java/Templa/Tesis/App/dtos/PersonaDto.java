package Templa.Tesis.App.dtos;

import Templa.Tesis.App.Enums.TipoPersona;
import jakarta.annotation.Nullable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigInteger;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PersonaDto {
    @Nullable
    private Integer id;
    private String nombre;
    private String apellido;
    private String email;
    private String telefono;
    private int dni;
    private TipoPersona tipoPersona;
    private LocalDateTime fechaBaja;


//    public PersonaDto(String nombre, String apellido, String email, int telefono, int dni, TipoPersona tipoPersona) {
//        this.nombre = nombre;
//        this.apellido = apellido;
//        this.email = email;
//        this.telefono = telefono;
//        this.dni = dni;
//        this.tipoPersona = tipoPersona;
//    }
}
