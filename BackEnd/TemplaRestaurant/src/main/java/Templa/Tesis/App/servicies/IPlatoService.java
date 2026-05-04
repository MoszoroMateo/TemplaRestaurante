package Templa.Tesis.App.servicies;

import Templa.Tesis.App.dtos.GetPlatoDto;
import Templa.Tesis.App.dtos.PostPlatoDto;
import Templa.Tesis.App.dtos.ReportePlatoProductosDTO;
import Templa.Tesis.App.entities.PlatoEntity;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface IPlatoService {
    Page<GetPlatoDto> getPlatos(int page, int size);
    Page<GetPlatoDto> getPlatos(String buscarFiltro,String tipoPlato ,String estado ,int page, int size);
    GetPlatoDto createPlato(PostPlatoDto platoNuevo, MultipartFile imagen);
    GetPlatoDto updatePlato(GetPlatoDto platoActualizar, MultipartFile imagen);
    String activarDesactivarPlato(Integer id);
    void bajaPlato(Integer id);
    PlatoEntity obtenerPlatoConIngredientes(Integer idPlato);

    void desactivarPlatosQueUsan(Integer idProducto);

    void reactivarPlatosQueUsan(Integer idProducto);

    List<ReportePlatoProductosDTO> obtenerReportePlatosPorProductos();
}
