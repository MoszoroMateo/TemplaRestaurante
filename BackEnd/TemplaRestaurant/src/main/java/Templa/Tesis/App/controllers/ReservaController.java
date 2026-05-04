package Templa.Tesis.App.controllers;

import Templa.Tesis.App.dtos.PostReservaDTO;
import Templa.Tesis.App.dtos.ReservaDTO;
import Templa.Tesis.App.dtos.ReservaVipRequestDto;
import Templa.Tesis.App.dtos.ReservaVipResponseDto;
import Templa.Tesis.App.servicies.IMercadoPagoService;
import Templa.Tesis.App.servicies.IReservaService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/reserva")
@RequiredArgsConstructor
public class ReservaController {
    private final IMercadoPagoService mercadoPagoService;
   private final IReservaService reservaService;

   @PostMapping("/crear")
    public ResponseEntity<ReservaDTO> registrarReserva(@RequestBody PostReservaDTO postReservaDTO){
       return ResponseEntity.ok(reservaService.createReserva(postReservaDTO));
   }

   @GetMapping("/listar")
   public ResponseEntity<Page<ReservaDTO>> listarReservas(
           @RequestParam(defaultValue = "0") int page,
           @RequestParam(defaultValue = "10") int size) {
      return ResponseEntity.ok(reservaService.traerReservas(page, size));
   }

   @GetMapping("/filtrar")
   public ResponseEntity<Page<ReservaDTO>> traerReservas(
           @RequestParam(defaultValue = "0") int page,
           @RequestParam(defaultValue = "10") int size,
           @RequestParam(required = false) String evento,
           @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
           @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta) {

      Page<ReservaDTO> reservas = reservaService.traerReservas(page, size, evento, fechaDesde, fechaHasta);
      return ResponseEntity.ok(reservas);
   }


   @PutMapping("/editar/{id}")
   public ResponseEntity<ReservaDTO> actualizarReserva(@PathVariable Integer id,
                                                       @RequestBody PostReservaDTO postReservaDTO){
      return ResponseEntity.ok(reservaService.actualizarReserva(id, postReservaDTO));
   }

   @DeleteMapping("/eliminar/{id}")
   public ResponseEntity<Void> eliminarReserva(@PathVariable Integer id){
      reservaService.eliminarReserva(id);
      return ResponseEntity.ok().build();
   }


    @PostMapping("/crear-vip")
    public ResponseEntity<ReservaVipResponseDto> crearReservaVip(
            @RequestBody ReservaVipRequestDto request) {
        return ResponseEntity.ok(reservaService.crearReservaConPago(request));
    }

    @GetMapping("/verificar-pago/{reservaId}")
    public ResponseEntity<ReservaDTO> verificarPagoReserva(@PathVariable Integer reservaId) {
        return ResponseEntity.ok(reservaService.obtenerReserva(reservaId));
    }
}
