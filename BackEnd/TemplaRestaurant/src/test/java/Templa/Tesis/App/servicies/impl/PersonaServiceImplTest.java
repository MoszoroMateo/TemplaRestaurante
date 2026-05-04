package Templa.Tesis.App.servicies.impl;

import Templa.Tesis.App.Enums.TipoPersona;
import Templa.Tesis.App.dtos.PersonaDto;
import Templa.Tesis.App.dtos.PostPersonaDto;
import Templa.Tesis.App.entities.PersonaEntity;
import Templa.Tesis.App.repositories.PersonaRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Spy;
import org.modelmapper.ModelMapper;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@SpringBootTest
class PersonaServiceImplTest {
    @Spy
    private PersonaRepository personaRepository;
    @Spy
    private ModelMapper modelMapper;
    @InjectMocks
    private PersonaServiceImpl personaService;

    @DisplayName("Test para traer personas General Exitoso")
    @Test
    void traerPersonas() {
        Pageable pageable = PageRequest.of(0, 5, Sort.by("nombre", "fechaAlta").ascending());
        List<PersonaEntity> personaEntities = List.of(
                new PersonaEntity(Integer.valueOf(1), "John", "Doe", "john.doe@example.com", "123123",35461,  TipoPersona.CLIENTE,null, null,null,null),
                new PersonaEntity(Integer.valueOf(2), "Jane", "Smith", "jane.smith@example.com","123123",  35461, TipoPersona.PERSONAL,null, null,null,null)
        );
        Page<PersonaEntity> personaPage = new PageImpl<>(personaEntities, pageable, personaEntities.size());

        when(personaRepository.findAll(pageable)).thenReturn(personaPage);

        Page<PersonaDto> result = personaService.traerPersonas(0, 5);

        assertNotNull(result);
        assertEquals(2, result.getContent().size());
        assertEquals("John", result.getContent().get(0).getNombre());
        assertEquals("Jane", result.getContent().get(1).getNombre());
    }

    @Test
    void testTraerPersonasOrdenadasPorNombreYFechaAlta() {

        Page<PersonaEntity> emptyPage = Page.empty();
        when(personaRepository.findAll(any(Pageable.class))).thenReturn(emptyPage);

        personaService.traerPersonas(0, 10);

        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(personaRepository).findAll(captor.capture());

        Pageable pageableUsado = captor.getValue();
        Sort sort = pageableUsado.getSort();

        assertTrue(sort.stream().anyMatch(o -> o.getProperty().equals("nombre") && o.isAscending()));
        assertTrue(sort.stream().anyMatch(o -> o.getProperty().equals("fechaAlta") && o.isAscending()));
    }

    @Test
    void testTraerPersonas_filtros() {
        // Arrange
        String busqueda = "6541";
        String tipoPersona = null; // Todos
        String estado = "ACTIVOS"; // Solo personas activas
        Pageable pageable = PageRequest.of(0, 5, Sort.by("nombre").ascending());

        // Datos de prueba
        PersonaEntity persona1 = new PersonaEntity(
                2, "Ana", "Geremia", "ana@example.com", "987654321", 12336541,
                TipoPersona.PERSONAL, LocalDateTime.now(), 1, null, null
        );
        PersonaEntity persona2 = new PersonaEntity(
                1, "Mateo", "Moszoro", "mateo@example.com", "123456789", 65416516,
                TipoPersona.PERSONAL, LocalDateTime.now(), 1, null, null
        );
        List<PersonaEntity> personaEntities = List.of(persona1, persona2);
        Page<PersonaEntity> personaPage = new PageImpl<>(personaEntities, pageable, personaEntities.size());

        // Configurar mocks
        when(personaRepository.findByFiltros(busqueda, tipoPersona, estado, pageable)).thenReturn(personaPage);
        when(modelMapper.map(persona1, PersonaDto.class)).thenReturn(
                new PersonaDto(2, "Ana", "Geremia", "ana@example.com", "987654321", 12336541, TipoPersona.PERSONAL,null)
        );
        when(modelMapper.map(persona2, PersonaDto.class)).thenReturn(
                new PersonaDto(1, "Mateo", "Moszoro", "mateo@example.com", "123456789", 65416516, TipoPersona.PERSONAL,null)
        );

        // Act
        Page<PersonaDto> result = personaService.traerPersonas(0, 5, busqueda, tipoPersona, estado);

        // Assert
        assertNotNull(result, "El resultado no debe ser nulo");
        assertEquals(2, result.getContent().size(), "Debe devolver 2 personas");
        assertEquals(0, result.getNumber(), "La página debe ser la 0");
        assertEquals(5, result.getSize(), "El tamaño de la página debe ser 5");
        assertEquals(2, result.getTotalElements(), "El total de elementos debe ser 2");

        // Verificar contenido de los DTOs
        PersonaDto dto1 = result.getContent().get(0);
        assertEquals("Ana", dto1.getNombre(), "El nombre de la primera persona debe ser Ana");
        assertEquals(12336541, dto1.getDni(), "El DNI de la primera persona debe ser 12336541");

        PersonaDto dto2 = result.getContent().get(1);
        assertEquals("Mateo", dto2.getNombre(), "El nombre de la segunda persona debe ser Mateo");
        assertEquals(65416516, dto2.getDni(), "El DNI de la segunda persona debe ser 65416516");

        // Verificar que el repositorio fue llamado correctamente
        verify(personaRepository).findByFiltros(busqueda, tipoPersona, estado, pageable);
        verify(modelMapper).map(persona1, PersonaDto.class);
        verify(modelMapper).map(persona2, PersonaDto.class);
    }

    @DisplayName("Insercion Exitosa")
    @Test
    void insertarPersona() {
        PostPersonaDto nuevaP = new PostPersonaDto("Mateo","Moszoro","mateomosz@gmail.com","12313",43998130, TipoPersona.PERSONAL,1);
        PersonaEntity saved = new PersonaEntity(Integer.valueOf(1),"Mateo","Moszoro","mateomosz@gmail.com","12313",43998130, TipoPersona.PERSONAL,null,null,null,null);

        when(personaRepository.findByDni(nuevaP.getDni())).thenReturn(null);
        ArgumentCaptor<PersonaEntity> captor = ArgumentCaptor.forClass(PersonaEntity.class);


        PersonaDto resultado = personaService.insertarPersona(nuevaP);
        verify(personaRepository).save(captor.capture());

        verify(personaRepository).save(any(PersonaEntity.class));
        assertNotNull(captor.getValue().getId());
        assertEquals(nuevaP.getDni(), resultado.getDni());
        assertEquals(nuevaP.getNombre(), resultado.getNombre());
        assertEquals(LocalDateTime.now().truncatedTo(ChronoUnit.MINUTES), captor.getValue().getFechaAlta().truncatedTo(ChronoUnit.MINUTES));
    }

    @DisplayName("Insercion No Exitosa")
    @Test
    void insertarPersona_failure() {
        PostPersonaDto nuevaP = new PostPersonaDto("Mateo","Moszoro",null,"12313",43998130, TipoPersona.PERSONAL,1);

        assertThrows(ResponseStatusException.class, ()-> personaService.insertarPersona(nuevaP));
    }

    @DisplayName("Actualizacion Exitosa")
    @Test
    void actualizarPersona() {
        PersonaDto editar = new PersonaDto(Integer.valueOf(1),"Mateo","Moszoro","mateomosz@hotmail.com","3516811074",43998130,TipoPersona.PERSONAL,null);
        PersonaEntity existe = new PersonaEntity(Integer.valueOf(1),"Wateo","Woszoro","mateomosz@gmail.com","12313",43998130, TipoPersona.PERSONAL,null,null,null,null);
        ArgumentCaptor<PersonaEntity> captor = ArgumentCaptor.forClass(PersonaEntity.class);

        when(personaRepository.findByDni(editar.getDni())).thenReturn(existe);
        when(personaRepository.save(any(PersonaEntity.class))).thenReturn(existe);

        personaService.actualizarPersona(editar);
        verify(personaRepository).save(captor.capture());

        assertNotEquals(existe.getNombre(), captor.getValue().getNombre());
        assertEquals(editar.getApellido(), captor.getValue().getApellido());
    }

    @DisplayName("Actualizacion No Exitosa")
    @Test
    void actualizarPersona_failure() {
        PersonaDto editar = new PersonaDto(Integer.valueOf(1),"Mateo","Moszoro","mateomosz@hotmail.com","3516811074",43998130,TipoPersona.PERSONAL,null);
        when(personaRepository.findByDni(editar.getDni())).thenReturn(null);
        assertThrows(ResponseStatusException.class, ()-> personaService.actualizarPersona(editar));
    }

    @DisplayName("Baja Exitosa")
    @Test
    void bajaPersona() {
        Integer id = 1;
        PersonaEntity personaEntity = new PersonaEntity(Integer.valueOf(1),"Mateo","Moszoro","mateomosz@gmail.com","12313",43998130, TipoPersona.PERSONAL,null,null,null,null);

        when(personaRepository.findById(id)).thenReturn(Optional.of(personaEntity));
        personaService.bajaPersona(id);
        ArgumentCaptor<PersonaEntity> captor = ArgumentCaptor.forClass(PersonaEntity.class);

        verify(personaRepository).save(captor.capture());
        verify(personaRepository).save(any(PersonaEntity.class));
        assertEquals(LocalDateTime.now().truncatedTo(ChronoUnit.MINUTES), captor.getValue().getFechaBaja().truncatedTo(ChronoUnit.MINUTES));

    }

    @DisplayName("Baja a usuario ya dado de baja")
    @Test
    void bajaPersona_Failure() {
        Integer id = 1;
        PersonaEntity personaEntity = new PersonaEntity(Integer.valueOf(1),"Mateo","Moszoro","mateomosz@gmail.com","12313",43998130, TipoPersona.PERSONAL,null,null, LocalDateTime.now(),null);

        when(personaRepository.findById(id)).thenReturn(Optional.of(personaEntity));
        assertThrows(ResponseStatusException.class, ()-> personaService.bajaPersona(id));
    }

    @DisplayName("Baja a usuario Inexistente")
    @Test
    void bajaPersona_Failure2() {
        Integer id = 1;

        when(personaRepository.findById(id)).thenReturn(Optional.empty());
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> personaService.bajaPersona(id)
        );

        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
        assertEquals("No existe la Persona", ex.getReason());
    }
}