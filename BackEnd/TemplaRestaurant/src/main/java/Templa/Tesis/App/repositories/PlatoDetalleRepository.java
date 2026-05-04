package Templa.Tesis.App.repositories;

import Templa.Tesis.App.entities.PlatoDetalleEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlatoDetalleRepository extends JpaRepository<PlatoDetalleEntity, Integer> {
    List<PlatoDetalleEntity> findByPlatoIdPlato(Integer id);

    @Query(value = "SELECT * FROM Plato_Detalle_Entity pd WHERE pd.plato.idplato = :platoId", nativeQuery = true)
    List<Object[]> findDetallesByPlatoIdNative(@Param("platoId") Integer platoId);
}
