package Templa.Tesis.App.repositories;

import Templa.Tesis.App.entities.ProductoEntity;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductoRepository extends JpaRepository<ProductoEntity,Integer>, JpaSpecificationExecutor<ProductoEntity> {

    ProductoEntity findByNombre(String nombre);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM ProductoEntity p WHERE p.id = :id")
    Optional<ProductoEntity> findByIdWithLock(@Param("id") Integer id);

    @Query("SELECT p.nombre, p.tipo, p.unidadMedida, p.stockActual, p.stockMinimo, p.activo " +
            "FROM ProductoEntity p " +
            "WHERE p.stockActual <= p.stockMinimo " +
            "ORDER BY p.activo DESC, (p.stockMinimo - p.stockActual) DESC")
    List<Object[]> findProductosStockBajo();

    @Query("SELECT " +
            "COUNT(p), " +
            "SUM(CASE WHEN p.activo = true THEN 1 ELSE 0 END), " +
            "SUM(CASE WHEN p.activo = false THEN 1 ELSE 0 END), " +
            "SUM(CASE WHEN p.tipo = 'INSUMO' THEN 1 ELSE 0 END), " +
            "SUM(CASE WHEN p.tipo = 'ACOMPAÑANTE' THEN 1 ELSE 0 END), " +
            "SUM(CASE WHEN p.tipo = 'BEBIDA' THEN 1 ELSE 0 END), " +
            "SUM(CASE WHEN p.stockActual <= p.stockMinimo / 2 THEN 1 ELSE 0 END), " +
            "SUM(CASE WHEN p.stockActual <= p.stockMinimo THEN 1 ELSE 0 END), " +
            "SUM(CASE WHEN p.stockActual > p.stockMinimo THEN 1 ELSE 0 END), " +
            "COALESCE(SUM(p.stockActual * p.precio), 0) " +
            "FROM ProductoEntity p")
    List<Object[]> findStats();

}
