package Templa.Tesis.App.servicies.impl;

import Templa.Tesis.App.Enums.EstadoReserva;
import Templa.Tesis.App.Enums.EventoReserva;
import Templa.Tesis.App.dtos.*;
import Templa.Tesis.App.entities.DisponibilidadEntity;
import Templa.Tesis.App.entities.MesaEntity;
import Templa.Tesis.App.entities.PersonaEntity;
import Templa.Tesis.App.entities.ReservaEntity;
import Templa.Tesis.App.repositories.DisponibilidadRepository;
import Templa.Tesis.App.repositories.MesaRepository;
import Templa.Tesis.App.repositories.PersonaRepository;
import Templa.Tesis.App.repositories.ReservaRepository;
import Templa.Tesis.App.servicies.IReservaService;
import com.mercadopago.MercadoPagoConfig;
import com.mercadopago.client.payment.PaymentClient;
import com.mercadopago.client.preference.*;
import com.mercadopago.exceptions.MPApiException;
import com.mercadopago.exceptions.MPException;
import com.mercadopago.resources.payment.Payment;
import com.mercadopago.resources.preference.Preference;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReservaServiceImpl implements IReservaService {

    private final ReservaRepository reservaRepository;
    private final ModelMapper modelMapper;
    private final MesaRepository mesaRepository;
    private final PersonaRepository personaRepository;
    private final DisponibilidadRepository disponibilidadRepository;
    private final MercadoPagoServiceImpl mercadoPagoService;
    private final EmailService emailService;

    /**
     * Crea una nueva reserva en el sistema con validación completa de datos.
     * Realiza validaciones de campos obligatorios, verifica existencia de entidades relacionadas,
     * controla la disponibilidad de cupos y actualiza los cupos ocupados automáticamente.
     *
     * @param postReservaDTO Objeto DTO con los datos necesarios para crear la reserva.
     *                      Debe incluir: nroReserva, cantidadComensales, fechaReserva,
     *                      evento, horario, idPersona e idDisponibilidad.
     * @return ReservaDTO con los datos completos de la reserva creada, incluyendo
     *         información de la persona asociada y disponibilidad.
     * @throws ResponseStatusException con código 400 si:
     *         - Datos obligatorios no son proporcionados (nroReserva, cantidadComensales, etc.)
     *         - No hay cupos disponibles para la cantidad de comensales solicitada
     * @throws ResponseStatusException con código 404 si no se encuentra la persona o disponibilidad.
     * @throws ResponseStatusException con código 409 si ya existe una reserva con el mismo número.
     * @throws ResponseStatusException con código 500 si ocurre un error al guardar la reserva.
     *
     * @note Actualiza automáticamente los cupos ocupados en la disponibilidad asociada.
     * @note Envía un email de confirmación al cliente después de crear la reserva.
     *       Los errores en el envío de email se registran en logs sin interrumpir el proceso.
     */
    @Override
    public ReservaDTO createReserva(PostReservaDTO postReservaDTO) {
        if (postReservaDTO.getNroReserva() == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe ingresar el numero de reserva");
        }
        if (postReservaDTO.getCantidadComensales() == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe ingresar la cantidad de comensales");
        }
        if (postReservaDTO.getFechaReserva() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe ingresar la fecha de reserva");
        }
        if (postReservaDTO.getEvento() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe ingresar el tipo de evento");
        }
        if (postReservaDTO.getHorario() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe ingresar el horario de la reserva");
        }

        ReservaEntity reservaExiste = reservaRepository.findByNroReserva(postReservaDTO.getNroReserva());

        if (reservaExiste != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La Reserva ya existe");
        }

        // BUSCAR LAS ENTIDADES RELACIONADAS
        PersonaEntity persona = personaRepository.findById(postReservaDTO.getIdPersona())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Persona no encontrada"));


        // BUSCAR O CREAR DISPONIBILIDAD AUTOMÁTICAMENTE
        DisponibilidadEntity disponibilidad = obtenerOCrearDisponibilidad(postReservaDTO.getFechaReserva());

        // VERIFICAR CUPOS DISPONIBLES
        int cuposOcupados = disponibilidad.getCuposOcupados();
        int cuposMaximos = disponibilidad.getCuposMaximos();

        if (cuposOcupados + postReservaDTO.getCantidadComensales() > cuposMaximos) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No hay cupos disponibles para esta fecha");
        }

        // ACTUALIZAR CUPOS
        disponibilidad.setCuposOcupados(cuposOcupados + postReservaDTO.getCantidadComensales());
        disponibilidadRepository.save(disponibilidad);

        try {
            // Crear la entidad reserva manualmente
            ReservaEntity reserva = new ReservaEntity();
            reserva.setPersona(persona);  // Asignar entidad
            reserva.setDisponibilidad(disponibilidad); //Asignar entidad
            reserva.setNroReserva(postReservaDTO.getNroReserva());
            reserva.setCantidadComensales(postReservaDTO.getCantidadComensales());
            reserva.setFechaReserva(postReservaDTO.getFechaReserva());
            reserva.setEvento(postReservaDTO.getEvento());
            reserva.setHorario(postReservaDTO.getHorario());

            ReservaEntity reservaGuardada = reservaRepository.save(reserva);

            // ✅ ENVIAR EMAIL DE CONFIRMACIÓN
            enviarEmailConfirmacion(reservaGuardada, persona);

            return ReservaDTO.builder()
                    .id(reservaGuardada.getId())
                    .idPersona(reservaGuardada.getPersona().getId())
                    .nombrePersona(reservaGuardada.getPersona().getNombre() + " " + reservaGuardada.getPersona().getApellido())
                    .idDisponibilidad(reservaGuardada.getDisponibilidad().getId())
                    .nroReserva(reservaGuardada.getNroReserva())
                    .cantidadComensales(reservaGuardada.getCantidadComensales())
                    .fechaReserva(reservaGuardada.getFechaReserva())
                    .evento(reservaGuardada.getEvento())
                    .horario(reservaGuardada.getHorario())
                    .build();

        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error al guardar la reserva");
        }

    }

    /**
     * Actualiza los datos de una reserva existente.
     * Modifica todos los campos editables de la reserva.
     *
     * @param id Identificador único de la reserva a actualizar.
     * @param postReservaDTO Objeto DTO con los datos actualizados de la reserva.
     * @return ReservaDTO que representa la reserva actualizada.
     * @throws EntityNotFoundException si no existe una reserva con el ID proporcionado.
     * @throws Exception si ocurre un error durante la actualización.
     *
     * @note No actualiza cupos de disponibilidad al modificar la reserva.
     */
    @Override
    public ReservaDTO actualizarReserva(Integer id, PostReservaDTO postReservaDTO) {
        ReservaEntity reserva = reservaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Reserva no encontada con el ID: " + id));

        reserva.setNroReserva(postReservaDTO.getNroReserva());
        reserva.setCantidadComensales(postReservaDTO.getCantidadComensales());
        reserva.setHorario(postReservaDTO.getHorario());
        reserva.setEvento(postReservaDTO.getEvento());
        reserva.setFechaReserva(postReservaDTO.getFechaReserva());

        ReservaEntity reservaActualizada = reservaRepository.save(reserva);
        return modelMapper.map(reservaActualizada, ReservaDTO.class);
    }

    /**
     * Obtiene una lista paginada de todas las reservas del sistema.
     * Las reservas se ordenan por ID ascendente.
     *
     * @param page Número de página a recuperar (comenzando desde 0).
     * @param size Cantidad de elementos por página.
     * @return Page<ReservaDTO> que contiene las reservas de la página solicitada,
     *         con información de paginación incluida.
     * @throws Exception si ocurre un error durante la consulta a la base de datos.
     *
     * @note Incluye nombre completo de la persona asociada en la respuesta.
     */
    @Override
    public Page<ReservaDTO> traerReservas(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id"));
        Page<ReservaEntity> reservas = reservaRepository.findAll(pageable);
        return reservas.map(reserva -> ReservaDTO.builder()
                .id(reserva.getId())
                .idPersona(reserva.getPersona().getId())
                .nombrePersona(reserva.getPersona().getNombre() + " " + reserva.getPersona().getApellido())
                .idDisponibilidad(reserva.getDisponibilidad().getId())
                .nroReserva(reserva.getNroReserva())
                .cantidadComensales(reserva.getCantidadComensales())
                .fechaReserva(reserva.getFechaReserva())
                .evento(reserva.getEvento())
                .horario(reserva.getHorario())
                .build());

    }

    /**
     * Obtiene una lista paginada de reservas aplicando filtros de búsqueda.
     * Permite filtrar por tipo de evento y rango de fechas.
     * Los resultados se ordenan por fecha de reserva descendente.
     *
     * @param page Número de página a recuperar (comenzando desde 0).
     * @param size Cantidad de elementos por página.
     * @param evento Tipo de evento a filtrar (ej: "CENA", "ALMUERZO", "VIP").
     *               Si es null o vacío, no se aplica filtro por evento.
     * @param fechaDesde Fecha inicial del rango para filtrar reservas.
     *                   Si es null, se usa el primer día del mes actual.
     * @param fechaHasta Fecha final del rango para filtrar reservas.
     *                   Si es null, se usa la fecha actual.
     * @return Page<ReservaDTO> con las reservas filtradas, paginadas y ordenadas.
     * @throws Exception si ocurre un error durante la consulta a la base de datos.
     */
    @Override
    public Page<ReservaDTO> traerReservas(int page, int size, String evento, LocalDate fechaDesde, LocalDate fechaHasta) {
        // Establecer valores por defecto si no se proporcionan fechas
        if (fechaDesde == null) {
            fechaDesde = LocalDate.now().withDayOfMonth(1);
        }
        if (fechaHasta == null) {
            fechaHasta = LocalDate.now();
        }

        // Variables finales para usar en la lambda
        final LocalDate fechaDesdeFinal = fechaDesde;
        final LocalDate fechaHastaFinal = fechaHasta;

        Pageable pageable = PageRequest.of(page, size, Sort.by("fechaReserva").descending());

        Specification<ReservaEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Filtrar por evento si se proporciona
            if (evento != null && !evento.trim().isEmpty()) {
                try {
                    EventoReserva eventoEnum = EventoReserva.valueOf(evento.toUpperCase());
                    predicates.add(cb.equal(root.get("evento"), eventoEnum));
                } catch (IllegalArgumentException e) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Evento de reserva inválido: " + evento);
                }
            }

            // Filtrar por rango de fechas
            predicates.add(cb.between(root.get("fechaReserva"), fechaDesdeFinal, fechaHastaFinal));

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<ReservaEntity> reservas = reservaRepository.findAll(spec, pageable);
        return reservas.map(entity -> modelMapper.map(entity, ReservaDTO.class));
    }


    /**
     * Elimina una reserva del sistema y actualiza los cupos de disponibilidad.
     * Libera los cupos ocupados por la reserva al eliminarla.
     *
     * @param id Identificador único de la reserva a eliminar.
     * @throws EntityNotFoundException si no existe una reserva con el ID proporcionado.
     * @throws Exception si ocurre un error durante la eliminación.
     *
     * @Transactional La operación se ejecuta dentro de una transacción.
     * @note Actualiza automáticamente los cupos ocupados en la disponibilidad asociada.
     */
    @Override
    @Transactional
    public void eliminarReserva(Integer id) {
        // Buscar la reserva
        ReservaEntity reserva = reservaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Reserva no encontrada"));

        // Obtener la disponibilidad asociada
        DisponibilidadEntity disponibilidad = reserva.getDisponibilidad();

        // Restar los cupos ocupados por esa reserva
        int nuevosCuposOcupados = disponibilidad.getCuposOcupados() - reserva.getCantidadComensales();

        // Evitar que queden valores negativos
        disponibilidad.setCuposOcupados(Math.max(nuevosCuposOcupados, 0));

        // Guardar la disponibilidad actualizada
        disponibilidadRepository.save(disponibilidad);

        // Eliminar la reserva
        reservaRepository.delete(reserva);
    }

    /**
     * Genera un reporte de las fechas más concurridas dentro de un rango de fechas.
     * Proporciona información agregada de reservas por fecha.
     *
     * @param fechaInicio Fecha de inicio del período a analizar.
     *                   Si es null, se usa un mes atrás desde hoy.
     * @param fechaFin Fecha de fin del período a analizar.
     *                 Si es null, se usa la fecha actual.
     * @return List<ReporteReservasDTO> con estadísticas de reservas por fecha.
     * @throws Exception si ocurre un error durante la consulta.
     *
     * @note Valores por defecto: fechaInicio = hoy - 1 mes, fechaFin = hoy.
     */
    @Override
    public List<ReporteReservasDTO> getReporteFechasConcurridas(LocalDate fechaInicio, LocalDate fechaFin) {
        if (fechaInicio == null) fechaInicio = LocalDate.now().minusMonths(1);
        if (fechaFin == null) fechaFin = LocalDate.now();

        return reservaRepository.findReservasPorFecha(fechaInicio, fechaFin);
    }

    /**
     * Genera un reporte de los horarios más concurridos dentro de un rango de fechas.
     * Proporciona información agregada de reservas por horario.
     *
     * @param fechaInicio Fecha de inicio del período a analizar.
     *                   Si es null, se usa un mes atrás desde hoy.
     * @param fechaFin Fecha de fin del período a analizar.
     *                 Si es null, se usa la fecha actual.
     * @return List<ReporteReservasDTO> con estadísticas de reservas por horario.
     * @throws Exception si ocurre un error durante la consulta.
     *
     * @note Valores por defecto: fechaInicio = hoy - 1 mes, fechaFin = hoy.
     */
    @Override
    public List<ReporteReservasDTO> getReporteHorariosConcurridos(LocalDate fechaInicio, LocalDate fechaFin) {
        if (fechaInicio == null) fechaInicio = LocalDate.now().minusMonths(1);
        if (fechaFin == null) fechaFin = LocalDate.now();

        return reservaRepository.findReservasPorHorario(fechaInicio, fechaFin);
    }

    /**
     * Crea una reserva con soporte para pagos, especialmente diseñado para reservas VIP.
     * Maneja dos flujos: reservas normales (sin pago) y reservas VIP (con pago requerido).
     *
     * @param request Objeto DTO con datos de la reserva y configuración de pago.
     * @return ReservaVipResponseDto con información de la reserva creada y, si es VIP,
     *         datos para procesar el pago (preferenceId, initPoint, publicKey).
     * @throws ResponseStatusException con código 400 si:
     *         - Datos inválidos en la reserva
     *         - No hay cupos disponibles
     * @throws ResponseStatusException con código 404 si no se encuentra persona o disponibilidad.
     * @throws ResponseStatusException con código 409 si ya existe una reserva con el mismo número.
     * @throws ResponseStatusException con código 500 si ocurre un error interno.
     *
     * @Transactional La operación se ejecuta dentro de una transacción.
     * @note Para reservas VIP:
     *       1. Crea reserva con estado PENDIENTE_PAGO
     *       2. Genera preferencia de pago en Mercado Pago
     *       3. NO actualiza cupos hasta que el pago sea aprobado
     *       4. Guarda el preferenceId en la reserva para seguimiento
     * @note Para reservas normales:
     *       1. Crea reserva con estado CONFIRMADA
     *       2. Actualiza cupos inmediatamente
     *       3. No genera datos de pago
     */
    @Override
    @Transactional
    public ReservaVipResponseDto crearReservaConPago(ReservaVipRequestDto request) {
        PostReservaDTO reservaData = request.getReservaData();

        // Validaciones básicas
        if (reservaData.getNroReserva() == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe ingresar el numero de reserva");
        }
        if (reservaData.getCantidadComensales() == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe ingresar la cantidad de comensales");
        }

        // Verificar que la reserva no exista
        ReservaEntity reservaExiste = reservaRepository.findByNroReserva(reservaData.getNroReserva());
        if (reservaExiste != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La Reserva ya existe");
        }

        // Buscar entidades relacionadas
        PersonaEntity persona = personaRepository.findById(reservaData.getIdPersona())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Persona no encontrada"));

        // ✅ BUSCAR O CREAR DISPONIBILIDAD AUTOMÁTICAMENTE
        DisponibilidadEntity disponibilidad = obtenerOCrearDisponibilidad(reservaData.getFechaReserva());

        // ✅ VALIDAR SI LA FECHA ESTÁ ACTIVA
        if (!disponibilidad.isActivo()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "No se aceptan reservas para esta fecha");
        }

        // Verificar cupos disponibles
        int cuposOcupados = disponibilidad.getCuposOcupados();
        int cuposMaximos = disponibilidad.getCuposMaximos();

        if (cuposOcupados + reservaData.getCantidadComensales() > cuposMaximos) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No hay cupos disponibles para esta fecha");
        }

        // Verificar si es reserva VIP
        if (reservaData.getEvento() == EventoReserva.VIP) {
            // Crear reserva en estado PENDIENTE_PAGO
            ReservaEntity reserva = new ReservaEntity();
            reserva.setPersona(persona);
            reserva.setDisponibilidad(disponibilidad);
            reserva.setNroReserva(reservaData.getNroReserva());
            reserva.setCantidadComensales(reservaData.getCantidadComensales());
            reserva.setFechaReserva(reservaData.getFechaReserva());
            reserva.setEvento(reservaData.getEvento());
            reserva.setHorario(reservaData.getHorario());
            reserva.setRequierePago(true);
            reserva.setPagoCompletado(false);
            reserva.setEstadoReserva(EstadoReserva.PENDIENTE_PAGO);

            ReservaEntity savedReserva = reservaRepository.save(reserva);

            // Crear preferencia de Mercado Pago con el ID de la reserva
            ReservaVipResponseDto mpResponse = mercadoPagoService.crearPreferenciaReservaVip(request, savedReserva.getId());

            // Actualizar reserva con preferenceId
            savedReserva.setMercadoPagoPreferenceId(mpResponse.getPreferenceId());
            reservaRepository.save(savedReserva);

            // NO actualizar cupos aquí, se actualizarán cuando el pago sea aprobado

            mpResponse.setReservaId(savedReserva.getId());
            return mpResponse;

        } else {
            // Reserva normal sin pago
            ReservaEntity reserva = new ReservaEntity();
            reserva.setPersona(persona);
            reserva.setDisponibilidad(disponibilidad);
            reserva.setNroReserva(reservaData.getNroReserva());
            reserva.setCantidadComensales(reservaData.getCantidadComensales());
            reserva.setFechaReserva(reservaData.getFechaReserva());
            reserva.setEvento(reservaData.getEvento());
            reserva.setHorario(reservaData.getHorario());
            reserva.setRequierePago(false);
            reserva.setPagoCompletado(true);
            reserva.setEstadoReserva(EstadoReserva.CONFIRMADA);

            ReservaEntity savedReserva = reservaRepository.save(reserva);

            // Actualizar cupos inmediatamente para reservas normales
            disponibilidad.setCuposOcupados(cuposOcupados + reservaData.getCantidadComensales());
            disponibilidadRepository.save(disponibilidad);

            return new ReservaVipResponseDto(
                    savedReserva.getId(),
                    null, 
                    null, 
                    null, 
                    null,  // publicKey no necesario para reservas normales
                    false,
                    0.0
            );
        }
    }

    /**
     * Obtiene una reserva específica por su identificador único.
     *
     * @param id Identificador único de la reserva a buscar.
     * @return ReservaDTO con todos los datos de la reserva encontrada.
     * @throws EntityNotFoundException si no existe una reserva con el ID proporcionado.
     * @throws Exception si ocurre un error durante la consulta.
     */
    @Override
    public ReservaDTO obtenerReserva(Integer id) {
        ReservaEntity reserva = reservaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Reserva no encontrada con el ID: " + id));
        return modelMapper.map(reserva, ReservaDTO.class);
    }

    /**
     * Genera un reporte de clientes ordenados por cantidad de reservas realizadas.
     * Incluye información de contacto y tipo de evento preferido.
     *
     * @return List<ReporteClientesReservasDTO> con estadísticas de clientes y sus reservas.
     * @throws Exception si ocurre un error durante la consulta.
     *
     * @note Ordena los clientes por cantidad total de reservas descendente.
     * @note Incluye el tipo de evento más frecuente para cada cliente.
     */
    @Override
    public List<ReporteClientesReservasDTO> obtenerReporteClientesPorReserva() {
        List<Object[]> resultados = reservaRepository.findClientesPorCantidadReservas();

        return resultados.stream()
                .map(resultado -> new ReporteClientesReservasDTO(
                        (String) resultado[0],           // nombreCompleto
                        (String) resultado[1],           // email
                        (String) resultado[2],           // telefono
                        ((Number) resultado[3]).longValue(), // totalReservas
                        (EventoReserva) resultado[4]     // Cast directo al enum
                ))
                .collect(Collectors.toList());


    }

    /**
     * Envía un email de confirmación al cliente después de crear una reserva.
     * Maneja errores de envío sin interrumpir el flujo principal de la reserva.
     *
     * @param reserva Entidad de la reserva creada.
     * @param persona Entidad de la persona que realizó la reserva.
     *
     * @note Registra en logs el resultado del envío (éxito, advertencia o error).
     * @note No lanza excepciones para evitar interrumpir el proceso de reserva.
     * @note Verifica que la persona tenga email registrado antes de enviar.
     */
    private void enviarEmailConfirmacion(ReservaEntity reserva, PersonaEntity persona) {
        try {
            // Verificar que la persona tenga email
            if (persona.getEmail() != null && !persona.getEmail().trim().isEmpty()) {
                String nombreCompleto = persona.getNombre() + " " + persona.getApellido();
                String fechaFormateada = reserva.getFechaReserva().toString(); // O formatear como prefieras

                emailService.enviarMailConfirmacionReserva(
                        persona.getEmail(),
                        nombreCompleto,
                        reserva.getNroReserva(),
                        fechaFormateada,
                        reserva.getHorario().toString(),
                        reserva.getEvento().name(),
                        reserva.getCantidadComensales()
                );

                log.info("✅ Email de confirmación enviado a: {} para la reserva #{}",
                        persona.getEmail(), reserva.getNroReserva());
            } else {
                log.warn("⚠️ No se pudo enviar email de confirmación: el cliente no tiene email registrado");
            }
        } catch (Exception e) {
            log.error("❌ Error al enviar email de confirmación para la reserva #{}. Error: {}",
                    reserva.getNroReserva(), e.getMessage());
            // No lanzamos excepción para no interrumpir el flujo de la reserva
        }
    }

    // NUEVO MÉTODOO
    private DisponibilidadEntity obtenerOCrearDisponibilidad(LocalDate fecha) {
        DisponibilidadEntity disponibilidad = disponibilidadRepository.findByFecha(fecha);

        if (disponibilidad == null) {
            disponibilidad = new DisponibilidadEntity();
            disponibilidad.setFecha(fecha);
            disponibilidad.setCuposOcupados(0);
            disponibilidad.setCuposMaximos(100);
            disponibilidad.setActivo(true);
            disponibilidad = disponibilidadRepository.save(disponibilidad);

            log.info("✅ Disponibilidad creada automáticamente: {} con {} cupos", fecha, 100);
        }

        return disponibilidad;
    }
}

