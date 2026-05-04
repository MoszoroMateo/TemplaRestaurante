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
public class UsuarioDTO {
    private Integer id;
    private String username;
    private RolUsuario rolUsuario;
    private Boolean activo;
    private String personaNombre;
}
