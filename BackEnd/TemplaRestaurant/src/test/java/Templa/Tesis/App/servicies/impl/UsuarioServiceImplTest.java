package Templa.Tesis.App.servicies.impl;

import Templa.Tesis.App.Enums.RolUsuario;
import Templa.Tesis.App.dtos.UsuarioCreateDTO;
import Templa.Tesis.App.dtos.UsuarioDTO;
import Templa.Tesis.App.dtos.UsuarioUpdateDTO;
import Templa.Tesis.App.entities.PersonaEntity;
import Templa.Tesis.App.entities.UsuarioEntity;
import Templa.Tesis.App.repositories.PersonaRepository;
import Templa.Tesis.App.repositories.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UsuarioServiceImpl Tests")
class UsuarioServiceImplTest {

    @Mock
    private EmailService emailService;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private PersonaRepository personaRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private ModelMapper modelMapper;

    @InjectMocks
    private UsuarioServiceImpl usuarioService;

    private UsuarioCreateDTO usuarioCreateDTO;
    private UsuarioUpdateDTO usuarioUpdateDTO;
    private UsuarioEntity usuarioEntity;
    private UsuarioDTO usuarioDTO;
    private PersonaEntity personaEntity;

    @BeforeEach
    void setUp() {
        // Configurar datos de prueba
        usuarioCreateDTO = UsuarioCreateDTO.builder()
                .username("testuser")
                .password("password123")
                .rolUsuario(RolUsuario.MOZO)
                //.personaNombre("Juan Perez")
                .build();

        usuarioUpdateDTO = UsuarioUpdateDTO.builder()
                .username("newusername")
                .password("newpassword")
                .rolUsuario(RolUsuario.ENCARGADO)
                .activo(false)
                .build();

        personaEntity = PersonaEntity.builder()
                .id(1)
                .nombre("Juan")
                .apellido("Perez")
                .email("juan.perez@email.com")
                .build();

        usuarioEntity = UsuarioEntity.builder()
                .id(1)
                .username("testuser")
                .password("encodedPassword")
                .rolUsuario(RolUsuario.MOZO)
                .activo(true)
                .persona(personaEntity)
                .build();

        usuarioDTO = UsuarioDTO.builder()
                .id(1)
                .username("testuser")
                .rolUsuario(RolUsuario.MOZO)
                .activo(true)
                .personaNombre("Juan Perez")
                .build();
    }

    // ================== TESTS PARA CREAR USUARIO ==================

    @Test
    @DisplayName("Crear usuario exitosamente")
    void testCrearUsuario_Exitoso() {
        // Arrange
        when(usuarioRepository.existsByUsername("testuser")).thenReturn(false);
        when(personaRepository.findByNombreCompleto("Juan Perez")).thenReturn(personaEntity);
        when(passwordEncoder.encode("password123")).thenReturn("encodedPassword");
        when(usuarioRepository.save(any(UsuarioEntity.class))).thenReturn(usuarioEntity);
        when(modelMapper.map(usuarioEntity, UsuarioDTO.class)).thenReturn(usuarioDTO);
        doNothing().when(emailService).enviarMailNuevoUsuario(anyString(), anyString(), anyString(), anyString());

        // Act
        UsuarioDTO resultado = usuarioService.crearUsuario(usuarioCreateDTO);

        // Assert
        assertNotNull(resultado);
        assertEquals("testuser", resultado.getUsername());
        assertEquals(RolUsuario.MOZO, resultado.getRolUsuario());
        assertEquals("Juan Perez", resultado.getPersonaNombre());

        verify(usuarioRepository).existsByUsername("testuser");
        verify(personaRepository).findByNombreCompleto("Juan Perez");
        verify(passwordEncoder).encode("password123");
        verify(usuarioRepository).save(any(UsuarioEntity.class));
        verify(emailService).enviarMailNuevoUsuario("juan.perez@email.com", "Juan Perez", "testuser", "password123");
        verify(modelMapper).map(usuarioEntity, UsuarioDTO.class);
    }

    @Test
    @DisplayName("Crear usuario - Username ya existe")
    void testCrearUsuario_UsernameYaExiste() {
        // Arrange
        when(usuarioRepository.existsByUsername("testuser")).thenReturn(true);

        // Act & Assert
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> usuarioService.crearUsuario(usuarioCreateDTO)
        );

        assertEquals("El nombre de usuario ya existe", exception.getMessage());
        verify(usuarioRepository).existsByUsername("testuser");
        verifyNoMoreInteractions(personaRepository, passwordEncoder, usuarioRepository);
        verifyNoInteractions(emailService, modelMapper);
    }

    @Test
    @DisplayName("Crear usuario - Persona no encontrada")
    void testCrearUsuario_PersonaNoEncontrada() {
        // Arrange
        when(usuarioRepository.existsByUsername("testuser")).thenReturn(false);
        when(personaRepository.findByNombreCompleto("Juan Perez")).thenReturn(null);

        // Act & Assert
        EntityNotFoundException exception = assertThrows(
                EntityNotFoundException.class,
                () -> usuarioService.crearUsuario(usuarioCreateDTO)
        );

        assertEquals("Persona no encontrada con el nombre: Juan Perez", exception.getMessage());
        verify(usuarioRepository).existsByUsername("testuser");
        verify(personaRepository).findByNombreCompleto("Juan Perez");
        verifyNoInteractions(passwordEncoder, emailService, modelMapper);
        verifyNoMoreInteractions(usuarioRepository);
    }

    // ================== TESTS PARA ACTUALIZAR USUARIO ==================

    @Test
    @DisplayName("Actualizar usuario exitosamente - Todos los campos")
    void testActualizarUsuario_TodosLosCampos_Exitoso() {
        // Arrange
        when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuarioEntity));
        when(usuarioRepository.existsByUsername("newusername")).thenReturn(false);
        when(passwordEncoder.encode("newpassword")).thenReturn("newEncodedPassword");
        when(usuarioRepository.save(usuarioEntity)).thenReturn(usuarioEntity);
        when(modelMapper.map(usuarioEntity, UsuarioDTO.class)).thenReturn(usuarioDTO);

        // Act
        UsuarioDTO resultado = usuarioService.actualizarUsuario(1, usuarioUpdateDTO);

        // Assert
        assertNotNull(resultado);
        verify(usuarioRepository).findById(1);
        verify(usuarioRepository).existsByUsername("newusername");
        verify(passwordEncoder).encode("newpassword");
        verify(usuarioRepository).save(usuarioEntity);
        verify(modelMapper).map(usuarioEntity, UsuarioDTO.class);

        // Verificar que se actualizaron los campos en la entidad
        assertEquals("newusername", usuarioEntity.getUsername());
        assertEquals("newEncodedPassword", usuarioEntity.getPassword());
        assertEquals(RolUsuario.ENCARGADO, usuarioEntity.getRolUsuario());
        assertEquals(false, usuarioEntity.getActivo());
    }

    @Test
    @DisplayName("Actualizar usuario - Solo username")
    void testActualizarUsuario_SoloUsername() {
        // Arrange
        UsuarioUpdateDTO updateDTO = UsuarioUpdateDTO.builder()
                .username("newusername")
                .build();

        when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuarioEntity));
        when(usuarioRepository.existsByUsername("newusername")).thenReturn(false);
        when(usuarioRepository.save(usuarioEntity)).thenReturn(usuarioEntity);
        when(modelMapper.map(usuarioEntity, UsuarioDTO.class)).thenReturn(usuarioDTO);

        // Act
        UsuarioDTO resultado = usuarioService.actualizarUsuario(1, updateDTO);

        // Assert
        assertNotNull(resultado);
        verify(usuarioRepository).findById(1);
        verify(usuarioRepository).existsByUsername("newusername");
        verify(usuarioRepository).save(usuarioEntity);
        verifyNoInteractions(passwordEncoder);
    }

    @Test
    @DisplayName("Actualizar usuario - Username igual al actual")
    void testActualizarUsuario_UsernameIgualAlActual() {
        // Arrange
        UsuarioUpdateDTO updateDTO = UsuarioUpdateDTO.builder()
                .username("testuser") // Mismo username actual
                .build();

        when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuarioEntity));
        when(usuarioRepository.save(usuarioEntity)).thenReturn(usuarioEntity);
        when(modelMapper.map(usuarioEntity, UsuarioDTO.class)).thenReturn(usuarioDTO);

        // Act
        UsuarioDTO resultado = usuarioService.actualizarUsuario(1, updateDTO);

        // Assert
        assertNotNull(resultado);
        verify(usuarioRepository).findById(1);
        verify(usuarioRepository, never()).existsByUsername(anyString());
        verify(usuarioRepository).save(usuarioEntity);
    }

    @Test
    @DisplayName("Actualizar usuario - Password vacío")
    void testActualizarUsuario_PasswordVacio() {
        // Arrange
        UsuarioUpdateDTO updateDTO = UsuarioUpdateDTO.builder()
                .password("") // Password vacío
                .build();

        when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuarioEntity));
        when(usuarioRepository.save(usuarioEntity)).thenReturn(usuarioEntity);
        when(modelMapper.map(usuarioEntity, UsuarioDTO.class)).thenReturn(usuarioDTO);

        // Act
        UsuarioDTO resultado = usuarioService.actualizarUsuario(1, updateDTO);

        // Assert
        assertNotNull(resultado);
        verify(usuarioRepository).findById(1);
        verify(usuarioRepository).save(usuarioEntity);
        verifyNoInteractions(passwordEncoder);
    }

    @Test
    @DisplayName("Actualizar usuario - Usuario no encontrado")
    void testActualizarUsuario_UsuarioNoEncontrado() {
        // Arrange
        when(usuarioRepository.findById(1)).thenReturn(Optional.empty());

        // Act & Assert
        EntityNotFoundException exception = assertThrows(
                EntityNotFoundException.class,
                () -> usuarioService.actualizarUsuario(1, usuarioUpdateDTO)
        );

        assertEquals("Usuario no encontrado con ID: 1", exception.getMessage());
        verify(usuarioRepository).findById(1);
        verifyNoMoreInteractions(usuarioRepository);
        verifyNoInteractions(passwordEncoder, modelMapper);
    }

    @Test
    @DisplayName("Actualizar usuario - Nuevo username ya existe")
    void testActualizarUsuario_NuevoUsernameYaExiste() {
        // Arrange
        when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuarioEntity));
        when(usuarioRepository.existsByUsername("newusername")).thenReturn(true);

        // Act & Assert
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> usuarioService.actualizarUsuario(1, usuarioUpdateDTO)
        );

        assertEquals("El nombre de usuario ya existe", exception.getMessage());
        verify(usuarioRepository).findById(1);
        verify(usuarioRepository).existsByUsername("newusername");
        verifyNoInteractions(passwordEncoder, modelMapper);
    }

    // ================== TESTS PARA LISTAR USUARIOS ==================

    @Test
    @DisplayName("Listar usuarios exitosamente")
    void testListarUsuarios_Exitoso() {
        // Arrange
        UsuarioEntity usuario1 = UsuarioEntity.builder().id(1).username("user1").build();
        UsuarioEntity usuario2 = UsuarioEntity.builder().id(2).username("user2").build();
        List<UsuarioEntity> usuarios = Arrays.asList(usuario1, usuario2);

        UsuarioDTO dto1 = UsuarioDTO.builder().id(1).username("user1").build();
        UsuarioDTO dto2 = UsuarioDTO.builder().id(2).username("user2").build();

        when(usuarioRepository.findAll()).thenReturn(usuarios);
        when(modelMapper.map(usuario1, UsuarioDTO.class)).thenReturn(dto1);
        when(modelMapper.map(usuario2, UsuarioDTO.class)).thenReturn(dto2);

        // Act
        List<UsuarioDTO> resultado = usuarioService.listarUsuarios();

        // Assert
        assertNotNull(resultado);
        assertEquals(2, resultado.size());
        assertEquals("user1", resultado.get(0).getUsername());
        assertEquals("user2", resultado.get(1).getUsername());

        verify(usuarioRepository).findAll();
        verify(modelMapper).map(usuario1, UsuarioDTO.class);
        verify(modelMapper).map(usuario2, UsuarioDTO.class);
    }

    @Test
    @DisplayName("Listar usuarios - Lista vacía")
    void testListarUsuarios_ListaVacia() {
        // Arrange
        when(usuarioRepository.findAll()).thenReturn(Arrays.asList());

        // Act
        List<UsuarioDTO> resultado = usuarioService.listarUsuarios();

        // Assert
        assertNotNull(resultado);
        assertEquals(0, resultado.size());
        verify(usuarioRepository).findAll();
        verifyNoInteractions(modelMapper);
    }

    // ================== TESTS PARA BUSCAR USUARIO POR ID ==================

    @Test
    @DisplayName("Buscar usuario por ID exitosamente")
    void testBuscarUsuarioPorId_Exitoso() {
        // Arrange
        when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuarioEntity));
        when(modelMapper.map(usuarioEntity, UsuarioDTO.class)).thenReturn(usuarioDTO);

        // Act
        UsuarioDTO resultado = usuarioService.buscarUsuarioPorId(1);

        // Assert
        assertNotNull(resultado);
        assertEquals("testuser", resultado.getUsername());
        verify(usuarioRepository).findById(1);
        verify(modelMapper).map(usuarioEntity, UsuarioDTO.class);
    }

    @Test
    @DisplayName("Buscar usuario por ID - Usuario no encontrado")
    void testBuscarUsuarioPorId_UsuarioNoEncontrado() {
        // Arrange
        when(usuarioRepository.findById(1)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> usuarioService.buscarUsuarioPorId(1)
        );

        assertEquals("Usuario no encontrado con el ID:1", exception.getMessage());
        verify(usuarioRepository).findById(1);
        verifyNoInteractions(modelMapper);
    }

    // ================== TESTS PARA ELIMINAR USUARIO ==================

    @Test
    @DisplayName("Eliminar usuario exitosamente")
    void testEliminarUsuario_Exitoso() {
        // Arrange
        when(usuarioRepository.existsById(1)).thenReturn(true);
        doNothing().when(usuarioRepository).deleteById(1);

        // Act
        assertDoesNotThrow(() -> usuarioService.eliminarUsuario(1));

        // Assert
        verify(usuarioRepository).existsById(1);
        verify(usuarioRepository).deleteById(1);
    }

    @Test
    @DisplayName("Eliminar usuario - Usuario no encontrado")
    void testEliminarUsuario_UsuarioNoEncontrado() {
        // Arrange
        when(usuarioRepository.existsById(1)).thenReturn(false);

        // Act & Assert
        EntityNotFoundException exception = assertThrows(
                EntityNotFoundException.class,
                () -> usuarioService.eliminarUsuario(1)
        );

        assertEquals("Usuario no encontrado con ID: 1", exception.getMessage());
        verify(usuarioRepository).existsById(1);
        verify(usuarioRepository, never()).deleteById(anyInt());
    }

    // ================== TESTS ADICIONALES PARA COBERTURA COMPLETA ==================

    @Test
    @DisplayName("Actualizar usuario - Solo rol")
    void testActualizarUsuario_SoloRol() {
        // Arrange
        UsuarioUpdateDTO updateDTO = UsuarioUpdateDTO.builder()
                .rolUsuario(RolUsuario.ADMINISTRADOR)
                .build();

        when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuarioEntity));
        when(usuarioRepository.save(usuarioEntity)).thenReturn(usuarioEntity);
        when(modelMapper.map(usuarioEntity, UsuarioDTO.class)).thenReturn(usuarioDTO);

        // Act
        UsuarioDTO resultado = usuarioService.actualizarUsuario(1, updateDTO);

        // Assert
        assertNotNull(resultado);
        assertEquals(RolUsuario.ADMINISTRADOR, usuarioEntity.getRolUsuario());
        verify(usuarioRepository).save(usuarioEntity);
    }

    @Test
    @DisplayName("Actualizar usuario - Solo activo")
    void testActualizarUsuario_SoloActivo() {
        // Arrange
        UsuarioUpdateDTO updateDTO = UsuarioUpdateDTO.builder()
                .activo(false)
                .build();

        when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuarioEntity));
        when(usuarioRepository.save(usuarioEntity)).thenReturn(usuarioEntity);
        when(modelMapper.map(usuarioEntity, UsuarioDTO.class)).thenReturn(usuarioDTO);

        // Act
        UsuarioDTO resultado = usuarioService.actualizarUsuario(1, updateDTO);

        // Assert
        assertNotNull(resultado);
        assertEquals(false, usuarioEntity.getActivo());
        verify(usuarioRepository).save(usuarioEntity);
    }

    @Test
    @DisplayName("Actualizar usuario - Solo password")
    void testActualizarUsuario_SoloPassword() {
        // Arrange
        UsuarioUpdateDTO updateDTO = UsuarioUpdateDTO.builder()
                .password("newpassword123")
                .build();

        when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuarioEntity));
        when(passwordEncoder.encode("newpassword123")).thenReturn("newEncodedPassword123");
        when(usuarioRepository.save(usuarioEntity)).thenReturn(usuarioEntity);
        when(modelMapper.map(usuarioEntity, UsuarioDTO.class)).thenReturn(usuarioDTO);

        // Act
        UsuarioDTO resultado = usuarioService.actualizarUsuario(1, updateDTO);

        // Assert
        assertNotNull(resultado);
        assertEquals("newEncodedPassword123", usuarioEntity.getPassword());
        verify(passwordEncoder).encode("newpassword123");
        verify(usuarioRepository).save(usuarioEntity);
    }

    @Test
    @DisplayName("Actualizar usuario - Campos nulos")
    void testActualizarUsuario_CamposNulos() {
        // Arrange
        UsuarioUpdateDTO updateDTO = UsuarioUpdateDTO.builder().build(); // Todos los campos son null

        when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuarioEntity));
        when(usuarioRepository.save(usuarioEntity)).thenReturn(usuarioEntity);
        when(modelMapper.map(usuarioEntity, UsuarioDTO.class)).thenReturn(usuarioDTO);

        // Act
        UsuarioDTO resultado = usuarioService.actualizarUsuario(1, updateDTO);

        // Assert
        assertNotNull(resultado);
        verify(usuarioRepository).findById(1);
        verify(usuarioRepository).save(usuarioEntity);
        verifyNoInteractions(passwordEncoder);
        verify(usuarioRepository, never()).existsByUsername(anyString());
    }
}