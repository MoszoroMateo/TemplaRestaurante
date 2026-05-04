package Templa.Tesis.App.controllers;

import Templa.Tesis.App.Enums.EstadoMesa;
import Templa.Tesis.App.dtos.GetMesaDto;
import Templa.Tesis.App.dtos.PostMesaDto;
import Templa.Tesis.App.dtos.UpdateMesaPosicionDto;
import Templa.Tesis.App.servicies.IMesasService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/mesas")
@RequiredArgsConstructor
public class MesaController {
    private final IMesasService mesasService;


    @GetMapping("/mesas")
    public ResponseEntity<Page<GetMesaDto>> listarMesas(@RequestParam(defaultValue = "0") int page,
                                                        @RequestParam(defaultValue = "10") int size) {
        Page<GetMesaDto> mesas = mesasService.getMesas(page, size);
        return ResponseEntity.ok(mesas);
    }

    @GetMapping("/mesasFiltradas")
    public ResponseEntity<Page<GetMesaDto>> listarMesasFiltradas(
            @RequestParam(required = false) String buscarFiltro,
            @RequestParam(required = false) String estado,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<GetMesaDto> mesas = mesasService.getMesas(buscarFiltro, estado, page, size);
        return ResponseEntity.ok(mesas);
    }

    @PostMapping("/crear")
    public ResponseEntity<GetMesaDto> crearMesa(@RequestBody PostMesaDto nuevaMesa) {
        return ResponseEntity.ok(mesasService.createMesa(nuevaMesa));
    }

    @PutMapping("/actualizar")
    public ResponseEntity<GetMesaDto> actualizarMesa(@RequestBody GetMesaDto mesaActualizar){
        return ResponseEntity.ok(mesasService.updateMesa(mesaActualizar));
    }

    @PutMapping("/cambiarEstado")
    public ResponseEntity<GetMesaDto> cambiarEstadoMesa(@RequestParam Integer id, @RequestParam EstadoMesa nuevoEstado){
        return ResponseEntity.ok(mesasService.cambiarEstadoMesa(id, nuevoEstado));
    }

    @PutMapping("/actualizarPosicion")
    public ResponseEntity<GetMesaDto> actualizarPosicionMesa(
            @Valid @RequestBody UpdateMesaPosicionDto dto) {
        try {
            GetMesaDto mesaActualizada = mesasService.actualizarPosicionMesa(dto);
            return ResponseEntity.ok(mesaActualizada);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/posiciones")
    public ResponseEntity<List<GetMesaDto>> obtenerMesasConPosiciones() {
        List<GetMesaDto> mesas = mesasService.getMesasConPosicion();
        return ResponseEntity.ok(mesas);
    }

    @GetMapping("/piso/{numeroPiso}")
    public ResponseEntity<List<GetMesaDto>> obtenerMesasPorPiso(
            @PathVariable Integer numeroPiso) {
        try {
            List<GetMesaDto> mesas = mesasService.obtenerMesasPorPiso(numeroPiso);
            return ResponseEntity.ok(mesas);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/desvincular/{idMesa}")
    public ResponseEntity<Void> desvincularMesaDelPlano(@PathVariable Integer idMesa) {
        try {
            mesasService.desvincularMesaDelPlano(idMesa);
            return ResponseEntity.noContent().build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{idMesa}/vinculada")
    public ResponseEntity<Boolean> estaVinculada(@PathVariable Integer idMesa) {
        boolean vinculada = mesasService.estaVinculada(idMesa);
        return ResponseEntity.ok(vinculada);
    }
}
