package Templa.Tesis.App.controllers;

import Templa.Tesis.App.dtos.DisponibilidadDTO;
import Templa.Tesis.App.dtos.PostDisponibilidadDTO;
import Templa.Tesis.App.servicies.IDisponibilidadService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/disponibilidad")
@RequiredArgsConstructor
public class DisponibilidadController {

    private final IDisponibilidadService disponibilidadService;

    // ========================================
    // ENDPOINTS PROTEGIDOS (para el admin)
    // ========================================

    @PostMapping("/crear")
    public ResponseEntity<DisponibilidadDTO> crearDisponibilidad(@RequestBody PostDisponibilidadDTO postDisponibilidadDTO) {
        DisponibilidadDTO disponibilidadCreada = disponibilidadService.createDisponibilidad(postDisponibilidadDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(disponibilidadCreada);
    }

    @GetMapping("/listar")
    public ResponseEntity<List<DisponibilidadDTO>> listarDisponibilidades() {
        return ResponseEntity.ok(disponibilidadService.getAllDisponibilidades());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DisponibilidadDTO> obtenerDisponibilidadPorId(@PathVariable Integer id) {
        return ResponseEntity.ok(disponibilidadService.getDisponibilidadById(id));
    }

    @PutMapping("/editar/{id}")
    public ResponseEntity<DisponibilidadDTO> actualizarDisponibilidad(
            @PathVariable Integer id,
            @RequestBody PostDisponibilidadDTO postDisponibilidadDTO) {
        return ResponseEntity.ok(disponibilidadService.putDisponibilidad(id, postDisponibilidadDTO));
    }

    // ========================================
    //  ENDPOINTS PÚBLICOS (para la landing)
    // ========================================

    // GET /api/disponibilidad/publica - Lista todas las disponibilidades
    @GetMapping("/publica")
    public ResponseEntity<List<DisponibilidadDTO>> listarPublica() {
        return ResponseEntity.ok(disponibilidadService.getAllDisponibilidades());
    }

    // POST /api/disponibilidad/publica - Crea una nueva disponibilidad
    @PostMapping("/publica")
    public ResponseEntity<DisponibilidadDTO> crearPublica(@RequestBody PostDisponibilidadDTO postDisponibilidadDTO) {
        DisponibilidadDTO disponibilidadCreada = disponibilidadService.createDisponibilidad(postDisponibilidadDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(disponibilidadCreada);
    }

}
