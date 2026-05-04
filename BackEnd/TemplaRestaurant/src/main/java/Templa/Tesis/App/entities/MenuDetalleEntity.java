package Templa.Tesis.App.entities;

import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "menuDetalle")
public class MenuDetalleEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id",nullable = false)
    private Integer idMenuDetalle;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_menu", nullable = false)
    private MenuEntity menu;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_plato",nullable = true)
    private PlatoEntity plato;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_producto",nullable = true)
    private ProductoEntity producto;
}
