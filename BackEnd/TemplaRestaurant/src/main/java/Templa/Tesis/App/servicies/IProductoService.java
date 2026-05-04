package Templa.Tesis.App.servicies;

import Templa.Tesis.App.Enums.TipoProducto;
import Templa.Tesis.App.dtos.PersonaDto;
import Templa.Tesis.App.dtos.PostProductoDTO;
import Templa.Tesis.App.dtos.ProductoDTO;
import Templa.Tesis.App.dtos.ReporteStockBajoDTO;
import Templa.Tesis.App.entities.ProductoEntity;
import org.springframework.data.domain.Page;

import java.util.List;

public interface IProductoService {
    ProductoDTO registrarProducto(PostProductoDTO nuevoProducto);
    ProductoDTO actualizarProducto(Integer id, ProductoDTO productoDTO);
    Page<ProductoDTO> traerProductos(int page, int size);
    Page<ProductoDTO> traerProductos(int page, int size, String buscar, TipoProducto tipo, Boolean activo);
    Page<ProductoDTO> traerInsumos(int page, int size);
    void eliminarProducto(Integer id);
    ProductoEntity reducirStock(Integer idProducto, double cantidad);
    void aumentarStock(Integer idProducto, double cantidad);

    //Reporte
    List<ReporteStockBajoDTO> obtenerProductosStockBajo();
}
