package Templa.Tesis.App.dtos;

import Templa.Tesis.App.Enums.RolUsuario;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UsuarioCreateDTO {
    private String username;
    private String password;
    private RolUsuario rolUsuario;
    private Integer personaDni;
}
