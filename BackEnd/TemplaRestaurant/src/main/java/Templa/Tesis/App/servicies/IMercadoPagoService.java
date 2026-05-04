package Templa.Tesis.App.servicies;

import Templa.Tesis.App.dtos.ReservaVipRequestDto;
import Templa.Tesis.App.dtos.ReservaVipResponseDto;

public interface IMercadoPagoService {
    ReservaVipResponseDto crearPreferenciaReservaVip(ReservaVipRequestDto request, Integer reservaId);
    void procesarPagoReserva(String paymentId);
    String obtenerEstadoPago(String paymentId);
    void simularPagoAprobadoPorReserva(Integer reservaId, String fakePaymentId);
}
