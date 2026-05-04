package Templa.Tesis.App.dtos;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UpdateMesaPosicionDto {
    @NotNull(message = "El ID de la mesa es obligatorio")
    private Integer idMesa;

    @NotNull(message = "La posición X es obligatoria")
    private Double posX;

    @NotNull(message = "La posición Y es obligatoria")
    private Double posY;

    @NotNull(message = "El piso es obligatorio")
    private Integer piso;
}
