package Templa.Tesis.App.controllers;

import Templa.Tesis.App.Enums.TipoProducto;
import Templa.Tesis.App.dtos.GetProductosFiltroDTO;
import Templa.Tesis.App.dtos.PostProductoDTO;
import Templa.Tesis.App.dtos.ProductoDTO;
import Templa.Tesis.App.servicies.IProductoService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/producto")
@RequiredArgsConstructor
public class ProductoController {

    private final IProductoService productoService;

    @PostMapping("/crear")
    public ResponseEntity<ProductoDTO> crearProducto(@RequestBody PostProductoDTO postProductoDTO){
        return ResponseEntity.ok(productoService.registrarProducto(postProductoDTO));
    }

    @PutMapping("/editar/{id}")
    public ResponseEntity<ProductoDTO> actualizarProducto(@PathVariable Integer id,
                                                          @RequestBody ProductoDTO productoDTO){
        return ResponseEntity.ok(productoService.actualizarProducto(id, productoDTO));
    }

    @DeleteMapping("/eliminar/{id}")
    public ResponseEntity<Void> eliminarProducto(@PathVariable Integer id){
        productoService.eliminarProducto(id);
        return ResponseEntity.ok().build();
    }

    // ✅ Traer productos paginados (sin filtros)
    @GetMapping("/listar")
    public ResponseEntity<Page<ProductoDTO>> listarProductos(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(productoService.traerProductos(page, size));
    }

    // ✅ Traer productos paginados con filtros
    @GetMapping("/filtrar")
    public ResponseEntity<Page<ProductoDTO>> filtrarProductos(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            GetProductosFiltroDTO filtros) {

        // Convertir String -> Enum TipoProducto
        TipoProducto tipo = null;
        if (filtros.getTipoProducto() != null && !filtros.getTipoProducto().isBlank()) {
            tipo = TipoProducto.valueOf(filtros.getTipoProducto().toUpperCase());
        }

        // Convertir String -> Boolean
        Boolean activo = null;
        if ("ACTIVOS".equalsIgnoreCase(filtros.getActivo())) {
            activo = true;
        } else if ("INACTIVOS".equalsIgnoreCase(filtros.getActivo())) {
            activo = false;
        }

        return ResponseEntity.ok(
                productoService.traerProductos(page, size, filtros.getBuscar(), tipo, activo)
        );
    }

    // ✅ Traer solo insumos paginados
    @GetMapping("/insumos")
    public ResponseEntity<Page<ProductoDTO>> listarInsumos(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(productoService.traerInsumos(page, size));
    }
}
