package Templa.Tesis.App.servicies;

import Templa.Tesis.App.dtos.UsuarioCreateDTO;
import Templa.Tesis.App.dtos.UsuarioDTO;
import Templa.Tesis.App.dtos.UsuarioUpdateDTO;
import Templa.Tesis.App.entities.UsuarioEntity;

import java.util.List;

public interface UsuarioService {
    UsuarioDTO crearUsuario (UsuarioCreateDTO usuarioCreateDTO);
    UsuarioDTO actualizarUsuario(Integer id, UsuarioUpdateDTO usuarioUpdateDTO);
    List<UsuarioDTO> listarUsuarios();
    UsuarioDTO buscarUsuarioPorId(Integer id);
    void eliminarUsuario(Integer id);
}
