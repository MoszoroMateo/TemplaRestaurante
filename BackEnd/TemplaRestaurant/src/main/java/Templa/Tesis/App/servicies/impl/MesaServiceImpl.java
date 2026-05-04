package Templa.Tesis.App.servicies.impl;

import Templa.Tesis.App.Enums.EstadoMesa;
import Templa.Tesis.App.Enums.TipoPlato;
import Templa.Tesis.App.dtos.GetMesaDto;
import Templa.Tesis.App.dtos.PostMesaDto;
import Templa.Tesis.App.dtos.UpdateMesaPosicionDto;
import Templa.Tesis.App.entities.MesaEntity;
import Templa.Tesis.App.repositories.MesaRepository;
import Templa.Tesis.App.servicies.IMesasService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.criteria.Predicate;
import jakarta.transaction.Transactional;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class MesaServiceImpl implements IMesasService {
    @Autowired
    private MesaRepository mesaRepository;
    @Autowired
    private ModelMapper modelMapper;

    /**
     * Crea una nueva mesa en el sistema.
     * Valida que no exista otra mesa con el mismo número antes de crear.
     *
     * @param postMesaDto Objeto DTO con los datos necesarios para crear la mesa.
     *                    Debe incluir: numeroMesa, capacidad, estadoMesa, etc.
     * @return GetMesaDto con los datos completos de la mesa creada.
     * @throws RuntimeException si:
     *         - Ya existe una mesa con el mismo número.
     *         - Ocurre un error al guardar la mesa en la base de datos.
     *
     * @note Utiliza ModelMapper para la conversión entre DTO y entidad.
     * @note El número de mesa debe ser único en el sistema.
     */
    @Override
    public GetMesaDto createMesa(PostMesaDto postMesaDto) {
        Optional<MesaEntity> existe = mesaRepository.findByNumeroMesa(postMesaDto.getNumeroMesa());
        if (existe.isPresent()) {
            throw new RuntimeException("La mesa con el numero " + postMesaDto.getNumeroMesa() + " ya existe");
        }

        try{
            MesaEntity mesa = modelMapper.map(postMesaDto, MesaEntity.class);

            return modelMapper.map(mesaRepository.save(mesa), GetMesaDto.class);
        } catch (Exception e){
            throw new RuntimeException("Error al crear la mesa: " + e.getMessage());
        }
    }

    /**
     * Actualiza los datos de una mesa existente.
     * Reemplaza todos los campos editables de la mesa con los valores proporcionados.
     *
     * @param mesaDto Objeto DTO con los datos actualizados de la mesa.
     *                Debe incluir el idMesa para identificar la mesa a actualizar.
     * @return GetMesaDto con los datos actualizados de la mesa.
     * @throws RuntimeException si:
     *         - No existe una mesa con el ID proporcionado.
     *         - Ocurre un error al actualizar la mesa en la base de datos.
     *
     * @note Utiliza ModelMapper para la conversión entre DTO y entidad.
     * @note Realiza un reemplazo completo de los datos de la mesa.
     */
    @Override
    public GetMesaDto updateMesa(GetMesaDto mesaDto) {
        Optional<MesaEntity> existe = mesaRepository.findById(mesaDto.getIdMesa());

        if (existe.isEmpty()) {
            throw new RuntimeException("La mesa con el id " + mesaDto.getIdMesa() + " no existe");
        }

        try{
            MesaEntity mesaEntity = modelMapper.map(mesaDto, MesaEntity.class);
            MesaEntity mesaActualizada = mesaRepository.save(mesaEntity);
            return modelMapper.map(mesaActualizada, GetMesaDto.class);
        } catch (Exception e){
            throw new RuntimeException("Error al actualizar la mesa: " + e.getMessage());
        }
    }

    /**
     * Obtiene una lista paginada de todas las mesas del sistema.
     * Las mesas se ordenan por idMesa ascendente.
     *
     * @param page Número de página a recuperar (comenzando desde 0).
     * @param size Cantidad de elementos por página.
     * @return Page<GetMesaDto> que contiene las mesas de la página solicitada,
     *         con información de paginación incluida.
     */
    @Override
    public Page<GetMesaDto> getMesas(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("idMesa"));
        Page<MesaEntity> mesas = mesaRepository.findAll(pageable);
        return mesas.map(mesa -> modelMapper.map(mesa, GetMesaDto.class));
    }

    /**
     * Obtiene una lista paginada de mesas aplicando filtros de búsqueda.
     * Permite filtrar por número de mesa (búsqueda parcial) y estado.
     * Los resultados se ordenan por idMesa ascendente.
     *
     * @param buscarFiltro Texto para buscar en el número de mesa (búsqueda case-insensitive).
     *                     Si es null o vacío, no se aplica filtro por número.
     * @param estadoMesa Estado de la mesa a filtrar (ej: "DISPONIBLE", "OCUPADA", "RESERVADA").
     *                   Si es null o vacío, no se aplica filtro por estado.
     * @param page Número de página a recuperar (comenzando desde 0).
     * @param size Cantidad de elementos por página.
     * @return Page<GetMesaDto> con las mesas filtradas y paginadas.
     *
     * @note Utiliza Specification para construir consultas dinámicas.
     * @note La búsqueda por número de mesa es parcial (LIKE %texto%).
     */
    @Override
    public Page<GetMesaDto> getMesas(String buscarFiltro, String estadoMesa, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("idMesa"));

        Specification<MesaEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (buscarFiltro != null && !buscarFiltro.isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("numeroMesa").as(String.class)), "%" + buscarFiltro.toLowerCase() + "%"));
            }
            if (estadoMesa != null && !estadoMesa.isEmpty()) {
                predicates.add(cb.equal(root.get("estadoMesa"), EstadoMesa.valueOf(estadoMesa)));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        Page<MesaEntity> mesas = mesaRepository.findAll(spec, pageable);
        return mesas.map(mesa -> modelMapper.map(mesa, GetMesaDto.class));
    }

    /**
     * Cambia el estado de una mesa específica.
     *
     * @param id Identificador único de la mesa cuyo estado se desea cambiar.
     * @param nuevoEstado Nuevo estado a asignar a la mesa (DISPONIBLE, OCUPADA, RESERVADA, etc.).
     * @return GetMesaDto con los datos actualizados de la mesa, incluyendo el nuevo estado.
     * @throws RuntimeException si:
     *         - No existe una mesa con el ID proporcionado.
     *         - El nuevo estado es nulo.
     *
     * @Transactional La operación se ejecuta dentro de una transacción.
     * @note Solo modifica el estado de la mesa, manteniendo los demás atributos sin cambios.
     */
    @Override
    @Transactional
    public GetMesaDto cambiarEstadoMesa(Integer id, EstadoMesa nuevoEstado) {
        Optional<MesaEntity> existe = mesaRepository.findById(id);
        if (existe.isEmpty()) {
            throw new RuntimeException("La mesa con el id " + id + " no existe");
        }
        if(nuevoEstado == null) {
            throw new RuntimeException("El estado de la mesa no puede ser nulo");
        }
        MesaEntity mesa = existe.get();
        mesa.setEstadoMesa(nuevoEstado);
        return modelMapper.map(mesaRepository.save(mesa), GetMesaDto.class);
    }


    /**
     * Obtiene los datos de una mesa específica por su identificador único.
     *
     * @param id Identificador único de la mesa a buscar.
     * @return GetMesaDto con todos los datos de la mesa encontrada.
     * @throws RuntimeException si no existe una mesa con el ID proporcionado.
     */
    @Override
    public GetMesaDto getMesaById(Integer id) {
        Optional<MesaEntity> existe = mesaRepository.findById(id);
        if (existe.isEmpty()) {
            throw new RuntimeException("La mesa con el id " + id + " no existe");
        }
        return modelMapper.map(existe.get(), GetMesaDto.class);
    }

    /**
     * Actualiza la posición (coordenadas y piso) de una mesa en el plano del restaurante.
     * Valida que las coordenadas y el piso sean válidos.
     *
     * @param mesaPosicionDto Objeto DTO con el ID de la mesa y sus nuevas coordenadas.
     *                        Debe incluir: idMesa, posX, posY, piso.
     * @return GetMesaDto con los datos actualizados de la mesa, incluyendo la nueva posición.
     * @throws EntityNotFoundException si no existe una mesa con el ID proporcionado.
     * @throws IllegalArgumentException si el piso no está en el rango válido (0-2).
     *
     * @note El piso debe estar entre 0 y 2 (inclusive).
     * @note Las coordenadas posX y posY pueden ser cualquier valor numérico válido.
     */
    @Override
    public GetMesaDto actualizarPosicionMesa(UpdateMesaPosicionDto mesaPosicionDto) {
        MesaEntity mesa = mesaRepository.findById(mesaPosicionDto.getIdMesa())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Mesa no encontrada con ID: " + mesaPosicionDto.getIdMesa()));

        if (mesaPosicionDto.getPiso() < 0 || mesaPosicionDto.getPiso() > 2) {
            throw new IllegalArgumentException("El piso debe estar entre 0 y 2");
        }

        mesa.setPosX(mesaPosicionDto.getPosX());
        mesa.setPosY(mesaPosicionDto.getPosY());
        mesa.setPiso(mesaPosicionDto.getPiso());

        MesaEntity mesaActualizada = mesaRepository.save(mesa);
        return modelMapper.map(mesaActualizada, GetMesaDto.class);
    }

    /**
     * Obtiene todas las mesas que tienen una posición asignada en el plano.
     * Incluye solo las mesas con coordenadas posX, posY y piso no nulos.
     *
     * @return List<GetMesaDto> con todas las mesas que tienen posición asignada.
     *
     * @note Útil para renderizar el plano del restaurante con las mesas posicionadas.
     * @note Las mesas sin posición asignada no se incluyen en la respuesta.
     */
    @Override
    public List<GetMesaDto> getMesasConPosicion() {
        List<MesaEntity> mesas = mesaRepository.findAllConPosicion();
        return mesas.stream()
                .map(mesa -> modelMapper.map(mesa, GetMesaDto.class))
                .collect(Collectors.toList());
    }

    /**
     * Obtiene todas las mesas ubicadas en un piso específico del restaurante.
     *
     * @param piso Número del piso del que se desean obtener las mesas (0, 1 o 2).
     * @return List<GetMesaDto> con todas las mesas ubicadas en el piso especificado.
     * @throws IllegalArgumentException si el piso no está en el rango válido (0-2).
     *
     * @note Útil para visualizar la distribución de mesas por piso.
     * @note Incluye todas las mesas del piso, independientemente de su estado.
     */
    @Override
    public List<GetMesaDto> obtenerMesasPorPiso(Integer piso) {
        if (piso < 0 || piso > 2) {
            throw new IllegalArgumentException("El piso debe estar entre 0 y 2");
        }

        List<MesaEntity> mesas = mesaRepository.findByPiso(piso);
        return mesas.stream()
                .map(mesa -> modelMapper.map(mesa, GetMesaDto.class))
                .collect(Collectors.toList());
    }

    /**
     * Desvincula una mesa del plano del restaurante, eliminando sus coordenadas.
     * Establece posX, posY y piso a null para la mesa especificada.
     *
     * @param idMesa Identificador único de la mesa a desvincular del plano.
     * @throws EntityNotFoundException si no existe una mesa con el ID proporcionado.
     *
     * @note No elimina la mesa, solo remueve su posición en el plano.
     * @note La mesa seguirá existiendo en el sistema pero sin posición asignada.
     */
    @Override
    public void desvincularMesaDelPlano(Integer idMesa) {
        MesaEntity mesa = mesaRepository.findById(idMesa)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Mesa no encontrada con ID: " + idMesa));

        // Setear coordenadas a null
        mesa.setPosX(null);
        mesa.setPosY(null);
        mesa.setPiso(null);

        mesaRepository.save(mesa);
    }

    /**
     * Verifica si una mesa tiene posición asignada en el plano del restaurante.
     *
     * @param idMesa Identificador único de la mesa a verificar.
     * @return true si la mesa tiene posX, posY y piso no nulos (está vinculada al plano),
     *         false en caso contrario.
     *
     * @note Útil para determinar si una mesa puede mostrarse en la interfaz gráfica del plano.
     * @note No valida la existencia de la mesa, asume que el ID es válido.
     */
    @Override
    public boolean estaVinculada(Integer idMesa) {
        return mesaRepository.estaVinculada(idMesa);
    }
}
