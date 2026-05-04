package Templa.Tesis.App.entities;

import jakarta.persistence.*;
import lombok.*;
import software.amazon.awssdk.services.s3.endpoints.internal.Value;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "menus")
public class MenuEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id",nullable = false)
    private Integer id;
    @Column(name = "nombre")
    private String nombre;
    @Column(name = "descripcion")
    private String descripcion;
    @Column(name = "precio")
    private Double precio;
    @Column(name = "disponible_desde")
    private LocalDate disponibleDesde;
    @Column(name = "disponible_hasta")
    private LocalDate disponibleHasta;
    @Column
    private Boolean activo;
}
