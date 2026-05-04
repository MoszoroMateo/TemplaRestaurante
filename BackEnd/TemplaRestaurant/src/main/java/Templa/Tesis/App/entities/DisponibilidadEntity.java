package Templa.Tesis.App.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "disponibilidades")
public class DisponibilidadEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private LocalDate fecha;

    @Column(name = "cupos_ocupados")
    private int cuposOcupados;
    @Column(name = "cupos_maximos")
    private int cuposMaximos;

    private boolean activo;

    @OneToMany(mappedBy = "disponibilidad", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private List<ReservaEntity> reservas;

}
