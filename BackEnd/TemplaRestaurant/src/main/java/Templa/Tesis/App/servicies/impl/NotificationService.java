package Templa.Tesis.App.servicies.impl;

import Templa.Tesis.App.controllers.SseController;
import Templa.Tesis.App.dtos.NotificacionDTO;
import Templa.Tesis.App.dtos.ProductoDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final SseController sseController;


    public void enviarAlertaStockBajo(ProductoDTO productoDTO) {
        try {
            NotificacionDTO notificacion = NotificacionDTO.builder()
                    .tipo("STOCK_BAJO")
                    .mensaje(String.format("ALERTA: Stock bajo para el producto '%s'. Stock actual: %.0f, Stock mínimo: %.0f",
                            productoDTO.getNombre(),
                            productoDTO.getStockActual(),
                            productoDTO.getStockMinimo()))
                    .datos(productoDTO)
                    .timestamp(LocalDateTime.now())
                    .build();

            sseController.sendNotification("alertas-stock", "stock-bajo", notificacion);

            log.warn("Alerta de stock bajo enviada para producto: {}", productoDTO.getNombre());
        } catch (Exception e) {
            log.error("Error al enviar alerta de stock bajo para producto: {} - Detalles: {}", productoDTO.getNombre(), e.getMessage(), e);
        }
    }

    /**
     * Envía notificación al mozo específico cuando su pedido está listo para entregar
     * @param idMozo ID del mozo que realizó el pedido
     * @param idPedido ID del pedido listo
     * @param numeroMesa Número de la mesa
     */
    public void enviarNotificacionPedidoListo(Integer idMozo, Integer idPedido, String numeroMesa) {
        try {
            NotificacionDTO notificacion = NotificacionDTO.builder()
                    .tipo("PEDIDO_LISTO")
                    .mensaje(String.format("¡Pedido listo! Mesa %d - Pedido #%d está listo para entregar",
                            numeroMesa,
                            idPedido))
                    .datos(new DatosPedidoListo(idPedido, numeroMesa, idMozo))
                    .timestamp(LocalDateTime.now())
                    .build();

            // Enviar notificación solo al mozo específico usando SSE
            sseController.sendNotification("pedidos-listos-" + idMozo, "pedido-listo", notificacion);

            log.info("✅ Notificación de pedido listo enviada al mozo {} para mesa {} (pedido #{})", 
                    idMozo, numeroMesa, idPedido);
        } catch (Exception e) {
            log.error("❌ Error al enviar notificación de pedido listo al mozo {}: {}", idMozo, e.getMessage(), e);
        }
    }

    // Clase interna para los datos del pedido listo
    public static class DatosPedidoListo {
        public Integer idPedido;
        public String numeroMesa;
        public Integer idMozo;

        public DatosPedidoListo(Integer idPedido, String numeroMesa, Integer idMozo) {
            this.idPedido = idPedido;
            this.numeroMesa = numeroMesa;
            this.idMozo = idMozo;
        }
    }

}
