package Templa.Tesis.App.repositories;

import Templa.Tesis.App.Enums.EstadoPedido;
import Templa.Tesis.App.entities.PedidoEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PedidoRepository extends JpaRepository<PedidoEntity,Integer>, JpaSpecificationExecutor<PedidoEntity> {
    @Query("SELECT p FROM PedidoEntity p WHERE p.mesa.idMesa = :idMesa AND p.estado IN (Templa.Tesis.App.Enums.EstadoPedido.EN_PROCESO, Templa.Tesis.App.Enums.EstadoPedido.ORDENADO)")
    Optional<PedidoEntity> findPedidoActivoByMesa(@Param("idMesa") Integer idMesa);

    @Query("SELECT CAST(p.fechaPedido AS date) as fecha, " +
            "COUNT(p) as cantidadPedidos " +
            "FROM PedidoEntity p " +
            "WHERE p.fechaPedido >= :fechaDesdeInicio AND p.fechaPedido < :fechaHastaFin " +
            "AND p.estado != :estadoCancelado " +
            "GROUP BY CAST(p.fechaPedido AS date) " +
            "ORDER BY CAST(p.fechaPedido AS date)")
    List<Object[]> obtenerCantidadPedidosPorFecha(@Param("fechaDesdeInicio") LocalDateTime fechaDesdeInicio,
                                                  @Param("fechaHastaFin") LocalDateTime fechaHastaFin,
                                                  @Param("estadoCancelado") EstadoPedido estadoCancelado);


    @Query("SELECT m.nombre as nombreMenu, " +
            "COUNT(pd. idPedidoDetalle) as cantidadPedidos " +
            "FROM PedidoEntity p " +
            "JOIN p.detalles pd " +
            "JOIN pd.menu m " +
            "WHERE p. fechaPedido >= :fechaDesdeInicio AND p.fechaPedido < :fechaHastaFin " +
            "AND p.estado != :estadoCancelado " +
            "GROUP BY m.id, m.nombre " +
            "ORDER BY COUNT(pd.idPedidoDetalle) DESC")
    List<Object[]> obtenerMenusMasPedidos(@Param("fechaDesdeInicio") LocalDateTime fechaDesde,
                                          @Param("fechaHastaFin") LocalDateTime fechaHasta,
                                          @Param("estadoCancelado") EstadoPedido estadoCancelado);

}
