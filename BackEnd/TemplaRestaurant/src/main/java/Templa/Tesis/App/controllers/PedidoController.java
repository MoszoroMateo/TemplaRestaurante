package Templa.Tesis.App.controllers;

import Templa.Tesis.App.dtos.PedidoDTO;
import Templa.Tesis.App.dtos.PostPedidoDTO;
import Templa.Tesis.App.servicies.IPedidoService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/pedido")
@RequiredArgsConstructor
public class PedidoController {

    private final IPedidoService pedidoService;

    @PostMapping("/crear")
    public ResponseEntity<PedidoDTO> registrarPedido(@RequestBody PostPedidoDTO postPedidoDTO){
        return ResponseEntity.ok(pedidoService.crearPedido(postPedidoDTO));
    }

    @GetMapping("/obtener/{id}")
    public ResponseEntity<PedidoDTO> obtenerPedido(@PathVariable Integer id){
        return ResponseEntity.ok(pedidoService.obtenerPedido(id));

    }

    @GetMapping
    public ResponseEntity<Page<PedidoDTO>> obtenerPedidos(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) LocalDate fechaDesde,
            @RequestParam(required = false) LocalDate fechaHasta,
            @RequestParam(required = false) String buscarFiltro,
            @RequestParam(required = false) String estado
    ){
        return ResponseEntity.ok(pedidoService.listarPedidos(page,size,buscarFiltro,estado,fechaDesde,fechaHasta));
    }

    @PutMapping("/actualizar/{id}")
    public ResponseEntity<PedidoDTO> actualizarPedido(@PathVariable Integer id,
                                                      @RequestBody PostPedidoDTO postPedidoDTO){
        if (postPedidoDTO.getDetalles() != null && !postPedidoDTO.getDetalles().isEmpty()) {
            PedidoDTO updated = pedidoService.insertarDetalles(id, postPedidoDTO);
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.badRequest().build();
    }

    @DeleteMapping("/cancelar/{id}")
    public ResponseEntity<PedidoDTO> cancelarPedido(@PathVariable Integer id){
        return ResponseEntity.ok(pedidoService.cancelarPedido(id));
    }

    @PostMapping("/cancelar-detalles/{id}")
    public ResponseEntity<PedidoDTO> cancelarDetalles(@PathVariable Integer id){
        return ResponseEntity.ok(pedidoService.cancelarDetalle(id));
    }

    @PostMapping("/cancelar-detalle/{idPedido}/{idDetalle}")
    public ResponseEntity<PedidoDTO> cancelarDetalleEspecifico(
            @PathVariable Integer idPedido,
            @PathVariable Integer idDetalle){
        return ResponseEntity.ok(pedidoService.cancelarDetalleEspecifico(idPedido, idDetalle));
    }

    @PostMapping("/entregar-detalles/{id}")
    public ResponseEntity<PedidoDTO> marcarDetallesEntregados(@PathVariable Integer id){
        return ResponseEntity.ok(pedidoService.marcarDetalleEntregado(id));
    }

    @PostMapping("/iniciar/{id}")
    public ResponseEntity<PedidoDTO> iniciarPedido(@PathVariable Integer id){
        return ResponseEntity.ok(pedidoService.iniciarPedido(id));
    }

    @PostMapping("/listo-para-entregar/{id}")
    public ResponseEntity<PedidoDTO> marcarDetallesListosParaEntregar(@PathVariable Integer id){
        return ResponseEntity.ok(pedidoService.marcarDetalleParaEntregar(id));
    }

    @PostMapping("/finalizar/{id}")
    public ResponseEntity<PedidoDTO> finalizarPedido(@PathVariable Integer id){
        return ResponseEntity.ok(pedidoService.finalizarPedido(id));
    }

    @GetMapping("/mesa/{idMesa}")
    public ResponseEntity<PedidoDTO> obtenerPedidoActivoPorMesa(@PathVariable Integer idMesa) {
        try {
            PedidoDTO pedido = pedidoService.getPedidoByMesa(idMesa);
            return ResponseEntity.ok(pedido);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
