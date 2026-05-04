package Templa.Tesis.App.repositories;

import Templa.Tesis.App.entities.PedidoDetalleEntity;
import Templa.Tesis.App.entities.PedidoEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PedidoDetalleRepository extends JpaRepository<PedidoDetalleEntity,Integer> {
    void deleteByPedidoId(Integer id);
    //List<PedidoDetalleEntity> findPedidoDetalleByPedidoId(Integer id);
}
