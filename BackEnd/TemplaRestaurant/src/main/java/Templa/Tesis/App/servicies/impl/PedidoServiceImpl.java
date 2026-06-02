package Templa.Tesis.App.servicies.impl;

import Templa.Tesis.App.Enums.EstadoMesa;
import Templa.Tesis.App.Enums.EstadoPedido;
import Templa.Tesis.App.Enums.EstadoPedidoDetalle;
import Templa.Tesis.App.Enums.TipoProducto;
import Templa.Tesis.App.dtos.*;
import Templa.Tesis.App.entities.*;
import Templa.Tesis.App.repositories.*;
import Templa.Tesis.App.servicies.*;
import Templa.Tesis.App.controllers.SseController;
import jakarta.annotation.PostConstruct;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.transaction.Transactional;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;
import org.springframework.stereotype.Service;


import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;


@Service
public class PedidoServiceImpl implements IPedidoService {
    @Autowired
    private PedidoRepository pedidoRepository;
    @Autowired
    private PedidoDetalleRepository pedidoDetalleRepository;
    @Autowired
    private IProductoService productoService;
    @Autowired
    private IMesasService mesasService;
    @Autowired
    private IPlatoService platoService;
    @Autowired
    private UsuarioService usuarioService;
    @Autowired
    private IMenuService menuService;
    @Autowired
    private ModelMapper modelMapper;
    @Autowired
    private EmailService emailService;
    @Autowired
    private SseController sseController;
    @Autowired
    private NotificationService notificationService;

    /**
     * Crea un nuevo pedido en el sistema con todos sus detalles.
     * Maneja tres tipos de detalles: productos, platos y menús.
     * Actualiza el estado de la mesa y notifica a la cocina en tiempo real.
     *
     * @param dto Objeto DTO con los datos del nuevo pedido.
     *           Debe incluir: detalles (al menos uno), idMesa, idMozo.
     * @return PedidoDTO con todos los datos del pedido creado, incluyendo detalles.
     * @throws RuntimeException si:
     *         - El pedido no tiene detalles
     *         - No se especifica mesa o mozo
     *         - La mesa seleccionada no está disponible
     *
     * @Transactional La operación se ejecuta dentro de una transacción.
     * @note Cambia el estado de la mesa a OCUPADA automáticamente.
     * @note Emite notificación SSE a la cocina para notificar nuevo pedido.
     * @note Maneja tres tipos de detalles:
     *       1. Productos: reduce stock inmediatamente
     *       2. Platos: reduce stock de todos sus ingredientes
     *       3. Menús: reduce stock de todos los items del menú
     */
    @Override
    @Transactional
    public PedidoDTO crearPedido(PostPedidoDTO dto) {
        if (dto.getDetalles().isEmpty()) {
            throw new IllegalArgumentException("El pedido debe tener al menos un detalle");
        }
        if (dto.getIdMesa() == null) {
            throw new IllegalArgumentException("El pedido debe tener una mesa asignada");
        }
        if (dto.getIdMozo() == null) {
            throw new IllegalArgumentException("El pedido debe tener un mozo asignado");
        }

        List<GetPedidoDetalleDTO> detallesDto = new ArrayList<>();
        PedidoEntity nuevoPedidoE = new PedidoEntity();

        GetMesaDto mesaDto = mesasService.getMesaById(dto.getIdMesa());
        if(mesaDto.getEstadoMesa()!= EstadoMesa.DISPONIBLE){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La mesa seleccionada no está disponible");
        }
        nuevoPedidoE.setMesa(modelMapper.map(mesaDto, MesaEntity.class));

        UsuarioDTO mozo = usuarioService.buscarUsuarioPorId(dto.getIdMozo());
        nuevoPedidoE.setMozo(modelMapper.map(mozo, UsuarioEntity.class));

        nuevoPedidoE.setFechaPedido(LocalDateTime.now());
        nuevoPedidoE.setEstado(EstadoPedido.ORDENADO);

        pedidoRepository.save(nuevoPedidoE);

        for (PostPedidoDetalleDTO detalleDto : dto.getDetalles()) {
            if (detalleDto.getIdProducto() != null && detalleDto.getIdProducto() != 0) {
                detallesDto.add(handleProductoDetalle(detalleDto, nuevoPedidoE));
            } else if (detalleDto.getIdPlato() != null && detalleDto.getIdPlato() != 0) {
                detallesDto.addAll(handlePlatoDetalle(detalleDto, nuevoPedidoE));
            } else if (detalleDto.getIdMenu() != null && detalleDto.getIdMenu() != 0) {
                detallesDto.addAll(handleMenuDetalle(detalleDto, nuevoPedidoE));
            }
        }

        mesasService.cambiarEstadoMesa(mesaDto.getIdMesa(), EstadoMesa.OCUPADA);
        pedidoRepository.save(nuevoPedidoE);
        PedidoDTO pedidoCreado = modelMapper.map(nuevoPedidoE, PedidoDTO.class);
        pedidoCreado.setDetalles(detallesDto);

        // 🔥 Emitir notificación SSE de nuevo pedido
        sseController.sendNotification("cocina", "nuevo-pedido", pedidoCreado);

        return pedidoCreado;
    }

    /**
     * Obtiene un pedido específico por su identificador único.
     *
     * @param id Identificador único del pedido a buscar.
     * @return PedidoDTO con todos los datos del pedido encontrado.
     * @throws RuntimeException si no existe un pedido con el ID proporcionado.
     */
    @Override
    public PedidoDTO obtenerPedido(Integer id) {
        PedidoEntity existe = pedidoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("El pedido con id " + id + " no existe"));

        return modelMapper.map(existe, PedidoDTO.class);
    }

    /**
     * Lista pedidos paginados con múltiples filtros de búsqueda.
     * Permite filtrar por texto, estado del pedido y rango de fechas.
     * Los resultados se ordenan por fecha de pedido descendente.
     *
     * @param page Número de página a recuperar (comenzando desde 0).
     * @param size Cantidad de elementos por página.
     * @param buscarFiltro Texto para buscar en número de mesa, nombre o apellido del mozo.
     *                    Si es null o vacío, no se aplica filtro de texto.
     * @param estadoPedido Estado del pedido a filtrar (ej: "ORDENADO", "EN_PROCESO", "FINALIZADO").
     *                    Si es null o vacío, no se filtra por estado.
     * @param fechaDesde Fecha de inicio del período a consultar.
     *                  Si es null, se establece al primer día del mes actual.
     * @param fechaHasta Fecha de fin del período a consultar.
     *                  Si es null, se establece a la fecha actual.
     * @return Page<PedidoDTO> con los pedidos filtrados, paginados y ordenados.
     * @throws RuntimeException si el estado de pedido proporcionado no es válido.
     *
     * @note Los filtros de fecha se convierten a LocalDateTime (inicio del día a fin del día).
     * @note Utiliza Specification para consultas dinámicas con joins.
     */
    @Override
    public Page<PedidoDTO> listarPedidos(int page, int size, String buscarFiltro, String estadoPedido,
                                            LocalDate fechaDesde, LocalDate fechaHasta) {
        if (fechaDesde == null) {
            fechaDesde = LocalDate.now().withDayOfMonth(1);
        }
        if (fechaHasta == null) {
            fechaHasta = LocalDate.now();
        }

        LocalDateTime fechaDesdeTime = fechaDesde.atStartOfDay();
        LocalDateTime fechaHastaTime = fechaHasta.atTime(23, 59, 59);

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "fechaPedido"));

        Specification<PedidoEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (buscarFiltro != null && !buscarFiltro.trim().isEmpty()) {
                String pattern = "%" + buscarFiltro.toLowerCase().trim() + "%";

                Join<PedidoEntity, UsuarioEntity> mozoJoin = root.join("mozo", JoinType.LEFT);
                Join<UsuarioEntity, PersonaEntity> personaJoin = mozoJoin.join("persona", JoinType.LEFT);
                Join<PedidoEntity, MesaEntity> mesaJoin = root.join("mesa", JoinType.LEFT);

                predicates.add(cb.or(
                        cb.like(cb.lower(mesaJoin.get("numeroMesa").as(String.class)), pattern),
                        cb.like(cb.lower(personaJoin.get("nombre")), pattern),
                        cb.like(cb.lower(personaJoin.get("apellido")), pattern)
                ));
            }

            if (estadoPedido != null && !estadoPedido.trim().isEmpty()) {
                try {
                    EstadoPedido estado = EstadoPedido.valueOf(estadoPedido.toUpperCase());
                    predicates.add(cb.equal(root.get("estado"), estado));
                } catch (IllegalArgumentException e) {
                    throw new IllegalArgumentException("Estado de pedido inválido: " + estadoPedido);
                }
            }

            predicates.add(cb.between(root.get("fechaPedido"), fechaDesdeTime, fechaHastaTime));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        Page<PedidoEntity> pedidosPage = pedidoRepository.findAll(spec, pageable);
        return pedidosPage.map(pedido -> modelMapper.map(pedido, PedidoDTO.class));

    }

    /**
     * Cancela completamente un pedido existente.
     * Devuelve el stock de todos los detalles no entregados y libera la mesa.
     *
     * @param idPedido Identificador único del pedido a cancelar.
     * @return PedidoDTO con los datos del pedido cancelado.
     * @throws RuntimeException si:
     *         - El pedido no existe
     *         - El pedido ya está finalizado
     *
     * @Transactional La operación se ejecuta dentro de una transacción.
     * @note Solo cancela detalles con estado diferente a ENTREGADO.
     * @note Devuelve automáticamente el stock de productos/ingredientes.
     * @note Libera la mesa asociada al pedido.
     * @note Emite notificación SSE a la cocina sobre el pedido actualizado.
     */
    @Override
    @Transactional
    public PedidoDTO cancelarPedido(Integer idPedido) {
        PedidoEntity existe = pedidoRepository.findById(idPedido)
                .orElseThrow(() -> new EntityNotFoundException("El pedido con id " + idPedido + " no existe"));

        if(existe.getEstado() == EstadoPedido.FINALIZADO) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se puede cancelar un pedido finalizado");
        }

        for(PedidoDetalleEntity detalle : existe.getDetalles()) {
            if(detalle.getEstado() != EstadoPedidoDetalle.ENTREGADO) {
                detalle.setEstado(EstadoPedidoDetalle.CANCELADO);
                devolverStockPorDetalle(detalle);
                pedidoDetalleRepository.save(detalle);
            }
        }

        existe.setEstado(EstadoPedido.CANCELADO);
        pedidoRepository.save(existe);

        // Liberar mesa
        mesasService.cambiarEstadoMesa(existe.getMesa().getIdMesa(), EstadoMesa.DISPONIBLE);

        PedidoDTO pedidoCancelado = modelMapper.map(existe, PedidoDTO.class);

        // 🔥 Emitir notificación SSE de pedido actualizado
        sseController.sendNotification("cocina", "pedido-actualizado", pedidoCancelado);

        return pedidoCancelado;
    }

    /**
     * Cancela solo los detalles pendientes de un pedido.
     * Útil para modificar pedidos parcialmente.
     *
     * @param idPedido Identificador único del pedido cuyos detalles se cancelarán.
     * @return PedidoDTO con los datos actualizados del pedido.
     * @throws RuntimeException si no existe un pedido con el ID proporcionado.
     *
     * @Transactional La operación se ejecuta dentro de una transacción.
     * @note Solo cancela detalles con estado PENDIENTE.
     * @note Devuelve automáticamente el stock de los detalles cancelados.
     * @note Emite notificación SSE a la cocina sobre el pedido actualizado.
     */
    @Override
    @Transactional
    public PedidoDTO cancelarDetalle(Integer idPedido) {
        PedidoEntity existe = pedidoRepository.findById(idPedido)
                .orElseThrow(() -> new EntityNotFoundException("El pedido con id " + idPedido + " no existe"));

        for(PedidoDetalleEntity detalle : existe.getDetalles()){
            if(detalle.getEstado() != EstadoPedidoDetalle.PENDIENTE) continue;

            devolverStockPorDetalle(detalle);

            detalle.setEstado(EstadoPedidoDetalle.CANCELADO);
            pedidoDetalleRepository.save(detalle);
        }

        pedidoRepository.save(existe);
        PedidoDTO pedidoActualizado = modelMapper.map(existe, PedidoDTO.class);

        // 🔥 Emitir notificación SSE de pedido actualizado
        sseController.sendNotification("cocina", "pedido-actualizado", pedidoActualizado);

        return pedidoActualizado;
    }

    /**
     * Cancela un detalle específico del pedido.
     * Marca el detalle especificado como CANCELADO y devuelve el stock asociado.
     *
     * @param idPedido Identificador único del pedido.
     * @param idDetalle Identificador único del detalle a cancelar.
     * @return PedidoDTO con los datos actualizados del pedido.
     * @throws RuntimeException si no existe el pedido o el detalle.
     *
     * @Transactional La operación se ejecuta dentro de una transacción.
     * @note Solo se puede cancelar si: está PENDIENTE o está LISTO_PARA_ENTREGAR y es PRODUCTO BEBIDA.
     * @note Emite notificación SSE a la cocina sobre el pedido actualizado.
     */
    @Override
    @Transactional
    public PedidoDTO cancelarDetalleEspecifico(Integer idPedido, Integer idDetalle) {
        PedidoEntity existe = pedidoRepository.findById(idPedido)
                .orElseThrow(() -> new EntityNotFoundException("El pedido con id " + idPedido + " no existe"));

        // Buscar el detalle específico
        PedidoDetalleEntity detalleEncontrado = existe.getDetalles().stream()
                .filter(d -> d.getIdPedidoDetalle().equals(idDetalle))
                .findFirst()
                .orElseThrow(() -> new EntityNotFoundException("El detalle con id " + idDetalle + " no existe en el pedido"));

        // ✅ Validar si se puede cancelar:
        // - PENDIENTE: Siempre se puede cancelar
        // - LISTO_PARA_ENTREGAR: Solo si es un PRODUCTO BEBIDA (ej: Coca-Cola)
        //   Los platos/menús listos ya no se pueden cancelar porque pasaron por cocina
        boolean puedesCancelar = false;
        
        if (detalleEncontrado.getEstado() == EstadoPedidoDetalle.PENDIENTE) {
            puedesCancelar = true;
        } else if (detalleEncontrado.getEstado() == EstadoPedidoDetalle.LISTO_PARA_ENTREGAR) {
            // Solo permitir cancelar si es un PRODUCTO con tipo BEBIDA
            if (detalleEncontrado.getProducto() != null && 
                detalleEncontrado.getProducto().getTipo() == TipoProducto.BEBIDA) {
                puedesCancelar = true;
            }
        }
        
        if (puedesCancelar) {
            devolverStockPorDetalle(detalleEncontrado);
            detalleEncontrado.setEstado(EstadoPedidoDetalle.CANCELADO);
            pedidoDetalleRepository.save(detalleEncontrado);
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Solo se pueden cancelar items PENDIENTES o PRODUCTOS BEBIDA listos para entregar");
        }

        pedidoRepository.save(existe);
        PedidoDTO pedidoActualizado = modelMapper.map(existe, PedidoDTO.class);

        // 🔥 Emitir notificación SSE de pedido actualizado
        sseController.sendNotification("cocina", "pedido-actualizado", pedidoActualizado);

        return pedidoActualizado;
    }

    /**
     * Marca todos los detalles listos para entregar como entregados.
     * Avanza el estado de los detalles de LISTO_PARA_ENTREGAR a ENTREGADO.
     *
     * @param idPedido Identificador único del pedido cuyos detalles se marcarán como entregados.
     * @return PedidoDTO con los datos actualizados del pedido.
     * @throws RuntimeException si no existe un pedido con el ID proporcionado.
     *
     * @Transactional La operación se ejecuta dentro de una transacción.
     * @note Solo afecta detalles con estado LISTO_PARA_ENTREGAR.
     * @note Emite notificación SSE a la cocina sobre el pedido actualizado.
     */
    @Override
    @Transactional
    public PedidoDTO marcarDetalleEntregado(Integer idPedido) {
        PedidoEntity existe = pedidoRepository.findById(idPedido)
                .orElseThrow(() -> new EntityNotFoundException("El pedido con id " + idPedido + " no existe"));

        for(PedidoDetalleEntity detalle : existe.getDetalles()){
            if(detalle.getEstado() != EstadoPedidoDetalle.LISTO_PARA_ENTREGAR) continue;
            detalle.setEstado(EstadoPedidoDetalle.ENTREGADO);
            pedidoDetalleRepository.save(detalle);
        }
        pedidoRepository.save(existe);
        PedidoDTO pedidoActualizado = modelMapper.map(existe, PedidoDTO.class);

        // 🔥 Emitir notificación SSE de pedido actualizado
        sseController.sendNotification("cocina", "pedido-actualizado", pedidoActualizado);

        return pedidoActualizado;
    }

    /**
     * Inicia la preparación de un pedido.
     * Cambia el estado del pedido a EN_PROCESO y los detalles a EN_PREPARACION.
     *
     * @param idPedido Identificador único del pedido a iniciar.
     * @return PedidoDTO con los datos actualizados del pedido.
     * @throws RuntimeException si no existe un pedido con el ID proporcionado.
     *
     * @Transactional La operación se ejecuta dentro de una transacción.
     * @note Solo afecta detalles con estado PENDIENTE.
     * @note Emite notificación SSE a la cocina sobre el pedido actualizado.
     */
    @Override
    @Transactional
    public PedidoDTO iniciarPedido(Integer idPedido) {
        PedidoEntity existe = pedidoRepository.findById(idPedido)
                .orElseThrow(() -> new EntityNotFoundException("El pedido con id " + idPedido + " no existe"));

        existe.setEstado(EstadoPedido.EN_PROCESO);
        for(PedidoDetalleEntity detalle : existe.getDetalles()){
            if(detalle.getEstado() != EstadoPedidoDetalle.PENDIENTE) continue;
            detalle.setEstado(EstadoPedidoDetalle.EN_PREPARACION);
            pedidoDetalleRepository.save(detalle);
        }
        pedidoRepository.save(existe);
        PedidoDTO pedidoActualizado = modelMapper.map(existe, PedidoDTO.class);

        // 🔥 Emitir notificación SSE de pedido actualizado
        sseController.sendNotification("cocina", "pedido-actualizado", pedidoActualizado);

        return pedidoActualizado;
    }

    /**
     * Marca los detalles en preparación como listos para entregar.
     * Notifica al mozo que el pedido está listo para ser servido.
     *
     * @param idPedido Identificador único del pedido cuyos detalles están listos.
     * @return PedidoDTO con los datos actualizados del pedido.
     * @throws RuntimeException si no existe un pedido con el ID proporcionado.
     *
     * @Transactional La operación se ejecuta dentro de una transacción.
     * @note Solo afecta detalles con estado EN_PREPARACION.
     * @note Emite notificación SSE a la cocina sobre el pedido actualizado.
     * @note Envía notificación específica al mozo asignado al pedido.
     */
    @Override
    @Transactional
    public PedidoDTO marcarDetalleParaEntregar(Integer idPedido) {
        PedidoEntity existe = pedidoRepository.findById(idPedido)
                .orElseThrow(() -> new EntityNotFoundException("El pedido con id " + idPedido + " no existe"));

        for(PedidoDetalleEntity detalle : existe.getDetalles()){
            if(detalle.getEstado() != EstadoPedidoDetalle.EN_PREPARACION) continue;
            detalle.setEstado(EstadoPedidoDetalle.LISTO_PARA_ENTREGAR);
            pedidoDetalleRepository.save(detalle);
        }

        pedidoRepository.save(existe);
        PedidoDTO pedidoActualizado = modelMapper.map(existe, PedidoDTO.class);

        // 🔥 Emitir notificación SSE de pedido actualizado
        sseController.sendNotification("cocina", "pedido-actualizado", pedidoActualizado);

        // 🔔 Notificar al mozo que el pedido está listo para entregar
        Integer idMozo = existe.getMozo().getId();
        String numeroMesa = existe.getMesa().getNumeroMesa();
        notificationService.enviarNotificacionPedidoListo(idMozo, existe.getId(), numeroMesa);

        return pedidoActualizado;
    }

    /**
     * Finaliza completamente un pedido.
     * Valida que todos los detalles hayan sido entregados antes de finalizar.
     *
     * @param idPedido Identificador único del pedido a finalizar.
     * @return PedidoDTO con los datos del pedido finalizado.
     * @throws RuntimeException si:
     *         - El pedido no existe
     *         - El pedido está cancelado, finalizado o aún ordenado
     *         - Hay detalles que no han sido entregados
     *
     * @Transactional La operación se ejecuta dentro de una transacción.
     * @note Valida que todos los detalles tengan estado ENTREGADO.
     * @note Libera la mesa asociada al pedido.
     * @note Emite notificación SSE a la cocina sobre el pedido finalizado.
     */
    @Override
    @Transactional
    public PedidoDTO finalizarPedido(Integer idPedido) {
        PedidoEntity existe = pedidoRepository.findById(idPedido)
                .orElseThrow(() -> new EntityNotFoundException("El pedido con id " + idPedido + " no existe"));

        if(existe.getEstado() == EstadoPedido.CANCELADO || existe.getEstado() == EstadoPedido.FINALIZADO || existe.getEstado() == EstadoPedido.ORDENADO) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se puede finalizar un pedido en estado " + existe.getEstado());
        }

        // ✅ Verificar que al menos haya un item activo (no cancelado)
        long itemsActivos = existe.getDetalles().stream()
                .filter(d -> d.getEstado() != EstadoPedidoDetalle.CANCELADO)
                .count();

        if (itemsActivos == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se puede finalizar el pedido porque todos los items están cancelados. Use la opción de cancelar pedido.");
        }

        // ✅ Validar que todos los items ACTIVOS (no cancelados) estén ENTREGADOS
        for(PedidoDetalleEntity detalle : existe.getDetalles()){
            // Ignorar items cancelados en la validación
            if(detalle.getEstado() == EstadoPedidoDetalle.CANCELADO) {
                continue;
            }
            
            if(detalle.getEstado() != EstadoPedidoDetalle.ENTREGADO) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se puede finalizar el pedido porque tiene detalles en estado " + detalle.getEstado());
            }
        }

        existe.setEstado(EstadoPedido.FINALIZADO);
        mesasService.cambiarEstadoMesa(existe.getMesa().getIdMesa(),EstadoMesa.DISPONIBLE);
        pedidoRepository.save(existe);
        PedidoDTO pedidoFinalizado = modelMapper.map(existe, PedidoDTO.class);

        // 🔥 Emitir notificación SSE de pedido actualizado
        sseController.sendNotification("cocina", "pedido-actualizado", pedidoFinalizado);

        return pedidoFinalizado;
    }

    /**
     * Inserta nuevos detalles a un pedido existente.
     * Permite agregar items adicionales a un pedido ya creado.
     *
     * @param idPedido Identificador único del pedido al que se agregarán detalles.
     * @param dto Objeto DTO con los nuevos detalles a agregar.
     * @return PedidoDTO con los datos actualizados del pedido, incluyendo nuevos detalles.
     * @throws RuntimeException si:
     *         - No se proporcionan detalles
     *         - El pedido no existe
     *         - El pedido está finalizado o cancelado
     *
     * @Transactional La operación se ejecuta dentro de una transacción.
     * @note Cambia el estado del pedido a ORDENADO si se agregan nuevos detalles.
     * @note Maneja los mismos tipos de detalles que crearPedido (productos, platos, menús).
     * @note Emite notificación SSE a la cocina sobre el pedido actualizado.
     */
    @Override
    @Transactional
    public PedidoDTO insertarDetalles(Integer idPedido, PostPedidoDTO dto) {
        if(dto.getDetalles().isEmpty()) {
            throw new IllegalArgumentException("El pedido debe tener al menos un detalle");
        }

        PedidoEntity existe = pedidoRepository.findById(idPedido)
                .orElseThrow(() -> new EntityNotFoundException("El pedido con id " + idPedido + " no existe"));

        if(existe.getEstado() == EstadoPedido.FINALIZADO || existe.getEstado() == EstadoPedido.CANCELADO) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se pueden agregar detalles a un pedido: "+ existe.getEstado());
        }

        existe.setEstado(EstadoPedido.ORDENADO);
        List<GetPedidoDetalleDTO> detallesDto = new ArrayList<>();

        for (PostPedidoDetalleDTO detalleDto : dto.getDetalles()) {
            if (detalleDto.getIdProducto() != null && detalleDto.getIdProducto() != 0) {
                detallesDto.add(handleProductoDetalle(detalleDto, existe));
            } else if (detalleDto.getIdPlato() != null && detalleDto.getIdPlato() != 0) {
                detallesDto.addAll(handlePlatoDetalle(detalleDto, existe));
            } else if (detalleDto.getIdMenu() != null && detalleDto.getIdMenu() != 0) {
                detallesDto.addAll(handleMenuDetalle(detalleDto, existe));
            }
        }

        pedidoRepository.save(existe);
        PedidoDTO pedidoActualizado = modelMapper.map(existe, PedidoDTO.class);
        pedidoActualizado.setDetalles(detallesDto);

        // 🔥 Emitir notificación SSE de pedido actualizado
        sseController.sendNotification("cocina", "pedido-actualizado", pedidoActualizado);

        return pedidoActualizado;
    }

    /**
     * Obtiene el pedido activo asociado a una mesa específica.
     * Busca pedidos que no estén finalizados ni cancelados.
     *
     * @param idMesa Identificador único de la mesa para buscar pedidos activos.
     * @return PedidoDTO con el pedido activo encontrado para la mesa.
     * @throws RuntimeException si no hay pedidos activos para la mesa especificada.
     */
    @Override
    public PedidoDTO getPedidoByMesa(Integer idMesa) {
        PedidoEntity existe = pedidoRepository.findPedidoActivoByMesa(idMesa)
                .orElseThrow(() -> new EntityNotFoundException("No hay pedidos activos para la mesa con id " + idMesa));

        return modelMapper.map(existe, PedidoDTO.class);
    }

    /**
     * Genera un reporte de cantidad de pedidos por fecha en un rango específico.
     * Excluye pedidos cancelados del reporte.
     *
     * @param fechaDesde Fecha de inicio del período a analizar.
     *                  Si es null, se establece a 30 días antes de hoy.
     * @param fechaHasta Fecha de fin del período a analizar.
     *                  Si es null, se establece a la fecha actual.
     * @return List<ReportePedidosPorFechaDTO> con estadísticas de pedidos por fecha.
     *
     * @note Excluye automáticamente pedidos con estado CANCELADO.
     * @note Las fechas se convierten a LocalDateTime (inicio del día a inicio del día siguiente).
     */
    @Override
    public List<ReportePedidosPorFechaDTO> obtenerReportePedidosPorFecha(LocalDate fechaDesde, LocalDate fechaHasta) {
        if (fechaDesde == null) {
            fechaDesde = LocalDate.now().minusDays(30);
        }
        if (fechaHasta == null) {
            fechaHasta = LocalDate.now();
        }

        LocalDateTime fechaDesdeInicio = fechaDesde.atStartOfDay();
        LocalDateTime fechaHastaFin = fechaHasta.plusDays(1).atStartOfDay();

        List<Object[]> resultados = pedidoRepository.obtenerCantidadPedidosPorFecha(
                fechaDesdeInicio, fechaHastaFin, EstadoPedido.CANCELADO);

        List<ReportePedidosPorFechaDTO> reporte = new ArrayList<>();
        for (Object[] resultado : resultados) {
            ReportePedidosPorFechaDTO dto = new ReportePedidosPorFechaDTO();

            // Si usaste CAST en el SELECT, el resultado[0] será un Date
            LocalDate fecha = ((java.sql.Date) resultado[0]).toLocalDate();
            dto.setFecha(fecha);

            dto.setCantidadPedidos(((Number) resultado[1]).intValue());
            reporte.add(dto);
        }

        return reporte;
    }

    /**
     * Genera un reporte de los menús más pedidos en un rango de fechas.
     * Ordena los resultados por cantidad de pedidos descendente.
     *
     * @param fechaDesde Fecha de inicio del período a analizar.
     *                  Si es null, se establece a 30 días antes de hoy.
     * @param fechaHasta Fecha de fin del período a analizar.
     *                  Si es null, se establece a la fecha actual.
     * @return List<ReporteMenusMasPedidosDTO> con estadísticas de menús más populares.
     *
     * @note Excluye automáticamente pedidos con estado CANCELADO.
     * @note Las fechas se convierten a LocalDateTime (inicio del día a inicio del día siguiente).
     */
    @Override
    public List<ReporteMenusMasPedidosDTO> obtenerMenusMasPedidos(LocalDate fechaDesde, LocalDate fechaHasta) {
        if (fechaDesde == null) {
            fechaDesde = LocalDate.now().minusDays(30);
        }
        if (fechaHasta == null) {
            fechaHasta = LocalDate.now();
        }

        LocalDateTime fechaDesdeInicio = fechaDesde.atStartOfDay();
        LocalDateTime fechaHastaFin = fechaHasta.plusDays(1).atStartOfDay();

        List<Object[]> resultados = pedidoRepository.obtenerMenusMasPedidos(
                fechaDesdeInicio, fechaHastaFin, EstadoPedido.CANCELADO);

        List<ReporteMenusMasPedidosDTO> reporte = new ArrayList<>();
        for (Object[] resultado : resultados) {
            ReporteMenusMasPedidosDTO dto = new ReporteMenusMasPedidosDTO();
            dto.setNombreMenu((String) resultado[0]);
            dto.setCantidadPedidos(((Number) resultado[1]).intValue());
            reporte.add(dto);
        }

        return reporte;
    }

    /**
     * Procesa un detalle de tipo producto en un pedido.
     * Reduce el stock del producto y crea el detalle del pedido.
     *
     * @param detalleDto Objeto DTO con los datos del detalle de producto.
     * @param pedido Entidad del pedido al que se agregará el detalle.
     * @return GetPedidoDetalleDTO con los datos del detalle creado.
     * @throws RuntimeException si la cantidad es menor o igual a 0.
     *
     * @note Método privado utilizado internamente para manejar detalles de productos.
     * @note Reduce automáticamente el stock del producto.
     * @note Establece el precio unitario del producto en el detalle.
     */
    private GetPedidoDetalleDTO handleProductoDetalle(PostPedidoDetalleDTO detalleDto, PedidoEntity pedido) {
        if (detalleDto.getCantidad() <= 0) {
            throw new IllegalArgumentException("La cantidad debe ser mayor a 0");
        }

        ProductoEntity producto = productoService.reducirStock(
                detalleDto.getIdProducto(),
                detalleDto.getCantidad()
        );

        // ✅ Si es una BEBIDA (producto), no pasa por cocina → LISTO_PARA_ENTREGAR
        // Los PLATOS BEBIDA sí pasan por cocina porque requieren preparación (ej: limonada)
        EstadoPedidoDetalle estadoInicial = (producto.getTipo() == TipoProducto.BEBIDA)
                ? EstadoPedidoDetalle.LISTO_PARA_ENTREGAR
                : EstadoPedidoDetalle.PENDIENTE;

        PedidoDetalleEntity nuevoDetalle = new PedidoDetalleEntity();
        nuevoDetalle.setPedido(pedido);
        nuevoDetalle.setProducto(producto);
        nuevoDetalle.setPlato(null);
        nuevoDetalle.setMenu(null);
        nuevoDetalle.setCantidad(detalleDto.getCantidad());
        nuevoDetalle.setPrecioUnitario(producto.getPrecio());
        nuevoDetalle.setEstado(estadoInicial);
        pedidoDetalleRepository.save(nuevoDetalle);

        return modelMapper.map(nuevoDetalle, GetPedidoDetalleDTO.class);
    }

    /**
     * Procesa un detalle de tipo plato en un pedido.
     * Reduce el stock de todos los ingredientes del plato y crea el detalle.
     *
     * @param platoDetalleDto Objeto DTO con los datos del detalle de plato.
     * @param pedido Entidad del pedido al que se agregará el detalle.
     * @return List<GetPedidoDetalleDTO> con los datos del detalle creado (siempre un solo elemento).
     *
     * @note Método privado utilizado internamente para manejar detalles de platos.
     * @note Reduce automáticamente el stock de todos los ingredientes del plato.
     * @note Calcula la cantidad necesaria multiplicando cantidad del ingrediente por cantidad del plato.
     */
    private List<GetPedidoDetalleDTO> handlePlatoDetalle(PostPedidoDetalleDTO platoDetalleDto, PedidoEntity pedido) {
        PlatoEntity plato = platoService.obtenerPlatoConIngredientes(platoDetalleDto.getIdPlato());

        PedidoDetalleEntity detallePlato = new PedidoDetalleEntity();
        detallePlato.setPedido(pedido);
        detallePlato.setPlato(plato);
        detallePlato.setProducto(null);
        detallePlato.setMenu(null);
        detallePlato.setCantidad(platoDetalleDto.getCantidad());
        detallePlato.setPrecioUnitario(plato.getPrecio());
        detallePlato.setEstado(EstadoPedidoDetalle.PENDIENTE);
        pedidoDetalleRepository.save(detallePlato);

        for (PlatoDetalleEntity ingrediente : plato.getIngredientes()) {
            double cantidadNecesaria = ingrediente.getCantidad() * platoDetalleDto.getCantidad();
            productoService.reducirStock(ingrediente.getProducto().getId(), cantidadNecesaria);
        }

        return List.of(modelMapper.map(detallePlato, GetPedidoDetalleDTO.class));
    }

    /**
     * Procesa un detalle de tipo menú en un pedido.
     * Reduce el stock de todos los items (productos y platos) del menú.
     *
     * @param detalleDto Objeto DTO con los datos del detalle de menú.
     * @param pedido Entidad del pedido al que se agregará el detalle.
     * @return List<GetPedidoDetalleDTO> con los datos del detalle creado (siempre un solo elemento).
     * @throws RuntimeException si el menú no está activo o sus items no están disponibles.
     *
     * @note Método privado utilizado internamente para manejar detalles de menús.
     * @note Reduce automáticamente el stock de todos los items del menú.
     * @note Maneja tanto productos directos como platos con sus ingredientes.
     * @note Valida que el menú esté activo y todos sus items estén disponibles.
     */
    private List<GetPedidoDetalleDTO> handleMenuDetalle(PostPedidoDetalleDTO detalleDto, PedidoEntity pedido) {
        GetMenuDTO menu = menuService.obtenerMenuPorId(detalleDto.getIdMenu());
        
        // ✅ VALIDACIÓN: Verificar que el menú esté activo
        if (!menu.isActivo()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El menú '" + menu.getNombre() + "' no está disponible actualmente");
        }
        
        List<MenuDetalleEntity> itemsDelMenu = menuService.obtenerDetallesMenu(detalleDto.getIdMenu());
        
        // ✅ VALIDACIÓN: Verificar disponibilidad de todos los items del menú
        for (MenuDetalleEntity item : itemsDelMenu) {
            if (item.getProducto() != null) {
                ProductoEntity producto = item.getProducto();
                if (!producto.getActivo()) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El menú no está disponible: el producto '" + 
                        producto.getNombre() + "' está inactivo");
                }
                if (producto.getStockActual() <= 0) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El menú no está disponible: el producto '" + 
                        producto.getNombre() + "' no tiene stock");
                }
            }
            if (item.getPlato() != null) {
                PlatoEntity plato = item.getPlato();
                if (!plato.getDisponible()) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El menú no está disponible: el plato '" + 
                        plato.getNombre() + "' no está disponible");
                }
            }
        }

        PedidoDetalleEntity detalleMenu = new PedidoDetalleEntity();
        detalleMenu.setPedido(pedido);
        detalleMenu.setMenu(modelMapper.map(menu, MenuEntity.class));
        detalleMenu.setProducto(null);
        detalleMenu.setPlato(null);
        detalleMenu.setCantidad(detalleDto.getCantidad());
        detalleMenu.setPrecioUnitario(menu.getPrecio());
        detalleMenu.setEstado(EstadoPedidoDetalle.PENDIENTE);
        pedidoDetalleRepository.save(detalleMenu);

        for (MenuDetalleEntity item : itemsDelMenu) {
            if (item.getProducto() != null) {
                productoService.reducirStock(
                        item.getProducto().getId(),
                        detalleDto.getCantidad()
                );
            } else if (item.getPlato() != null) {
                PlatoEntity plato = platoService.obtenerPlatoConIngredientes(item.getPlato().getIdPlato());
                for (PlatoDetalleEntity ingrediente : plato.getIngredientes()) {
                    double cantidadNecesaria = ingrediente.getCantidad() * detalleDto.getCantidad();
                    productoService.reducirStock(ingrediente.getProducto().getId(), cantidadNecesaria);
                }
            }
        }

        return List.of(modelMapper.map(detalleMenu, GetPedidoDetalleDTO.class));
    }


    /**
     * Devuelve el stock de productos/ingredientes asociados a un detalle de pedido.
     * Utilizado cuando se cancela un detalle o pedido completo.
     *
     * @param detalle Entidad del detalle de pedido cuyo stock se devolverá.
     *
     * @note Método privado utilizado internamente para reversar operaciones de stock.
     * @note Maneja tres tipos de detalles: productos, platos y menús.
     * @note Para platos y menús, devuelve el stock de todos los ingredientes recursivamente.
     */
    private void devolverStockPorDetalle(PedidoDetalleEntity detalle) {
        if (detalle.getProducto() != null) {
            productoService.aumentarStock(detalle.getProducto().getId(), detalle.getCantidad());
        } else if (detalle.getPlato() != null) {
            PlatoEntity plato = platoService.obtenerPlatoConIngredientes(detalle.getPlato().getIdPlato());
            for (PlatoDetalleEntity ingrediente : plato.getIngredientes()) {
                int qtyToReturn = (int) Math.ceil(ingrediente.getCantidad() * detalle.getCantidad());
                productoService.aumentarStock(ingrediente.getProducto().getId(), qtyToReturn);
            }
        } else if (detalle.getMenu() != null) {
            List<MenuDetalleEntity> itemsDelMenu = menuService.obtenerDetallesMenu(detalle.getMenu().getId());
            for (MenuDetalleEntity item : itemsDelMenu) {
                if (item.getProducto() != null) {
                    productoService.aumentarStock(item.getProducto().getId(), detalle.getCantidad());
                } else if (item.getPlato() != null) {
                    PlatoEntity plato = platoService.obtenerPlatoConIngredientes(item.getPlato().getIdPlato());
                    for (PlatoDetalleEntity ingrediente : plato.getIngredientes()) {
                        int qtyToReturn = (int) Math.ceil(ingrediente.getCantidad() * detalle.getCantidad());
                        productoService.aumentarStock(ingrediente.getProducto().getId(), qtyToReturn);
                    }
                }
            }
        }
    }

    /**
     * Configuración personalizada del ModelMapper para conversiones específicas.
     * Se ejecuta automáticamente después de la construcción del bean.
     *
     * @note @PostConstruct Este método se ejecuta una vez después de la inyección de dependencias.
     * @note Configura mapeos personalizados para PedidoEntity → PedidoDTO.
     * @note Configura mapeos personalizados para PedidoDetalleEntity → GetPedidoDetalleDTO.
     * @note Calcula automáticamente el nombre completo del mozo y el total del pedido.
     * @note Determina el tipo de item (PRODUCTO, PLATO, MENU) en los detalles.
     */
    @PostConstruct
    private void configureModelMapper() {
        modelMapper.createTypeMap(PedidoEntity.class, PedidoDTO.class)
                .setPostConverter(ctx -> {
                    PedidoEntity src = ctx.getSource();
                    PedidoDTO dst = ctx.getDestination();

                    if (src.getMozo() != null && src.getMozo().getPersona() != null) {
                        String nombre = src.getMozo().getPersona().getNombre();
                        String apellido = src.getMozo().getPersona().getApellido();
                        dst.setNombreUsuario((nombre != null ? nombre : "") + (apellido != null && !apellido.isBlank() ? " " + apellido : ""));
                    }

                    if (src.getMesa() != null) {
                        dst.setNumeroMesa(src.getMesa().getNumeroMesa());
                    }

                    if (src.getFechaPedido() != null) {
                        dst.setFechaHora(src.getFechaPedido());
                    }

                    // ✅ compute total if DTO doesn't get it automatically (excluir items CANCELADOS)
                    double total = src.getDetalles() == null ? 0.0 :
                            src.getDetalles().stream()
                                    .filter(d -> d.getEstado() != EstadoPedidoDetalle.CANCELADO) // Excluir cancelados
                                    .mapToDouble(d -> (d.getPrecioUnitario() == null ? 0.0 : d.getPrecioUnitario()) * (d.getCantidad() == null ? 0 : d.getCantidad()))
                                    .sum();
                    dst.setTotal(total);

                    return dst;
                });

        // map detalle item identity and type
        modelMapper.createTypeMap(PedidoDetalleEntity.class, GetPedidoDetalleDTO.class)
                .setPostConverter(ctx -> {
                    PedidoDetalleEntity s = ctx.getSource();
                    GetPedidoDetalleDTO d = ctx.getDestination();

                    if (s.getProducto() != null) {
                        d.setIdItem(s.getProducto().getId());
                        d.setNombreItem(s.getProducto().getNombre());
                        d.setTipo("PRODUCTO");
                    } else if (s.getPlato() != null) {
                        d.setIdItem(s.getPlato().getIdPlato());
                        d.setNombreItem(s.getPlato().getNombre());
                        d.setTipo("PLATO");
                    } else if (s.getMenu() != null) {
                        d.setIdItem(s.getMenu().getId());
                        d.setNombreItem(s.getMenu().getNombre());
                        d.setTipo("MENU");
                    }

                    d.setCantidad(s.getCantidad());
                    d.setPrecioUnitario(s.getPrecioUnitario());
                    d.setEstado(s.getEstado());

                    return d;
                });
    }
}
