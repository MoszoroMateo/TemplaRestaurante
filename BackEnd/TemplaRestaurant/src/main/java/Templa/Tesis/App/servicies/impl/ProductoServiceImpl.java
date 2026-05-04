package Templa.Tesis.App.servicies.impl;

import Templa.Tesis.App.Enums.TipoProducto;
import Templa.Tesis.App.Enums.UnidadMedida;
import Templa.Tesis.App.dtos.PostProductoDTO;
import Templa.Tesis.App.dtos.ProductoDTO;
import Templa.Tesis.App.dtos.ReporteStockBajoDTO;
import Templa.Tesis.App.entities.ProductoEntity;
import Templa.Tesis.App.repositories.ProductoRepository;
import Templa.Tesis.App.servicies.IProductoService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductoServiceImpl implements IProductoService {

    private final ModelMapper modelMapper;
    private final ProductoRepository productoRepository;
    private final PlatoServiceImpl platoService;
    private final MenuServiceImpl menuService;
    private final NotificationService notificationService;
    private final EmailService emailService;

    /**
     * Registra un nuevo producto en el sistema.
     * Realiza validaciones de campos obligatorios y verifica que no exista un producto con el mismo nombre.
     *
     * @param nuevoProducto Objeto DTO con los datos del producto a registrar.
     *                      Campos obligatorios: nombre, tipo, unidadMedida, precio.
     * @return ProductoDTO que representa el producto creado exitosamente.
     * @throws ResponseStatusException con código 400 si falta algún campo obligatorio.
     * @throws ResponseStatusException con código 409 si ya existe un producto con el mismo nombre.
     * @throws ResponseStatusException con código 500 si ocurre un error interno durante el guardado.
     */
    @Override
    public ProductoDTO registrarProducto(PostProductoDTO nuevoProducto) {
        if(nuevoProducto.getNombre() == null){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Debe ingresar el nombre");
        }
        if(nuevoProducto.getTipo() == null){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Debe ingresar el tipo de producto");
        }
        if(nuevoProducto.getUnidadMedida() == null){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Debe ingresar la unidad de medida");
        }
        if(nuevoProducto.getPrecio() == null){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Debe ingresar el precio");
        }

        ProductoEntity existe = productoRepository.findByNombre(nuevoProducto.getNombre());

        if(existe !=null){
            throw new ResponseStatusException(HttpStatus.CONFLICT,"El producto ya existe");
        }

        try{
            ProductoEntity producto = modelMapper.map(nuevoProducto,ProductoEntity.class);
            ProductoEntity productoGuardado = productoRepository.save(producto);
            ProductoDTO productoDTO = modelMapper.map(productoGuardado,ProductoDTO.class);
            
            return productoDTO;
        }
        catch (Exception e){
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,"Error al guardar el producto");
        }
    }

    /**
     * Actualiza completamente un producto existente en el sistema.
     * Modifica todos los campos del producto y gestiona automáticamente la activación/desactivación
     * de platos y menús relacionados según el nivel de stock.
     *
     * @param id Identificador único del producto a actualizar.
     * @param productoDTO Objeto DTO con los datos actualizados del producto.
     * @return ProductoDTO que representa el producto actualizado.
     * @throws EntityNotFoundException si no existe un producto con el ID proporcionado.
     * @throws Exception si ocurre un error durante la actualización.
     *
     * @note Lógica de activación/desactivación:
     *       - Si stockActual <= stockMinimo: Desactiva platos y menús que usan el producto.
     *       - Si stockActual > stockMinimo: Reactiva platos y menús que usan el producto.
     */
    @Override
    public ProductoDTO actualizarProducto(Integer id, ProductoDTO productoDTO) {
        ProductoEntity productoExistente = productoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Producto no encontrado con ID: " + id));

        productoExistente.setNombre(productoDTO.getNombre());
        productoExistente.setTipo(productoDTO.getTipo());
        productoExistente.setStockActual(productoDTO.getStockActual());
        productoExistente.setStockMinimo(productoDTO.getStockMinimo());
        productoExistente.setStockMaximo(productoDTO.getStockMaximo());
        productoExistente.setActivo(productoDTO.isActivo());
        productoExistente.setPrecio(productoDTO.getPrecio());

        if (productoExistente.getStockActual()<= productoExistente.getStockMinimo()) {
            platoService.desactivarPlatosQueUsan(id);
            menuService.desactivarMenusQueUsan(id);
        } else {
            platoService.reactivarPlatosQueUsan(id);
            menuService.reactivarMenusQueUsan(id);
        }

        ProductoEntity productoActualizado = productoRepository.save(productoExistente);
        ProductoDTO productoActualizadoDTO = modelMapper.map(productoActualizado,ProductoDTO.class);


        return productoActualizadoDTO;
    }

    /**
     * Obtiene una lista paginada de todos los productos registrados en el sistema.
     * Los productos se ordenan por nombre ascendente.
     *
     * @param page Número de página a recuperar (comenzando desde 0).
     * @param size Cantidad de elementos por página.
     * @return Page<ProductoDTO> que contiene los productos de la página solicitada,
     *         ordenados por nombre ascendente.
     * @throws Exception si ocurre un error durante la consulta a la base de datos.
     */
    @Override
    public Page<ProductoDTO> traerProductos(int page, int size) {
        Pageable pageable = PageRequest.of(page,size, Sort.by("nombre").ascending());
        Page<ProductoEntity> productoEntities = productoRepository.findAll(pageable);
        return productoEntities.map(productoEntity -> modelMapper.map(productoEntity, ProductoDTO.class));
    }

    /**
     * Obtiene una lista paginada de productos aplicando múltiples filtros de búsqueda.
     * Permite filtrar por texto, tipo de producto y estado de activación.
     * Los resultados se ordenan por nombre ascendente.
     *
     * @param page Número de página a recuperar (comenzando desde 0).
     * @param size Cantidad de elementos por página.
     * @param buscar Texto para buscar en el nombre del producto (búsqueda parcial case-insensitive).
     *               Si es null o vacío, no se aplica filtro de texto.
     * @param tipo Filtro por tipo de producto (INSUMO, BEBIDA, etc.). Si es null, no se filtra por tipo.
     * @param activo Filtro por estado de activación (true=activos, false=inactivos, null=todos).
     * @return Page<ProductoDTO> con los productos filtrados, paginados y ordenados.
     * @throws Exception si ocurre un error durante la consulta a la base de datos.
     */
    @Override
    public Page<ProductoDTO> traerProductos(int page, int size, String buscar, TipoProducto tipo, Boolean activo) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("nombre").ascending());

        Specification<ProductoEntity> spec = Specification.where(null);

        if (buscar != null && !buscar.isBlank()) {
            spec = spec.and((root, query, cb) ->
                    cb.like(cb.lower(root.get("nombre")), "%" + buscar.toLowerCase() + "%"));
        }

        if (tipo != null) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("tipo"), tipo));
        }

        if (activo != null) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("activo"), activo));
        }

        Page<ProductoEntity> entities = productoRepository.findAll(spec, pageable);
        return entities.map(entity -> modelMapper.map(entity, ProductoDTO.class));
    }

    /**
     * Elimina físicamente un producto del sistema.
     * Realiza una eliminación permanente (hard delete) del registro.
     *
     * @param id Identificador único del producto a eliminar.
     * @throws EntityNotFoundException si no existe un producto con el ID proporcionado.
     * @throws Exception si ocurre un error durante la eliminación o si hay
     *         violaciones de integridad referencial (producto usado en otras entidades).
     *
     * @warning Esta operación es irreversible y puede fallar si el producto
     *          está siendo referenciado por platos, menús u otras entidades.
     * @note Considerar usar baja lógica en lugar de eliminación física.
     */
    @Override
    public void eliminarProducto(Integer id) {
        ProductoEntity producto = productoRepository.findById(id)
                .orElseThrow(()-> new EntityNotFoundException("Producto no encontrado con el ID: " + id));

        //  Baja lógica en lugar de eliminación física
        producto.setActivo(false);
        productoRepository.save(producto);

        //  Desactivar platos y menús que usan este producto
        platoService.desactivarPlatosQueUsan(id);
        menuService.desactivarMenusQueUsan(id);


    }

    /**
     * Obtiene una lista paginada exclusivamente de productos de tipo INSUMO.
     * Los resultados se ordenan por nombre ascendente.
     *
     * @param page Número de página a recuperar (comenzando desde 0).
     * @param size Cantidad de elementos por página.
     * @return Page<ProductoDTO> que contiene los insumos de la página solicitada,
     *         ordenados por nombre ascendente.
     * @throws Exception si ocurre un error durante la consulta a la base de datos.
     */
    @Override
    public Page<ProductoDTO> traerInsumos(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("nombre").ascending());

        Specification<ProductoEntity> spec = Specification.where(
                (root, query, cb) -> cb.equal(root.get("tipo"), TipoProducto.INSUMO)
        );

        Page<ProductoEntity> entities = productoRepository.findAll(spec, pageable);
        return entities.map(entity -> modelMapper.map(entity, ProductoDTO.class));
    }

    /**
     * Reduce el stock disponible de un producto en la cantidad especificada.
     * Realiza bloqueo optimista para manejo de concurrencia y emite alertas
     * si el stock cae por debajo del mínimo configurado.
     *
     * @param idProducto Identificador único del producto cuyo stock se reducirá.
     * @param cantidad Cantidad a reducir del stock actual (debe ser positiva).
     * @return ProductoEntity actualizado con el nuevo stock.
     * @throws RuntimeException si:
     *         - El producto no existe
     *         - Stock insuficiente para la reducción
     * @throws Exception si ocurre un error durante la transacción.
     *
     * @Transactional La operación se ejecuta dentro de una transacción.
     * @note Lógica de alertas:
     *       1. Si stockActual <= stockMinimo: Envía notificación y email de alerta.
     *       2. Si stockActual <= stockMinimo: Desactiva producto, platos y menús relacionados.
     * @warning Usa bloqueo SELECT FOR UPDATE (@Lock(LockModeType.PESSIMISTIC_WRITE))
     *          para prevenir condiciones de carrera.
     */
    @Override
    @Transactional
    public ProductoEntity reducirStock(Integer idProducto, double cantidad) {
        ProductoEntity producto = productoRepository.findByIdWithLock(idProducto)
                .orElseThrow(() -> new RuntimeException("Producto no existe"));

        if (producto.getStockActual() < cantidad) {
            throw new RuntimeException("Stock insuficiente");
        }

        producto.setStockActual(producto.getStockActual() - cantidad);

        if (producto.getStockActual() <= producto.getStockMinimo()) {
            //TODO: Emitir alerta
            ProductoDTO productoDTO = modelMapper.map(producto,ProductoDTO.class);
            notificationService.enviarAlertaStockBajo(productoDTO);

            //Enviar email de alerta
            emailService.enviarMailStockBajo(
                    "templarestaurante@gmail.com",
                    producto.getNombre(),
                    producto.getStockActual(),
                    producto.getStockMinimo()
            );
        }

        if (producto.getStockActual() <= producto.getStockMinimo()) {
            producto.setActivo(false);
            platoService.desactivarPlatosQueUsan(idProducto);
            menuService.desactivarMenusQueUsan(idProducto);
        }

        return productoRepository.save(producto);
    }

    /**
     * Aumenta el stock disponible de un producto en la cantidad especificada.
     * Realiza bloqueo optimista para manejo de concurrencia y reactiva
     * automáticamente el producto, platos y menús si el stock supera el mínimo.
     *
     * @param idProducto Identificador único del producto cuyo stock se aumentará.
     * @param cantidad Cantidad a agregar al stock actual (debe ser positiva).
     * @throws RuntimeException si el producto no existe.
     * @throws Exception si ocurre un error durante la transacción.
     *
     * @Transactional La operación se ejecuta dentro de una transacción.
     * @note Lógica de reactivación:
     *       Si stockActual > stockMinimo: Reactiva producto, platos y menús relacionados.
     * @warning Usa bloqueo SELECT FOR UPDATE (@Lock(LockModeType.PESSIMISTIC_WRITE))
     *          para prevenir condiciones de carrera.
     */
    @Override
    @Transactional
    public void aumentarStock(Integer idProducto, double cantidad) {
        ProductoEntity producto = productoRepository.findByIdWithLock(idProducto)
                .orElseThrow(() -> new RuntimeException("Producto no existe"));

        producto.setStockActual(producto.getStockActual() + cantidad);

        if (producto.getStockActual() > producto.getStockMinimo()) {
            producto.setActivo(true);
            platoService.reactivarPlatosQueUsan(idProducto);
            menuService.reactivarMenusQueUsan(idProducto);
        }
        productoRepository.save(producto);
    }

    /**
     * Genera un reporte de productos cuyo stock actual está por debajo o igual al stock mínimo configurado.
     * Calcula automáticamente la cantidad faltante para cada producto.
     *
     * @return List<ReporteStockBajoDTO> con información detallada de productos con stock bajo,
     *         incluyendo cantidad faltante calculada.
     * @throws Exception si ocurre un error durante la consulta a la base de datos.
     *
     * @note Los productos incluidos cumplen: stockActual <= stockMinimo.
     * @note La cantidad faltante se calcula como: stockMinimo - stockActual.
     */
    @Override
    public List<ReporteStockBajoDTO> obtenerProductosStockBajo() {
        List<Object[]> resultados = productoRepository.findProductosStockBajo();

        return resultados.stream()
                .map(resultado -> new ReporteStockBajoDTO(
                        (String) resultado[0],              // nombre
                        (TipoProducto) resultado[1],        // tipo
                        (UnidadMedida) resultado[2],        // unidadMedida
                        (Double) resultado[3],              // stockActual
                        (Double) resultado[4],              // stockMinimo
                        Double.valueOf(((Double) resultado[4]) - ((Double) resultado[3])), // cantidad faltante
                        (Boolean) resultado[5]              // activo ← NUEVO
                ))
                .collect(Collectors.toList());
    }
}
