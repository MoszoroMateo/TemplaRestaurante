package Templa.Tesis.App.dtos;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GetMenuDTO {
    private Integer id;
    private String nombre;
    private String descripcion;
    private Double precio;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate disponibleDesde;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate disponibleHasta;
    private boolean activo;
    private List<GetProductosMenuDto> productos;
}
