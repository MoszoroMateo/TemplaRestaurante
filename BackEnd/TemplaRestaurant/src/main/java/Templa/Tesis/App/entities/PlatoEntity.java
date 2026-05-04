package Templa.Tesis.App.entities;

import Templa.Tesis.App.Enums.TipoPlato;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "platos")
public class PlatoEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Integer idPlato;
    @Column
    private String nombre;
    @Column
    private String descripcion;
    @Column
    private Double precio; //Precio final Sin descuento Ejemplo = $10000
    @Column
    private Double descuento; //Precio final Con descuento Ejemplo = $7500
    @Column
    private Boolean disponible;
    @Enumerated(EnumType.STRING)
    @Column
    private TipoPlato tipoPlato;
    @Column
    private String foto;
    @Column
    private LocalDateTime fechaAlta;
    @Column
    private Integer userAlta;
    @Column
    private LocalDateTime fechaBaja;
    @Column
    private Integer userBaja;
    @OneToMany(mappedBy = "plato", fetch = FetchType.LAZY)
    private List<PlatoDetalleEntity> ingredientes = new ArrayList<>();
}
