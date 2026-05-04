package Templa.Tesis.App.entities;

import Templa.Tesis.App.Enums.TipoProducto;
import Templa.Tesis.App.Enums.UnidadMedida;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "productos")
@Builder
public class ProductoEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id",nullable = false)
    private Integer id;

    @Column(name = "nombre")
    private String nombre;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoProducto tipo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UnidadMedida unidadMedida;

    @Column(nullable = false)
    private Double stockActual;
    @Column(nullable = false)
    private Double stockMinimo;
    @Column(nullable = false)
    private Double stockMaximo;
    @Column
    private Boolean activo;
    @Column
    private Double precio;


}
