package Templa.Tesis.App.controllers;

import Templa.Tesis.App.servicies.IMercadoPagoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.Map;

@RestController
@RequestMapping("/api/mercadopago")
@RequiredArgsConstructor
@Slf4j
public class MercadoPagoController {
    private final IMercadoPagoService mercadoPagoService;

    @PostMapping("/webhook")
    public ResponseEntity<Void> webhookReserva(@RequestBody Map<String, Object> payload) {
        try {
            log.info("Webhook recibido: {}", payload);

            String type = (String) payload.get("type");

            if ("payment".equals(type)) {
                Map<String, Object> data = (Map<String, Object>) payload.get("data");
                String paymentId = data.get("id").toString();

                mercadoPagoService.procesarPagoReserva(paymentId);
            }

            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error en webhook: ", e);
            return ResponseEntity.ok().build(); // Siempre 200 OK
        }
    }

    /**
     * Endpoint de callback para redirecciones de Mercado Pago
     * MP redirige aquí después del pago, y devolvemos HTML que redirige al frontend
     */
    @GetMapping(value = "/callback", produces = "text/html")
    public String callback(
            @RequestParam String payment,
            @RequestParam Long reservaId) {
        log.info("🔄 Callback de MP - payment: {}, reservaId: {}", payment, reservaId);
        
        // Devolver HTML que redirige al frontend con JavaScript
        String frontendUrl = "http://localhost:4200/mp-resultado?payment=" + payment + "&reservaId=" + reservaId;
        
        return "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "  <meta charset='UTF-8'>" +
                "  <title>Redirigiendo...</title>" +
                "  <style>" +
                "    body { font-family: Arial; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }" +
                "    .container { text-align: center; background: white; padding: 3rem; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }" +
                "    .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #667eea; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 0 auto 1rem; }" +
                "    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }" +
                "  </style>" +
                "</head>" +
                "<body>" +
                "  <div class='container'>" +
                "    <div class='spinner'></div>" +
                "    <h2>Procesando tu pago...</h2>" +
                "    <p>Serás redirigido en un momento</p>" +
                "  </div>" +
                "  <script>" +
                "    setTimeout(function() { window.location.href = '" + frontendUrl + "'; }, 1000);" +
                "  </script>" +
                "</body>" +
                "</html>";
    }

    @GetMapping("/estado-pago/{paymentId}")
    public ResponseEntity<Map<String, String>> obtenerEstadoPago(
            @PathVariable String paymentId) {
        String estado = mercadoPagoService.obtenerEstadoPago(paymentId);
        return ResponseEntity.ok(Map.of("estado", estado));
    }
}
