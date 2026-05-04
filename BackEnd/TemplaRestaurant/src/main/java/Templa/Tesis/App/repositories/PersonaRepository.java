package Templa.Tesis.App.repositories;

import Templa.Tesis.App.dtos.GetPersonasFiltroDto;
import Templa.Tesis.App.entities.PersonaEntity;
import jakarta.annotation.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PersonaRepository extends JpaRepository<PersonaEntity, Integer>, JpaSpecificationExecutor<PersonaEntity> {
    @Query("""
    SELECT p FROM PersonaEntity p 
    WHERE (:estado IS NULL OR :estado = 'TODOS' OR 
           (:estado = 'ACTIVOS' AND p.fechaBaja IS NULL) OR 
           (:estado = 'BAJA' AND p.fechaBaja IS NOT NULL))
    AND (CASE WHEN :buscarFiltro IS NULL OR :buscarFiltro = '' THEN TRUE 
              ELSE (LOWER(p.nombre) LIKE LOWER(CONCAT('%', :buscarFiltro, '%')) OR
                    LOWER(p.apellido) LIKE LOWER(CONCAT('%', :buscarFiltro, '%')) OR
                    LOWER(p.email) LIKE LOWER(CONCAT('%', :buscarFiltro, '%')) OR
                    LOWER(p.telefono) LIKE LOWER(CONCAT('%', :buscarFiltro, '%')) OR
                    CAST(p.dni AS string) LIKE CONCAT('%', :buscarFiltro, '%'))
         END)
    AND (:tipoPersona IS NULL OR :tipoPersona = '' OR p.tipoPersona = :tipoPersona)""")
    Page<PersonaEntity> findByFiltros(
            @Nullable String buscarFiltro,
            @Nullable String tipoPersona,
            @Nullable String estado,
            Pageable pageable
    );

    @Query("""
        SELECT p FROM PersonaEntity p 
        WHERE p.fechaBaja IS NULL 
        AND p.tipoPersona = 'PERSONAL'""")
    Page<PersonaEntity> findPersonal(Pageable pageable);

    @Query("SELECT p FROM PersonaEntity p WHERE p.dni = :dni AND p.fechaBaja IS NULL")
    PersonaEntity findByDni(@Param("dni") int dni);

    @Query("SELECT p FROM PersonaEntity p WHERE LOWER(CONCAT(p.nombre, ' ', p.apellido)) = LOWER(:nombreCompleto) AND p.fechaBaja IS NULL")
    PersonaEntity findByNombreCompleto(@Param("nombreCompleto") String nombreCompleto);

    /**
     * Busca personas de tipo PERSONAL que NO tienen un usuario asignado.
     * Útil para mostrar en el dropdown al crear un nuevo usuario.
     */
    @Query("""
        SELECT p FROM PersonaEntity p 
        WHERE p.fechaBaja IS NULL 
        AND p.tipoPersona = 'PERSONAL'
        AND NOT EXISTS (
            SELECT u FROM UsuarioEntity u WHERE u.persona.id = p.id
        )""")
    Page<PersonaEntity> findPersonalSinUsuario(Pageable pageable);

}
