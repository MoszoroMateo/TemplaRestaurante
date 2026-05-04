package Templa.Tesis.App.servicies;

import Templa.Tesis.App.dtos.PedidoDTO;
import Templa.Tesis.App.dtos.PostPedidoDTO;
import Templa.Tesis.App.dtos.ReporteMenusMasPedidosDTO;
import Templa.Tesis.App.dtos.ReportePedidosPorFechaDTO;
import Templa.Tesis.App.entities.PedidoEntity;
import Templa.Tesis.App.repositories.PedidoRepository;
import org.springframework.data.domain.Page;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface IPedidoService {
    PedidoDTO crearPedido(PostPedidoDTO dto);
    PedidoDTO obtenerPedido(Integer id);
    Page<PedidoDTO> listarPedidos(int page, int size, String buscarFiltro, String estadoPedido,
                                     LocalDate fechaDesde, LocalDate fechaHasta);
    PedidoDTO cancelarPedido(Integer idPedido);
    PedidoDTO cancelarDetalle(Integer idPedido);
    PedidoDTO cancelarDetalleEspecifico(Integer idPedido, Integer idDetalle);
    PedidoDTO marcarDetalleEntregado(Integer idPedido);
    PedidoDTO iniciarPedido(Integer idPedido);
    PedidoDTO marcarDetalleParaEntregar(Integer idPedido);
    PedidoDTO finalizarPedido(Integer idPedido);
    PedidoDTO insertarDetalles(Integer idPedido, PostPedidoDTO dto);
    PedidoDTO getPedidoByMesa(Integer idMesa);

    List<ReportePedidosPorFechaDTO> obtenerReportePedidosPorFecha(LocalDate fechaDesde, LocalDate fechaHasta);
    List<ReporteMenusMasPedidosDTO> obtenerMenusMasPedidos(LocalDate fechaDesde, LocalDate fechaHasta);

}
