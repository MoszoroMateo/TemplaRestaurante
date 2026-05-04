package Templa.Tesis.App.repositories;

import Templa.Tesis.App.Enums.RolUsuario;
import Templa.Tesis.App.entities.UsuarioEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<UsuarioEntity,Integer> {
    //Buscar por username
    Optional<UsuarioEntity> findByUsername(String username);

    //Buscar por Email
    //Optional<UsuarioEntity> findByEmail(String email);

    // Buscar por username o email (para login)
    @Query("SELECT u FROM UsuarioEntity u WHERE u.username = :credential")
    Optional<UsuarioEntity> findByUsernameOrEmail(@Param("credential") String credential);

    // Verificar si existe username
    boolean existsByUsername(String username);

    // Verificar si existe email
    //boolean existsByEmail(String email);

    // Buscar usuarios activos
    List<UsuarioEntity> findByActivoTrue();

    // Buscar usuarios por rol
    List<UsuarioEntity> findByRolUsuario(RolUsuario rol);
}
