package Templa.Tesis.App.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductoStatsDTO {
    private long total;
    private long activos;
    private long inactivos;
    private long insumos;
    private long acompanantes;
    private long bebidas;
    private long stockCritico;     // stockActual <= stockMinimo / 2
    private long stockBajo;        // stockActual <= stockMinimo (incluye crítico)
    private long stockSaludable;   // stockActual > stockMinimo
    private Double valorInventario; // SUM(stockActual * precio)
}
