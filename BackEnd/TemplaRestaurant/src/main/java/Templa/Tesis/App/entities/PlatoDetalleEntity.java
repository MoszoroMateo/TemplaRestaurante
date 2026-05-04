package Templa.Tesis.App.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "platosDetalle")
public class PlatoDetalleEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Integer idPlatoDetalle;
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_plato", nullable = false)
    private PlatoEntity plato;
    @ManyToOne
    @JoinColumn(name = "id_producto", nullable = false)
    private ProductoEntity producto;
    @Column(nullable = false)
    private double cantidad;

}
