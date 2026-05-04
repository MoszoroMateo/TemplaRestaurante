package Templa.Tesis.App.entities;

import Templa.Tesis.App.Enums.EstadoPedidoDetalle;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "pedidoDetalle")
public class PedidoDetalleEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idPedidoDetalle;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_pedido")
    private PedidoEntity pedido;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_menu")
    private MenuEntity menu;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_plato")
    private PlatoEntity plato;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_producto")
    private ProductoEntity producto;
    @Column
    private Double cantidad;
    @Column
    private Double precioUnitario;
    @Enumerated(EnumType.STRING)
    private EstadoPedidoDetalle estado;

}
