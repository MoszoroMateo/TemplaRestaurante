package Templa.Tesis.App.servicies;

import Templa.Tesis.App.Enums.EstadoMesa;
import Templa.Tesis.App.dtos.GetMesaDto;
import Templa.Tesis.App.dtos.PostMesaDto;
import Templa.Tesis.App.dtos.UpdateMesaPosicionDto;
import org.springframework.data.domain.Page;

import java.util.List;

public interface IMesasService {
    GetMesaDto createMesa(PostMesaDto postMesaDto);
    GetMesaDto updateMesa(GetMesaDto mesaDto);
    Page<GetMesaDto> getMesas(int page, int size);
    Page<GetMesaDto> getMesas(String buscarFiltro, String estadoMesa,int page, int size);
    GetMesaDto cambiarEstadoMesa(Integer id, EstadoMesa nuevoEstado);
    GetMesaDto getMesaById(Integer id);
    GetMesaDto actualizarPosicionMesa(UpdateMesaPosicionDto mesaPosicionDto);
    List<GetMesaDto> getMesasConPosicion();
    List<GetMesaDto> obtenerMesasPorPiso(Integer piso);
    void desvincularMesaDelPlano(Integer idMesa);
    boolean estaVinculada(Integer idMesa);

}
