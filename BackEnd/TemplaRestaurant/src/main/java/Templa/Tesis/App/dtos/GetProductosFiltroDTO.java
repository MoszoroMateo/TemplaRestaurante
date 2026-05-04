package Templa.Tesis.App.dtos;

import jakarta.annotation.Nullable;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GetProductosFiltroDTO {

    @Nullable
    private String buscar; // término de búsqueda general (por nombre, etc.)

    @Nullable
    @Pattern(
            regexp = "^(INSUMO|ACOMPAÑANTE|BEBIDA)?$",
            message = "tipoProducto debe ser INSUMO, ACOMPAÑANTE, BEBIDA o vacío"
    )
    private String tipoProducto; // INSUMO, ACOMPAÑANTE, BEBIDA o null para todos

    @Nullable
    @Pattern(
            regexp = "^(ACTIVOS|INACTIVOS|TODOS)?$",
            message = "activo debe ser ACTIVOS, INACTIVOS o TODOS"
    )
    private String activo; // ACTIVO, INACTIVO, o TODOS
}
