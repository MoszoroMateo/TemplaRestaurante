package Templa.Tesis.App.entities;

import Templa.Tesis.App.Enums.TipoPersona;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Date;

@Entity
@Table(name = "personas")
@NoArgsConstructor
@AllArgsConstructor
@Data
@Builder
public class PersonaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Integer id;
    @Column
    private String nombre;
    @Column
    private String apellido;
    @Column
    private String email;
    @Column
    private String telefono;
    @Column
    private int dni;
    @Column
    @Enumerated(EnumType.STRING)
    private TipoPersona tipoPersona;
    @Column
    private LocalDateTime fechaAlta;
    @Column
    private Integer userAlta;
    @Column
    private LocalDateTime fechaBaja;
    @Column
    private Integer userBajaId;

}
