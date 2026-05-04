package Templa.Tesis.App.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ReservaVipRequestDto {
    private PostReservaDTO reservaData;
    private String emailCliente;
    private String nombreCliente;
}
