package Templa.Tesis.App.entities;

import Templa.Tesis.App.Enums.EstadoReserva;
import Templa.Tesis.App.Enums.EventoReserva;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "reservas")
public class ReservaEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_persona",nullable = false)
    private PersonaEntity persona;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_disponibilidad", nullable = false)
    private DisponibilidadEntity disponibilidad;
    @Column
    private int nroReserva;
    @Column
    private int cantidadComensales;

    @Column
    private LocalDate fechaReserva;

    @Enumerated(EnumType.STRING)
    private EventoReserva evento;
    @Column
    private LocalTime horario;

    @Column(name = "requiere_pago")
    private Boolean requierePago = false;

    @Column(name = "pago_completado")
    private Boolean pagoCompletado = false;

    @Column(name = "mercadopago_payment_id")
    private String mercadoPagoPaymentId;

    @Column(name = "mercadopago_preference_id")
    private String mercadoPagoPreferenceId;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_reserva")
    private EstadoReserva estadoReserva;
}
