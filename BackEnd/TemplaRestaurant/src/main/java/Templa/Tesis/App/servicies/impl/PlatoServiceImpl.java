package Templa.Tesis.App.servicies.impl;

import Templa.Tesis.App.Enums.TipoPlato;
import Templa.Tesis.App.dtos.*;
import Templa.Tesis.App.entities.PlatoDetalleEntity;
import Templa.Tesis.App.entities.PlatoEntity;
import Templa.Tesis.App.entities.ProductoEntity;
import Templa.Tesis.App.repositories.PlatoDetalleRepository;
import Templa.Tesis.App.repositories.PlatoRepository;
import Templa.Tesis.App.repositories.ProductoRepository;
import Templa.Tesis.App.servicies.IPlatoService;
import jakarta.transaction.Transactional;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.domain.Sort;
import jakarta.persistence.criteria.Predicate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PlatoServiceImpl implements IPlatoService {
    @Autowired
    private PlatoRepository platoRepository;
    @Autowired
    private ModelMapper modelMapper;
    @Autowired
    private PlatoDetalleRepository platoDetalleRepository;
    @Autowired
    private ProductoRepository productoRepository;
    @Autowired
    private S3Service s3Service;

    /**
     * Obtiene una lista paginada de todos los platos activos del sistema.
     * Incluye la información de ingredientes asociados a cada plato.
     *
     * @param page Número de página a recuperar (comenzando desde 0).
     * @param size Cantidad de elementos por página.
     * @return Page<GetPlatoDto> que contiene los platos de la página solicitada,
     *         con información de paginación e ingredientes incluida.
     */
    @Override
    public Page<GetPlatoDto> getPlatos(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<PlatoEntity> platos = platoRepository.findAllWithIngredientes(pageable);
        return platos.map(this::convertToDto);
    }

    private GetPlatoDto convertToDto(PlatoEntity plato) {
        GetPlatoDto dto = modelMapper.map(plato, GetPlatoDto.class);

        List<PlatoDetalleEntity> ingredientes = platoDetalleRepository.findByPlatoIdPlato(plato.getIdPlato());

        List<GetIngredientesDto> ingredientesDtos = ingredientes.stream()
                .map(detalle -> new GetIngredientesDto(
                        detalle.getProducto().getId(),
                        detalle.getCantidad()
                ))
                .collect(Collectors.toList());

        dto.setIngredientes(ingredientesDtos);
        return dto;
    }

    /**
     * Obtiene una lista paginada de platos aplicando múltiples filtros de búsqueda.
     * Permite filtrar por texto, tipo de plato y estado de disponibilidad.
     * Los resultados se ordenan por nombre ascendente.
     *
     * @param buscarFiltro Texto para buscar en nombre, descripción o precio del plato.
     *                     Si es null, vacío o igual a "TODOS", no se aplica filtro por texto.
     * @param tipoPlato Tipo de plato a filtrar (ej: "ENTRADA", "PRINCIPAL", "POSTRE").
     *                  Si es null, vacío o igual a "TODOS", no se aplica filtro por tipo.
     * @param estado Estado de disponibilidad del plato: "DISPONIBLES", "NO_DISPONIBLES".
     *               Si es null o vacío, incluye todos los estados (excepto platos dados de baja).
     * @param page Número de página a recuperar (comenzando desde 0).
     * @param size Cantidad de elementos por página.
     * @return Page<GetPlatoDto> con los platos filtrados, paginados y ordenados.
     *
     * @note Excluye automáticamente los platos dados de baja (fechaBaja no nula).
     * @note La búsqueda por precio acepta valores numéricos para filtrar por precio o descuento.
     * @note Utiliza Specification para construir consultas dinámicas complejas.
     */
    @Override
    public Page<GetPlatoDto> getPlatos(String buscarFiltro, String tipoPlato, String estado, int page, int size) {
        Pageable pageable = PageRequest.of(page, size,
                Sort.by(Sort.Order.desc("disponible"), Sort.Order.asc("nombre")));

        Specification<PlatoEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.isNull(root.get("fechaBaja"))); // Excluir platos dados de baja

            // ✅ Filtro por estado (igual que personas)
            if (estado != null && !estado.isEmpty()) {
                if ("DISPONIBLES".equals(estado)) {
                    predicates.add(cb.equal(root.get("disponible"), true));
                    predicates.add(cb.isNull(root.get("fechaBaja")));
                } else if ("NO_DISPONIBLES".equals(estado)) {
                    predicates.add(cb.equal(root.get("disponible"), false));
                } //else if ("BAJA".equals(estado)) {
//                    predicates.add(cb.isNotNull(root.get("fechaBaja")));
//                } // 'TODOS' no agrega predicate
            }

            // ✅ Filtro por buscarFiltro (nombre y precio)
            if (buscarFiltro != null && !buscarFiltro.isEmpty() && !"TODOS".equals(tipoPlato)) {
                String pattern = "%" + buscarFiltro.toLowerCase() + "%";

                // Buscar por nombre y descripción
                Predicate nombrePred = cb.like(cb.lower(root.get("nombre")), pattern);
                Predicate descripcionPred = cb.like(cb.lower(root.get("descripcion")), pattern);

                // Buscar por precio
                List<Predicate> searchPredicates = new ArrayList<>();
                searchPredicates.add(nombrePred);
                searchPredicates.add(descripcionPred);

                try {
                    Double precioFiltro = Double.parseDouble(buscarFiltro);
                    searchPredicates.add(cb.equal(root.get("precio"), precioFiltro));
                    // También buscar en precio con descuento si existe
                    searchPredicates.add(cb.equal(root.get("descuento"), precioFiltro));
                } catch (NumberFormatException e) {
                    // Si no es numérico, solo buscar por texto
                }

                predicates.add(cb.or(searchPredicates.toArray(new Predicate[0])));
            }

            // ✅ Filtro por tipoPlato
            if (tipoPlato != null && !tipoPlato.isEmpty()) {
                predicates.add(cb.equal(root.get("tipoPlato"), TipoPlato.valueOf(tipoPlato)));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<PlatoEntity> filtrados = platoRepository.findAll(spec, pageable);
        return filtrados.map(this::convertToDto);
    }

    /**
     * Crea un nuevo plato en el sistema con todos sus ingredientes asociados.
     * Incluye validación de datos, verificación de unicidad y carga de imagen.
     *
     * @param platoNuevo Objeto DTO con los datos del nuevo plato a crear.
     *                   Debe incluir: nombre, precio, tipoPlato, descripción e ingredientes.
     * @param imagen Archivo de imagen del plato (opcional). Si se proporciona, se sube a S3.
     * @return GetPlatoDto con los datos completos del plato creado, incluyendo ingredientes.
     * @throws ResponseStatusException con código 400 si:
     *         - El nombre está vacío o en blanco
     *         - El precio es nulo, 0 o negativo
     *         - No se proporcionan ingredientes
     * @throws ResponseStatusException con código 404 si algún producto ingrediente no existe.
     * @throws ResponseStatusException con código 409 si ya existe un plato con el mismo nombre.
     * @throws ResponseStatusException con código 500 si ocurre un error al guardar el plato.
     *
     * @Transactional La operación se ejecuta dentro de una transacción.
     * @note Carga la imagen del plato en Amazon S3 si se proporciona.
     * @note Establece automáticamente: disponible=true, fechaAlta=ahora, userAlta=2.
     * @note Guarda los detalles de ingredientes en la tabla PlatoDetalleEntity.
     */
    @Override
    @Transactional
    public GetPlatoDto createPlato(PostPlatoDto platoNuevo, MultipartFile imagen) {
        if (platoNuevo.getNombre().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe ingresar un nombre válido");
        }

        if (platoNuevo.getPrecio() == null || platoNuevo.getPrecio() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe ingresar un precio válido");
        }

        if (platoNuevo.getIngredientes() == null || platoNuevo.getIngredientes().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe ingresar al menos un ingrediente");
        }

        PlatoEntity existe = platoRepository.findByNombre(platoNuevo.getNombre());

        if (existe != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El plato ya existe.");
        }

        try {
            String urlImagen = null;
            if (imagen != null && !imagen.isEmpty()) {
                urlImagen = s3Service.uploadFile(imagen);
            }


            PlatoEntity nuevoPlato = modelMapper.map(platoNuevo, PlatoEntity.class);
            nuevoPlato.setFoto(urlImagen);
            nuevoPlato.setDisponible(true);
            nuevoPlato.setFechaAlta(LocalDateTime.now());
            nuevoPlato.setUserAlta(2);
            PlatoEntity guardado = platoRepository.save(nuevoPlato);

            List<PlatoDetalleEntity> detalles = new ArrayList<>();
            for (PostIngredientesDto ing : platoNuevo.getIngredientes()) {
                ProductoEntity ingrediente = productoRepository.findById(Integer.valueOf(ing.getId()))
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "El producto no existe"));

                PlatoDetalleEntity detalle = new PlatoDetalleEntity();
                detalle.setPlato(guardado);
                detalle.setProducto(ingrediente);
                detalle.setCantidad(ing.getCantidad());
                detalles.add(detalle);
            }
            platoDetalleRepository.saveAll(detalles);

            return convertToDto(guardado);

        } catch (Exception e) {
            throw e;
        }
    }

    /**
     * Actualiza los datos de un plato existente, incluyendo sus ingredientes e imagen.
     * Permite modificar todos los campos editables del plato.
     *
     * @param platoActualizado Objeto DTO con los datos actualizados del plato.
     *                         Debe incluir el idPlato para identificar el plato a actualizar.
     * @param imagen Nueva imagen del plato (opcional). Si se proporciona, reemplaza la anterior.
     * @return GetPlatoDto con los datos actualizados del plato, incluyendo ingredientes.
     * @throws ResponseStatusException con código 400 si:
     *         - El nombre está vacío o en blanco
     *         - El precio es nulo, 0 o negativo
     * @throws ResponseStatusException con código 404 si el plato no existe.
     * @throws ResponseStatusException con código 409 si ya existe otro plato con el mismo nombre.
     * @throws ResponseStatusException con código 500 si ocurre un error al actualizar.
     *
     * @note Si se proporciona nueva imagen, elimina la anterior de S3 antes de subir la nueva.
     * @note Actualiza completamente la lista de ingredientes (elimina los anteriores).
     * @note Mantiene la imagen anterior si no se proporciona una nueva.
     */
    @Override
    public GetPlatoDto updatePlato(GetPlatoDto platoActualizado, MultipartFile imagen) {

        if (platoActualizado.getNombre().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe ingresar un nombre válido");
        }

        if (platoActualizado.getPrecio() == null || platoActualizado.getPrecio() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe ingresar un precio válido");
        }

        PlatoEntity platoConMismoNombre = platoRepository.findByNombre(platoActualizado.getNombre());
        if (platoConMismoNombre != null && !platoConMismoNombre.getIdPlato().equals(platoActualizado.getIdPlato())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe otro plato con ese nombre");
        }

        PlatoEntity platoExistente = platoRepository.findById(platoActualizado.getIdPlato())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Plato no encontrado"));


        try {

            String urlImagen = null;
            if (imagen != null && !imagen.isEmpty()) {
                s3Service.deleteFile(platoExistente.getFoto());
                urlImagen = s3Service.uploadFile(imagen);
            }

            modelMapper.map(platoActualizado, platoExistente);

            platoExistente.setFoto(urlImagen != null ? urlImagen : platoActualizado.getFoto());

            PlatoEntity platoGuardado = platoRepository.save(platoExistente);


            updateIngredientes(platoGuardado, platoActualizado.getIngredientes());

            return convertToDto(platoGuardado);

        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Error al actualizar el plato: " + e.getMessage());
        }
    }

    /**
     * Actualiza los ingredientes de un plato específico.
     * Elimina todos los ingredientes anteriores y crea los nuevos proporcionados.
     *
     * @param plato Entidad del plato cuyos ingredientes se van a actualizar.
     * @param nuevosIngredientes Lista de DTOs con los nuevos ingredientes del plato.
     * @throws ResponseStatusException con código 400 si algún producto ingrediente no existe.
     *
     * @note Método privado utilizado internamente para actualizar ingredientes.
     * @note Realiza una operación de reemplazo completo de ingredientes.
     * @note Si la lista de nuevos ingredientes es nula o vacía, solo elimina los existentes.
     */
    private void updateIngredientes(PlatoEntity plato, List<GetIngredientesDto> nuevosIngredientes) {
        List<PlatoDetalleEntity> detallesActuales = platoDetalleRepository.findByPlatoIdPlato(Integer.valueOf(plato.getIdPlato()));
        if (!detallesActuales.isEmpty()) {
            platoDetalleRepository.deleteAll(detallesActuales);
        }

        if (nuevosIngredientes != null && !nuevosIngredientes.isEmpty()) {
            List<PlatoDetalleEntity> nuevosDetalles = new ArrayList<>();

            for (GetIngredientesDto ing : nuevosIngredientes) {

                ProductoEntity producto = productoRepository.findById(ing.getIdProducto())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                "Producto con ID " + ing.getIdProducto() + " no existe"));

                PlatoDetalleEntity detalle = new PlatoDetalleEntity();
                detalle.setPlato(plato);
                detalle.setProducto(producto);
                detalle.setCantidad(ing.getCantidad());
                nuevosDetalles.add(detalle);
            }

            platoDetalleRepository.saveAll(nuevosDetalles);
        }
    }

    /**
     * Alterna el estado de disponibilidad de un plato (activa/desactiva).
     * Cambia el valor del campo 'disponible' al opuesto de su estado actual.
     *
     * @param id Identificador único del plato cuyo estado se desea cambiar.
     * @throws ResponseStatusException con código 404 si no existe un plato con el ID proporcionado.
     * @return String con mensaje de advertencia si hay ingredientes con stock bajo/inactivos, null si todo está bien.
     *
     * @note No afecta a platos dados de baja (fechaBaja no nula).
     * @note Útil para gestionar temporalmente la disponibilidad de platos sin eliminarlos.
     */
    @Override
    public String activarDesactivarPlato(Integer id) {
        PlatoEntity plato = platoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Plato no encontrado"));

        String mensajeAdvertencia = null;
        
        // ✅ Si está desactivado y se intenta activar, validar ingredientes
        if (!plato.getDisponible()) {
            List<String> ingredientesProblematicos = new ArrayList<>();
            
            for (PlatoDetalleEntity ingrediente : plato.getIngredientes()) {
                ProductoEntity producto = ingrediente.getProducto();
                if (!producto.getActivo()) {
                    ingredientesProblematicos.add(producto.getNombre() + " (inactivo)");
                } else if (producto.getStockActual() <= producto.getStockMinimo()) {
                    ingredientesProblematicos.add(producto.getNombre() + " (stock bajo)");
                }
            }
            
            if (!ingredientesProblematicos.isEmpty()) {
                mensajeAdvertencia = "El plato se activó pero los siguientes ingredientes tienen stock bajo o esta inactivo: " +
                    String.join(", ", ingredientesProblematicos);
            }
        }
        
        plato.setDisponible(!plato.getDisponible());
        platoRepository.save(plato);
        
        return mensajeAdvertencia;
    }

    /**
     * Da de baja lógica un plato del sistema.
     * Establece fecha de baja, usuario que realiza la baja y desactiva el plato.
     * Elimina la imagen asociada del servicio S3.
     *
     * @param id Identificador único del plato a dar de baja.
     * @throws ResponseStatusException con código 404 si no existe el plato.
     * @throws ResponseStatusException con código 400 si el plato ya está dado de baja.
     *
     * @note La baja es lógica (soft delete), no elimina físicamente el registro.
     * @note Establece automáticamente: fechaBaja=ahora, userBaja=2, disponible=false.
     * @note Elimina la imagen del plato de Amazon S3 para liberar espacio.
     */
    @Override
    public void bajaPlato(Integer id) {
        PlatoEntity plato = platoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Plato no encontrado"));

        if (plato.getFechaBaja() != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El plato ya está dado de baja");
        }

        plato.setFechaBaja(LocalDateTime.now());
        plato.setUserBaja(2);
        plato.setDisponible(false);
        s3Service.deleteFile(plato.getFoto());
        platoRepository.save(plato);
    }

    /**
     * Obtiene un plato con todos sus ingredientes para operaciones internas.
     * Valida que el plato exista, esté disponible y todos sus ingredientes tengan stock.
     *
     * @param idPlato Identificador único del plato a obtener.
     * @return PlatoEntity con todos sus ingredientes cargados.
     * @throws RuntimeException si:
     *         - El plato no existe
     *         - El plato no está disponible
     *         - Algún ingrediente no tiene stock suficiente
     *
     * @note Método público utilizado para obtener platos con sus relaciones cargadas.
     * @note Lanza RuntimeException en lugar de ResponseStatusException para uso interno.
     * @note Valida stock de ingredientes en tiempo real antes de procesar.
     */
    public PlatoEntity obtenerPlatoConIngredientes(Integer idPlato) {
        PlatoEntity plato = platoRepository.findById(idPlato)
                .orElseThrow(() -> new RuntimeException("Plato no existe"));

        if (!plato.getDisponible()) {
            throw new RuntimeException("Plato no disponible");
        }
        
        // ✅ VALIDACIÓN ADICIONAL: Verificar stock de ingredientes en tiempo real
        for (PlatoDetalleEntity ingrediente : plato.getIngredientes()) {
            ProductoEntity producto = ingrediente.getProducto();
            if (!producto.getActivo()) {
                throw new RuntimeException("El plato '" + plato.getNombre() + 
                    "' no está disponible: el ingrediente '" + producto.getNombre() + "' está inactivo");
            }
            if (producto.getStockActual() <= 0) {
                throw new RuntimeException("El plato '" + plato.getNombre() + 
                    "' no está disponible: el ingrediente '" + producto.getNombre() + "' no tiene stock");
            }
        }

        return plato;
    }

    /**
     * Desactiva todos los platos que utilizan un producto específico como ingrediente.
     * Útil cuando un producto se agota o deja de estar disponible.
     *
     * @param idProducto Identificador único del producto que ha dejado de estar disponible.
     *
     * @note Solo desactiva platos que actualmente están disponibles.
     * @note Registra en consola los platos desactivados para seguimiento.
     * @note No afecta a platos ya desactivados o dados de baja.
     */
    @Override
    public void desactivarPlatosQueUsan(Integer idProducto) {
        List<PlatoEntity> platosAfectados = platoRepository.findByIngredienteProductoId(idProducto);

        for (PlatoEntity plato : platosAfectados) {
            if (plato.getDisponible()) {
                plato.setDisponible(false);
                platoRepository.save(plato);

                System.out.println("Plato desactivado: " + plato.getNombre() +
                        " (falta producto: " + idProducto + ")");
            }
        }
    }

    /**
     * Reactiva los platos que utilizan un producto específico, verificando disponibilidad.
     * Solo reactiva platos si todos sus ingredientes tienen stock suficiente.
     *
     * @param idProducto Identificador único del producto que ha vuelto a estar disponible.
     *
     * @note Verifica que todos los productos ingredientes estén activos y tengan stock por encima del mínimo.
     * @note Solo reactiva platos que actualmente están desactivados.
     * @note Registra en consola los platos reactivados para seguimiento.
     */
    @Override
    public void reactivarPlatosQueUsan(Integer idProducto) {
        List<PlatoEntity> platos = platoRepository.findByIngredienteProductoId(idProducto);

        for (PlatoEntity plato : platos) {
            // Verificar si TODOS los ingredientes tienen stock
            boolean todosTienenStock = plato.getIngredientes().stream()
                    .allMatch(ingrediente ->
                            ingrediente.getProducto().getActivo() &&
                                    ingrediente.getProducto().getStockActual() > ingrediente.getProducto().getStockMinimo()
                    );

            if (todosTienenStock && !plato.getDisponible()) {
                plato.setDisponible(true);
                platoRepository.save(plato);

                System.out.println("Plato reactivado: " + plato.getNombre());
            }
        }
    }

    /**
     * Genera un reporte de platos ordenados por cantidad de productos utilizados.
     * Proporciona estadísticas sobre la complejidad de los platos en términos de ingredientes.
     *
     * @return List<ReportePlatoProductosDTO> con estadísticas de platos y sus productos.
     *
     * @note Incluye: nombre del plato, cantidad de productos, estado de disponibilidad y tipo de plato.
     * @note Útil para análisis de costos y complejidad de preparación.
     * @note El enum TipoPlato se obtiene directamente de la base de datos sin conversión.
     */
    @Override
    public List<ReportePlatoProductosDTO> obtenerReportePlatosPorProductos() {
        List<Object[]> resultados = platoRepository.findPlatosPorCantidadProductos();

        return resultados.stream()
                .map(resultado -> new ReportePlatoProductosDTO(
                        (String) resultado[0],           // nombrePlato
                        ((Number) resultado[1]).intValue(), // cantidadProductos
                        (Boolean) resultado[2],          // platoActivo
                        (TipoPlato) resultado[3]         // ya es TipoPlato, no String
                ))
                .collect(Collectors.toList());
    }
    
    /**
     * Verifica si un plato tiene todos sus ingredientes con stock disponible.
     * Utilizado para filtrar platos realmente disponibles en los combos.
     *
     * @param plato Entidad PlatoEntity a verificar.
     * @return true si todos los ingredientes están activos y tienen stock > 0, false en caso contrario.
     * @note Método privado utilizado internamente para validación de disponibilidad real.
     */
    private boolean tieneIngredientesDisponibles(PlatoEntity plato) {
        return plato.getIngredientes().stream()
                .allMatch(ingrediente -> {
                    ProductoEntity producto = ingrediente.getProducto();
                    return producto.getActivo() && producto.getStockActual() > 0;
                });
    }
}
