package Templa.Tesis.App.entities;

import Templa.Tesis.App.Enums.EstadoPedido;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "pedidos")
public class PedidoEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @Column
    private LocalDateTime fechaPedido;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_mesa",nullable = false)
    private MesaEntity mesa;

    @ManyToOne
    @JoinColumn(name = "id_usuario",nullable = false)
    private UsuarioEntity mozo;

    @Enumerated(EnumType.STRING)
    private EstadoPedido estado;

    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PedidoDetalleEntity> detalles = new ArrayList<>();
}
