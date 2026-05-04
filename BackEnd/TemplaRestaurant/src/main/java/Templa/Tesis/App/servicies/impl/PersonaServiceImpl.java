package Templa.Tesis.App.servicies.impl;

import Templa.Tesis.App.dtos.PersonaDto;
import Templa.Tesis.App.dtos.PostPersonaDto;
import Templa.Tesis.App.entities.PersonaEntity;
import Templa.Tesis.App.repositories.PersonaRepository;
import Templa.Tesis.App.servicies.IPersonaService;
import jakarta.persistence.criteria.Predicate;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;


import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class PersonaServiceImpl implements IPersonaService {
    @Autowired
    private ModelMapper modelMapper;
    @Autowired
    private PersonaRepository personaRepository;

    /**
     * Obtiene una lista paginada y ordenada de todas las personas registradas en el sistema.
     * Las personas se ordenan por nombre ascendente y fecha de alta ascendente.
     * Este método retorna tanto personas activas como dadas de baja.
     *
     * @param page Número de página a recuperar (comenzando desde 0).
     * @param size Cantidad de elementos por página.
     * @return Page<PersonaDto> que contiene las personas de la página solicitada,
     *         con información de paginación y ordenación incluida.
     * @throws Exception si ocurre un error durante la consulta a la base de datos.
     */
    @Override
    public Page<PersonaDto> traerPersonas(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("nombre", "fechaAlta").ascending());
        Page<PersonaEntity> personal = personaRepository.findPersonal(pageable);
        return personal.map(entity -> modelMapper.map(entity, PersonaDto.class));
    }

    /**
     * Obtiene una lista paginada de personas aplicando múltiples filtros de búsqueda.
     * Permite filtrar por texto, tipo de persona y estado (activo/baja/todos).
     * Los resultados se ordenan por nombre ascendente.
     *
     * @param page Número de página a recuperar (comenzando desde 0).
     * @param size Cantidad de elementos por página.
     * @param buscarFiltro Texto para buscar en nombre, apellido, email, teléfono o DNI.
     *                     Si es null o vacío, no se aplica filtro de texto.
     * @param tipoPersona Filtro por tipo de persona (ej: "CLIENTE", "EMPLEADO").
     *                    Si es null o vacío, no se aplica filtro por tipo.
     * @param estado Filtro por estado: "ACTIVOS", "BAJA" o null/"TODOS" para ambos.
     * @return Page<PersonaDto> con las personas filtradas, paginadas y ordenadas.
     * @throws Exception si ocurre un error durante la consulta a la base de datos.
     *
     * @note Búsqueda por texto: Busca coincidencias parciales (LIKE) en nombre, apellido,
     *       email, teléfono y DNI (convertido a string).
     * @note Filtro de estado: "ACTIVOS" = fechaBaja es null, "BAJA" = fechaBaja no es null.
     */
    @Override
    public Page<PersonaDto> traerPersonas(int page, int size, String buscarFiltro, String tipoPersona, String estado) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("nombre").ascending());

        Specification<PersonaEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Filtro por estado (null o vacío = TODOS, no filtra)
            if (estado != null && !estado.isEmpty()) {
                if ("ACTIVOS".equals(estado)) {
                    predicates.add(cb.isNull(root.get("fechaBaja")));
                } else if ("BAJA".equals(estado)) {
                    predicates.add(cb.isNotNull(root.get("fechaBaja")));
                } // 'TODOS' no agrega predicate
            }

            // Filtro por buscarFiltro (null o vacío = no filtra)
            if (buscarFiltro != null && !buscarFiltro.isEmpty()) {
                String pattern = "%" + buscarFiltro.toLowerCase() + "%";
                Predicate nombrePred = cb.like(cb.lower(root.get("nombre")), pattern);
                Predicate apellidoPred = cb.like(cb.lower(root.get("apellido")), pattern);
                Predicate emailPred = cb.like(cb.lower(root.get("email")), pattern);
                Predicate telefonoPred = cb.like(cb.lower(root.get("telefono")), pattern);
                Predicate dniPred = cb.like(
                        cb.lower(cb.toString(root.get("dni"))),
                        pattern
                );
                predicates.add(cb.or(nombrePred, apellidoPred, emailPred, telefonoPred, dniPred));
            }

            // Filtro por tipoPersona (null o vacío = no filtra)
            if (tipoPersona != null && !tipoPersona.isEmpty()) {
                predicates.add(cb.equal(root.get("tipoPersona"), tipoPersona));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<PersonaEntity> filtrados = personaRepository.findAll(spec, pageable);
        return filtrados.map(entity -> modelMapper.map(entity, PersonaDto.class));
    }

    /**
     * Obtiene una lista paginada de personas de tipo PERSONAL que NO tienen un usuario asignado.
     * Este método es útil para mostrar en el dropdown al crear un nuevo usuario,
     * evitando mostrar personas que ya tienen un usuario.
     *
     * @param page Número de página a recuperar (comenzando desde 0).
     * @param size Cantidad de elementos por página.
     * @return Page<PersonaDto> con las personas tipo PERSONAL sin usuario, paginadas.
     * @throws Exception si ocurre un error durante la consulta a la base de datos.
     */
    @Override
    public Page<PersonaDto> traerPersonalSinUsuario(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("nombre", "apellido").ascending());
        Page<PersonaEntity> personalSinUsuario = personaRepository.findPersonalSinUsuario(pageable);
        return personalSinUsuario.map(entity -> modelMapper.map(entity, PersonaDto.class));
    }

    /**
     * Registra una nueva persona en el sistema.
     * Realiza validaciones de datos requeridos y verifica que no exista una persona con el mismo DNI.
     * Establece automáticamente la fecha de alta y usuario que realizó la operación.
     *
     * @param nuevaPersona Objeto DTO con los datos de la persona a crear.
     *                     Debe incluir DNI, email y nombre como mínimo.
     * @return PersonaDto que representa la persona creada exitosamente.
     * @throws ResponseStatusException con código 400 si:
     *         - El DNI es 0
     *         - El email es null
     *         - El nombre es null o vacío
     * @throws ResponseStatusException con código 409 si ya existe una persona con el mismo DNI.
     * @throws ResponseStatusException con código 500 si ocurre un error interno durante el guardado.
     *
     * @note TODO: El campo userAlta está hardcodeado como 2. Necesita implementación para obtener
     *       el usuario autenticado que realiza la operación.
     */
    @Override
    public PersonaDto insertarPersona(PostPersonaDto nuevaPersona) {
        if(nuevaPersona.getDni()==0){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe Ingresar un DNI");
        }
        if(nuevaPersona.getEmail()==null){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe ingresar un EMAIL");

        }
        if(nuevaPersona.getNombre() == null || nuevaPersona.getNombre().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe ingresar un nombre válido");
        }

        PersonaEntity existe = personaRepository.findByDni(nuevaPersona.getDni());

        // Si ya existe, devolver la persona existente en lugar de lanzar error
        if(existe!=null){
            return modelMapper.map(existe, PersonaDto.class);
        }

        try {

            PersonaEntity nuevo = modelMapper.map(nuevaPersona, PersonaEntity.class);
            nuevo.setFechaAlta(LocalDateTime.now());
            nuevo.setUserAlta(2); //TODO: ver como obtener el usuario que realiza la baja
            personaRepository.save(nuevo);
            return modelMapper.map(nuevo, PersonaDto.class);

        }catch(Exception e){
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error al guardar la Persona");
        }

    }

    /**
     * Actualiza los datos de una persona existente en el sistema.
     * Reemplaza completamente los datos de la persona con la información proporcionada.
     *
     * @param personaActualizada Objeto DTO con los datos actualizados de la persona.
     *                           Debe incluir el ID de la persona a actualizar.
     * @return PersonaDto que representa la persona actualizada.
     * @throws ResponseStatusException con código 409 si no existe una persona con el ID proporcionado.
     * @throws ResponseStatusException con código 500 si ocurre un error interno durante el guardado.
     *
     * @note Este método realiza un reemplazo completo de los datos. No realiza validaciones
     *       de unicidad de DNI en la actualización.
     * @warning Se recomienda añadir validación de DNI duplicado para evitar inconsistencias.
     */
    @Override
    public PersonaDto actualizarPersona(PersonaDto personaActualizada) {
        PersonaEntity existe = personaRepository.findById(personaActualizada.getId()).orElseThrow(()->new ResponseStatusException(HttpStatus.CONFLICT, "La Persona que desea modificar no existe."));

        try {
            existe = modelMapper.map(personaActualizada, PersonaEntity.class);
            PersonaEntity guardado = personaRepository.save(existe);
            return modelMapper.map(guardado, PersonaDto.class);
        }catch(Exception e){
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error al guardar la Persona");
        }
    }

    /**
     * Da de baja lógica a una persona en el sistema.
     * Establece la fecha de baja actual y registra el usuario que realizó la operación.
     * No elimina físicamente el registro, solo marca como inactivo.
     *
     * @param id Identificador único de la persona a dar de baja.
     * @throws ResponseStatusException con código 404 si no existe una persona con el ID proporcionado.
     * @throws ResponseStatusException con código 400 si la persona ya se encuentra dada de baja.
     * @throws ResponseStatusException con código 500 si ocurre un error interno durante la operación.
     *
     * @note TODO: El campo userBajaId está hardcodeado como 1. Necesita implementación para obtener
     *       el usuario autenticado que realiza la operación.
     * @note La baja es lógica (soft delete). La persona permanece en la base de datos
     *       con fechaBaja establecida.
     */
    @Override
    public void bajaPersona(Integer id) {
        PersonaEntity existe = personaRepository.findById(id).orElseThrow(()-> new ResponseStatusException(HttpStatus.NOT_FOUND,"No existe la Persona"));
        if(existe.getFechaBaja()!=null){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"La Persona ya se encuentra dada de baja");
        }
        try {
            existe.setFechaBaja(LocalDateTime.now());
            existe.setUserBajaId(1); //TODO: ver como obtener el usuario que realiza la baja
            personaRepository.save(existe);
        }
        catch(Exception e){
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error al dar de baja la Persona");
        }
    }

    /**
     * Busca una persona por su DNI.
     * 
     * @param dni Número de DNI de la persona a buscar.
     * @return PersonaDto si encuentra la persona, null si no existe.
     */
    @Override
    public PersonaDto buscarPorDni(Integer dni) {
        PersonaEntity persona = personaRepository.findByDni(dni);
        if (persona == null) {
            return null;
        }
        return modelMapper.map(persona, PersonaDto.class);
    }
}
