package Templa.Tesis.App.controllers;

import Templa.Tesis.App.dtos.GetPlatoDto;
import Templa.Tesis.App.dtos.PostPlatoDto;
import Templa.Tesis.App.dtos.MensajeAdvertenciaDTO;
import Templa.Tesis.App.servicies.IPlatoService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;


@RestController
@RequestMapping("/api/platos")
@RequiredArgsConstructor
public class PlatoController {

    private final IPlatoService platoService;

    @GetMapping("/platos")
    public ResponseEntity<Page<GetPlatoDto>> getPlatos(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(platoService.getPlatos(page, size));
    }

    @PostMapping(value = "/crear", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<GetPlatoDto> createPlato(
            @RequestPart("plato") PostPlatoDto platoNuevo,
            @RequestPart(value = "imagen", required = false) MultipartFile imagen) {

        return ResponseEntity.ok(platoService.createPlato(platoNuevo, imagen));
    }

    @PutMapping(value ="/actualizar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<GetPlatoDto> actualizarPlato(@RequestPart("plato") GetPlatoDto plato,
                                                       @RequestPart(value = "imagen", required = false) MultipartFile imagen) {
        return ResponseEntity.ok(platoService.updatePlato(plato, imagen));
    }

    @DeleteMapping("/activarDesactivarPlato/{id}")
    public ResponseEntity<MensajeAdvertenciaDTO> activarDesactivarPlato(@PathVariable Integer id) {
        String mensaje = platoService.activarDesactivarPlato(id);
        return ResponseEntity.ok(new MensajeAdvertenciaDTO(mensaje));
    }

    @GetMapping("/filtrar")
    public ResponseEntity<Page<GetPlatoDto>> getPlatosFiltrados(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String buscarFiltro,
            @RequestParam(required = false) String tipoPlato, // ✅ CAMBIAR: de Boolean a String
            @RequestParam(required = false) String estado     // ✅ AGREGAR: parámetro estado
    ) {
        if (tipoPlato != null && !tipoPlato.isEmpty() &&
                !tipoPlato.matches("^(ENTRADA|PRINCIPAL|POSTRE|BEBIDA|TODOS)$")) { // Ajustar según tus enum values
            throw new IllegalArgumentException("tipoPlato debe ser 'ENTRADA', 'PRINCIPAL', 'POSTRE' o 'BEBIDA' o 'TODOS'");
        }

        if (estado != null && !estado.isEmpty() &&
                !estado.matches("^(DISPONIBLES|NO_DISPONIBLES|BAJA|TODOS)$")) {
            throw new IllegalArgumentException("estado debe ser 'DISPONIBLES', 'NO_DISPONIBLES', 'BAJA' o 'TODOS'");
        }

        Page<GetPlatoDto> platos = platoService.getPlatos(buscarFiltro, tipoPlato, estado, page, size);
        return ResponseEntity.ok(platos);
    }

    @DeleteMapping("/borrar/{id}")
    public ResponseEntity<Void> bajaPlato(@PathVariable Integer id) {
            try {
                platoService.bajaPlato(id);
                return ResponseEntity.ok().build();
            } catch (Exception e) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error al dar de baja el Plato");
            }
    }
}
