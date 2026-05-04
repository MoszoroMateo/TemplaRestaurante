package Templa.Tesis.App.repositories;

import Templa.Tesis.App.entities.MesaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MesaRepository extends JpaRepository<MesaEntity, Integer>, JpaSpecificationExecutor<MesaEntity> {
    Optional<MesaEntity> findByNumeroMesa(String numeroMesa);

    @Query("SELECT m FROM MesaEntity m WHERE m.posX IS NOT NULL AND m.posY IS NOT NULL AND m.piso IS NOT NULL")
    List<MesaEntity> findAllConPosicion();

    @Query("SELECT m FROM MesaEntity m WHERE m.piso = :piso")
    List<MesaEntity> findByPiso(@Param("piso") Integer piso);

    @Query("SELECT CASE WHEN COUNT(m) > 0 THEN true ELSE false END FROM MesaEntity m WHERE m.idMesa = :idMesa AND m.posX IS NOT NULL")
    boolean estaVinculada(@Param("idMesa") Integer idMesa);
}

