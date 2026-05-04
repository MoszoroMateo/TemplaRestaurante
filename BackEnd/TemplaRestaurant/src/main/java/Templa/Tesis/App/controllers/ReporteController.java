package Templa.Tesis.App.controllers;

import Templa.Tesis.App.dtos.*;
import Templa.Tesis.App.servicies.IPedidoService;
import Templa.Tesis.App.servicies.IPlatoService;
import Templa.Tesis.App.servicies.IProductoService;
import Templa.Tesis.App.servicies.IReservaService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/reportes")
@RequiredArgsConstructor
public class ReporteController {

    private final IReservaService reservaService;
    private final IPedidoService pedidoService;
    private final IProductoService productoService;
    private final IPlatoService platoService;

    @GetMapping("/fechas-concurridas")
    public ResponseEntity<List<ReporteReservasDTO>> getFechasConcurridas(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin) {

        List<ReporteReservasDTO> reporte = reservaService.getReporteFechasConcurridas(fechaInicio, fechaFin);
        return ResponseEntity.ok(reporte);
    }

    @GetMapping("/horarios-concurridos")
    public ResponseEntity<List<ReporteReservasDTO>> getHorariosConcurridos(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin) {

        List<ReporteReservasDTO> reporte = reservaService.getReporteHorariosConcurridos(fechaInicio, fechaFin);
        return ResponseEntity.ok(reporte);
    }

    @GetMapping("/pedidos-por-fecha")
    public ResponseEntity<List<ReportePedidosPorFechaDTO>> obtenerReportePedidosPorFecha(
            @RequestParam(required = false) @DateTimeFormat(pattern = "dd-MM-yyyy") LocalDate fechaDesde,
            @RequestParam(required = false) @DateTimeFormat(pattern = "dd-MM-yyyy") LocalDate fechaHasta) {

        List<ReportePedidosPorFechaDTO> reporte = pedidoService.obtenerReportePedidosPorFecha(fechaDesde, fechaHasta);
        return ResponseEntity.ok(reporte);
    }

    @GetMapping("/menus-mas-pedidos")
    public ResponseEntity<List<ReporteMenusMasPedidosDTO>> obtenerReporteMenusMasPedidos(
            @RequestParam(required = false) @DateTimeFormat(pattern = "dd-MM-yyyy") LocalDate fechaDesde,
            @RequestParam(required = false) @DateTimeFormat(pattern = "dd-MM-yyyy") LocalDate fechaHasta) {

        List<ReporteMenusMasPedidosDTO> reporte = pedidoService.obtenerMenusMasPedidos(fechaDesde, fechaHasta);
        return ResponseEntity.ok(reporte);
    }

    @GetMapping("/productos/stock-bajo")
    public ResponseEntity<List<ReporteStockBajoDTO>> getProductosStockBajo() {
        return ResponseEntity.ok(productoService.obtenerProductosStockBajo());
    }

    @GetMapping("/platos-productos")
    public ResponseEntity<List<ReportePlatoProductosDTO>> obtenerReportePlatosPorProductos() {
        List<ReportePlatoProductosDTO> reporte = platoService.obtenerReportePlatosPorProductos();
        return ResponseEntity.ok(reporte);
    }

    @GetMapping("/clientes-reservas")
    public ResponseEntity<List<ReporteClientesReservasDTO>> obtenerReporteClientesReservas(){
        List<ReporteClientesReservasDTO> reporte = reservaService.obtenerReporteClientesPorReserva();
        return ResponseEntity.ok(reporte);
    }

}
