package Templa.Tesis.App.dtos;

import Templa.Tesis.App.Enums.TipoPersona;
import jakarta.annotation.Nullable;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class GetPersonasFiltroDto {
    @Nullable
    private String buscarFiltro; // Término de búsqueda general (input único del frontend)

    @Nullable
    @Pattern(regexp = "^(PERSONAL|CLIENTES)?$", message = "tipoPersona debe ser PERSONAL, CLIENTES o vacío")
    private String tipoPersona; // PERSONAL, CLIENTES, o null para Todos

    @Nullable
    @Pattern(regexp = "^(ACTIVOS|BAJA|TODOS)?$", message = "estado debe ser ACTIVOS, BAJA o TODOS")
    private String estado; // ACTIVOS, BAJA, o TODOS
}

