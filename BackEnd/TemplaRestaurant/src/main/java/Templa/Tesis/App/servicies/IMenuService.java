package Templa.Tesis.App.servicies;

import Templa.Tesis.App.dtos.GetMenuDTO;
import Templa.Tesis.App.dtos.PostMenuDTO;
import Templa.Tesis.App.entities.MenuDetalleEntity;
import org.springframework.data.domain.Page;

import java.util.List;

public interface IMenuService {
    Page<GetMenuDTO> getMenus(int page, int size);
    Page<GetMenuDTO> getMenus(String buscarFiltro,String estado, int page, int size);
    GetMenuDTO createMenu(PostMenuDTO postMenuDTO);
    GetMenuDTO actualizarMenu(GetMenuDTO menuActualizar);
    String activarDesactivarMenu(Integer id);
    void bajaMenu(Integer id);
    List<MenuDetalleEntity>  obtenerDetallesMenu(Integer idMenu);
    GetMenuDTO obtenerMenuPorId(Integer id);

    void desactivarMenusQueUsan(Integer idProducto);

    void reactivarMenusQueUsan(Integer idProducto);
}
