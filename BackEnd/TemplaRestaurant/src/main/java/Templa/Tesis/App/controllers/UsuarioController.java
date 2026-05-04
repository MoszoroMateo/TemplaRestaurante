package Templa.Tesis.App.controllers;

import Templa.Tesis.App.dtos.UsuarioCreateDTO;
import Templa.Tesis.App.dtos.UsuarioDTO;
import Templa.Tesis.App.dtos.UsuarioUpdateDTO;
import Templa.Tesis.App.entities.UsuarioEntity;
import Templa.Tesis.App.servicies.UsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuario")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService usuarioService;

    @PostMapping("/crear")
    public ResponseEntity<UsuarioDTO> registrarUsuario(@RequestBody UsuarioCreateDTO usuarioCreateDTO){
        return ResponseEntity.ok(usuarioService.crearUsuario(usuarioCreateDTO));
    }

    @GetMapping("/buscar/{id}")
    public ResponseEntity<UsuarioDTO> buscarUsuario(@PathVariable Integer id){
        return ResponseEntity.ok(usuarioService.buscarUsuarioPorId(id));
    }

    @GetMapping("/listar")
    public ResponseEntity<List<UsuarioDTO>> listarUsuarios(){
        return ResponseEntity.ok(usuarioService.listarUsuarios());
    }

    @PutMapping("/editar/{id}")
    @Operation(summary = "Editar usuario", description = "Requiere rol ADMINISTRADOR")
    public ResponseEntity<UsuarioDTO> actualizarUsuario(
            @PathVariable Integer id,
            @RequestBody UsuarioUpdateDTO usuarioUpdateDTO) {
        return ResponseEntity.ok(usuarioService.actualizarUsuario(id, usuarioUpdateDTO));
    }

    @DeleteMapping("/eliminar/{id}")
    public ResponseEntity<Void> eliminarUsuario(@PathVariable Integer id){
        usuarioService.eliminarUsuario(id);
        return ResponseEntity.ok().build();
    }
}
