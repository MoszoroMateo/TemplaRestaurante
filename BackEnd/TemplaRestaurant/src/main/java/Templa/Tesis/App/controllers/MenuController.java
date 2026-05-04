package Templa.Tesis.App.controllers;

import Templa.Tesis.App.dtos.GetMenuDTO;
import Templa.Tesis.App.dtos.PostMenuDTO;
import Templa.Tesis.App.dtos.MensajeAdvertenciaDTO;
import Templa.Tesis.App.servicies.IMenuService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/menu")
@RequiredArgsConstructor
public class MenuController {

    private final IMenuService menuService;

    @GetMapping("/menus")
    public ResponseEntity<Page<GetMenuDTO>> getMenus(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(menuService.getMenus(page, size));
    }

    @GetMapping("/filtrar")
    public ResponseEntity<Page<GetMenuDTO>> getMenusConFiltros(
            @RequestParam(required = false) String buscarFiltro,
            @RequestParam(required = false) String estado,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(menuService.getMenus(buscarFiltro, estado, page, size));
    }


    @PostMapping("/crear")
    public ResponseEntity<GetMenuDTO> createMenu(@RequestBody PostMenuDTO postMenuDTO) {
        GetMenuDTO menuCreado = menuService.createMenu(postMenuDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(menuCreado);
    }

    @PutMapping("/actualizar")
    public ResponseEntity<GetMenuDTO> actualizarMenu(@RequestBody GetMenuDTO menuActualizar) {
        GetMenuDTO menuActualizado = menuService.actualizarMenu(menuActualizar);
        return ResponseEntity.ok(menuActualizado);
    }

    @PutMapping("/activar-desactivar/{id}")
    public ResponseEntity<MensajeAdvertenciaDTO> activarDesactivarMenu(@PathVariable Integer id) {
        String mensaje = menuService.activarDesactivarMenu(id);
        return ResponseEntity.ok(new MensajeAdvertenciaDTO(mensaje));
    }

    @DeleteMapping("/baja/{id}")
    public ResponseEntity<String> bajaMenu(@PathVariable Integer id) {
        menuService.bajaMenu(id);
        return ResponseEntity.ok("Menú dado de baja correctamente");
    }
}
