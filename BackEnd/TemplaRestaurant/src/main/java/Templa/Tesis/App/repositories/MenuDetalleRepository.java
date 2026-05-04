package Templa.Tesis.App.repositories;

import Templa.Tesis.App.entities.MenuDetalleEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MenuDetalleRepository extends JpaRepository<MenuDetalleEntity,Integer> {
    List<MenuDetalleEntity> findByMenuId(Integer menuId);
}
