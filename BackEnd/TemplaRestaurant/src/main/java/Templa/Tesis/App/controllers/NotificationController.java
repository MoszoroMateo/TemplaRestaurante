package Templa.Tesis.App.controllers;

import Templa.Tesis.App.dtos.NotificacionDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
@Slf4j
public class NotificationController {

    @MessageMapping("/test")
    @SendTo("/topic/productos")
    public NotificacionDTO enviarNotificacionPrueba(String mensaje) {
        log.info("Recibido mensaje de prueba: {}", mensaje);

        return NotificacionDTO.builder()
                .tipo("TEST")
                .mensaje("Mensaje de prueba: " + mensaje)
                .datos(null)
                .timestamp(java.time.LocalDateTime.now())
                .build();
    }
}
