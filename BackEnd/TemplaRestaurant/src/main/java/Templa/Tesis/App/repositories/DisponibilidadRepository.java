package Templa.Tesis.App.repositories;

import Templa.Tesis.App.entities.DisponibilidadEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;

@Repository
public interface DisponibilidadRepository extends JpaRepository<DisponibilidadEntity,Integer> {

    DisponibilidadEntity findByFecha(LocalDate fecha);
}
