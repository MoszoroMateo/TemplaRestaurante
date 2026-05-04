package Templa.Tesis.App.servicies.impl;

import Templa.Tesis.App.Enums.TipoProducto;
import Templa.Tesis.App.Enums.UnidadMedida;
import Templa.Tesis.App.dtos.PostProductoDTO;
import Templa.Tesis.App.dtos.ProductoDTO;
import Templa.Tesis.App.entities.ProductoEntity;
import Templa.Tesis.App.repositories.ProductoRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Tests para ProductoServiceImpl")

class ProductoServiceImplTest {

    @Mock
    private ProductoRepository productoRepository;

    @Mock
    private ModelMapper modelMapper;

    @InjectMocks
    private ProductoServiceImpl productoService;

    private PostProductoDTO postProductoDTO;
    private ProductoDTO productoDTO;
    private ProductoEntity productoEntity;

    @BeforeEach
    void setUp() {
        postProductoDTO = PostProductoDTO.builder()
                .nombre("Harina")
                .tipo(TipoProducto.INSUMO)
                .unidadMedida(UnidadMedida.KILOGRAMO)
                .stockActual(100.0)
                .stockMinimo(10.0)
                .stockMaximo(200.0)
                .activo(true)
                .build();

        productoEntity = ProductoEntity.builder()
                .id(1)
                .nombre("Harina")
                .tipo(TipoProducto.INSUMO)
                .unidadMedida(UnidadMedida.KILOGRAMO)
                .stockActual(100.0)
                .stockMinimo(10.0)
                .stockMaximo(200.0)
                .activo(true)
                .build();

        productoDTO = ProductoDTO.builder()
                .id(1)
                .nombre("Harina")
                .tipo(TipoProducto.INSUMO)
                .unidadMedida(UnidadMedida.KILOGRAMO)
                .stockActual(100.0)
                .stockMinimo(10.0)
                .stockMaximo(200.0)
                .activo(true)
                .build();
    }

    // ================ Tests para registrarProducto ================

    @Test
    @DisplayName("Registrar producto exitosamente")
    void registrarProducto_ExitoCuandoTodosLosDatosSonValidos() {
        when(productoRepository.findByNombre(postProductoDTO.getNombre())).thenReturn(null);
        when(modelMapper.map(postProductoDTO, ProductoEntity.class)).thenReturn(productoEntity);
        when(productoRepository.save(any(ProductoEntity.class))).thenReturn(productoEntity);
        when(modelMapper.map(productoEntity, ProductoDTO.class)).thenReturn(productoDTO);

        ProductoDTO resultado = productoService.registrarProducto(postProductoDTO);

        assertNotNull(resultado);
        assertEquals("Harina", resultado.getNombre());
        verify(productoRepository).findByNombre(postProductoDTO.getNombre());
        verify(productoRepository).save(any(ProductoEntity.class));
        verify(modelMapper).map(postProductoDTO, ProductoEntity.class);
        verify(modelMapper).map(productoEntity, ProductoDTO.class);
    }

    @Test
    @DisplayName("Lanzar excepción cuando nombre es null")
    void registrarProducto_LanzaExcepcionCuandoNombreEsNull() {
        postProductoDTO.setNombre(null);

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> productoService.registrarProducto(postProductoDTO)
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        assertEquals("Debe ingresar el nombre", exception.getReason());
        verify(productoRepository, never()).save(any());
    }

    @Test
    @DisplayName("Lanzar excepción cuando tipo es null")
    void registrarProducto_LanzaExcepcionCuandoTipoEsNull() {
        postProductoDTO.setTipo(null);

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> productoService.registrarProducto(postProductoDTO)
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        assertEquals("Debe ingresar el tipo de producto", exception.getReason());
        verify(productoRepository, never()).save(any());
    }

    @Test
    @DisplayName("Lanzar excepción cuando unidad de medida es null")
    void registrarProducto_LanzaExcepcionCuandoUnidadMedidaEsNull() {
        postProductoDTO.setUnidadMedida(null);

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> productoService.registrarProducto(postProductoDTO)
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        assertEquals("Debe ingresar la unidad de medida", exception.getReason());
        verify(productoRepository, never()).save(any());
    }

    @Test
    @DisplayName("Lanzar excepción cuando producto ya existe")
    void registrarProducto_LanzaExcepcionCuandoProductoYaExiste() {
        when(productoRepository.findByNombre(postProductoDTO.getNombre())).thenReturn(productoEntity);

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> productoService.registrarProducto(postProductoDTO)
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
        assertEquals("El producto ya existe", exception.getReason());
        verify(productoRepository, never()).save(any());
    }

    @Test
    @DisplayName("Lanzar excepción cuando ocurre error al guardar")
    void registrarProducto_LanzaExcepcionCuandoOcurreErrorAlGuardar() {
        when(productoRepository.findByNombre(postProductoDTO.getNombre())).thenReturn(null);
        when(modelMapper.map(postProductoDTO, ProductoEntity.class)).thenReturn(productoEntity);
        when(productoRepository.save(any(ProductoEntity.class))).thenThrow(new RuntimeException("Error de BD"));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> productoService.registrarProducto(postProductoDTO)
        );

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, exception.getStatusCode());
        assertEquals("Error al guardar el producto", exception.getReason());
    }

    // ================ Tests para actualizarProducto ================

    @Test
    @DisplayName("Actualizar producto exitosamente")
    void actualizarProducto_ExitoCuandoProductoExiste() {
        ProductoDTO productoActualizado = ProductoDTO.builder()
                .nombre("Harina Actualizada")
                .tipo(TipoProducto.INSUMO)
                .stockActual(150.0)
                .stockMinimo(20.0)
                .stockMaximo(300.0)
                .activo(false)
                .build();

        when(productoRepository.findById(1)).thenReturn(Optional.of(productoEntity));
        when(productoRepository.save(any(ProductoEntity.class))).thenReturn(productoEntity);
        when(modelMapper.map(productoEntity, ProductoDTO.class)).thenReturn(productoActualizado);

        ProductoDTO resultado = productoService.actualizarProducto(1, productoActualizado);

        assertNotNull(resultado);
        assertEquals("Harina Actualizada", resultado.getNombre());
        verify(productoRepository).findById(1);
        verify(productoRepository).save(any(ProductoEntity.class));
    }

    @Test
    @DisplayName("Lanzar excepción cuando producto no existe al actualizar")
    void actualizarProducto_LanzaExcepcionCuandoProductoNoExiste() {
        when(productoRepository.findById(999)).thenReturn(Optional.empty());

        EntityNotFoundException exception = assertThrows(
                EntityNotFoundException.class,
                () -> productoService.actualizarProducto(999, productoDTO)
        );

        assertTrue(exception.getMessage().contains("Producto no encontrado con ID: 999"));
        verify(productoRepository, never()).save(any());
    }

    // ================ Tests para traerProductos (sin filtros) ================

    @Test
    @DisplayName("Traer productos paginados sin filtros")
    void traerProductos_RetornaPaginaSinFiltros() {
        List<ProductoEntity> listaProductos = Arrays.asList(productoEntity);
        Page<ProductoEntity> pageProductos = new PageImpl<>(listaProductos);

        when(productoRepository.findAll(any(Pageable.class))).thenReturn(pageProductos);
        when(modelMapper.map(any(ProductoEntity.class), eq(ProductoDTO.class))).thenReturn(productoDTO);

        Page<ProductoDTO> resultado = productoService.traerProductos(0, 10);

        assertNotNull(resultado);
        assertEquals(1, resultado.getTotalElements());
        verify(productoRepository).findAll(any(Pageable.class));
    }

    // ================ Tests para traerProductos (con filtros) ================

    @Test
    @DisplayName("Traer productos con filtro de búsqueda")
    void traerProductos_ConFiltroBusqueda() {
        List<ProductoEntity> listaProductos = Arrays.asList(productoEntity);
        Page<ProductoEntity> pageProductos = new PageImpl<>(listaProductos);

        when(productoRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(pageProductos);
        when(modelMapper.map(any(ProductoEntity.class), eq(ProductoDTO.class))).thenReturn(productoDTO);

        Page<ProductoDTO> resultado = productoService.traerProductos(0, 10, "Harina", null, null);

        assertNotNull(resultado);
        assertEquals(1, resultado.getTotalElements());
        verify(productoRepository).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    @DisplayName("Traer productos con filtro de tipo")
    void traerProductos_ConFiltroTipo() {
        List<ProductoEntity> listaProductos = Arrays.asList(productoEntity);
        Page<ProductoEntity> pageProductos = new PageImpl<>(listaProductos);

        when(productoRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(pageProductos);
        when(modelMapper.map(any(ProductoEntity.class), eq(ProductoDTO.class))).thenReturn(productoDTO);

        Page<ProductoDTO> resultado = productoService.traerProductos(0, 10, null, TipoProducto.INSUMO, null);

        assertNotNull(resultado);
        assertEquals(1, resultado.getTotalElements());
        verify(productoRepository).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    @DisplayName("Traer productos con filtro activo true")
    void traerProductos_ConFiltroActivoTrue() {
        List<ProductoEntity> listaProductos = Arrays.asList(productoEntity);
        Page<ProductoEntity> pageProductos = new PageImpl<>(listaProductos);

        when(productoRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(pageProductos);
        when(modelMapper.map(any(ProductoEntity.class), eq(ProductoDTO.class))).thenReturn(productoDTO);

        Page<ProductoDTO> resultado = productoService.traerProductos(0, 10, null, null, true);

        assertNotNull(resultado);
        assertEquals(1, resultado.getTotalElements());
        verify(productoRepository).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    @DisplayName("Traer productos con filtro activo false")
    void traerProductos_ConFiltroActivoFalse() {
        List<ProductoEntity> listaProductos = Arrays.asList(productoEntity);
        Page<ProductoEntity> pageProductos = new PageImpl<>(listaProductos);

        when(productoRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(pageProductos);
        when(modelMapper.map(any(ProductoEntity.class), eq(ProductoDTO.class))).thenReturn(productoDTO);

        Page<ProductoDTO> resultado = productoService.traerProductos(0, 10, null, null, false);

        assertNotNull(resultado);
        assertEquals(1, resultado.getTotalElements());
        verify(productoRepository).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    @DisplayName("Traer productos con todos los filtros")
    void traerProductos_ConTodosLosFiltros() {
        List<ProductoEntity> listaProductos = Arrays.asList(productoEntity);
        Page<ProductoEntity> pageProductos = new PageImpl<>(listaProductos);

        when(productoRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(pageProductos);
        when(modelMapper.map(any(ProductoEntity.class), eq(ProductoDTO.class))).thenReturn(productoDTO);

        Page<ProductoDTO> resultado = productoService.traerProductos(0, 10, "Harina", TipoProducto.INSUMO, true);

        assertNotNull(resultado);
        assertEquals(1, resultado.getTotalElements());
        verify(productoRepository).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    @DisplayName("Traer productos con búsqueda vacía")
    void traerProductos_ConBusquedaVacia() {
        List<ProductoEntity> listaProductos = Arrays.asList(productoEntity);
        Page<ProductoEntity> pageProductos = new PageImpl<>(listaProductos);

        when(productoRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(pageProductos);
        when(modelMapper.map(any(ProductoEntity.class), eq(ProductoDTO.class))).thenReturn(productoDTO);

        Page<ProductoDTO> resultado = productoService.traerProductos(0, 10, "", null, null);

        assertNotNull(resultado);
        assertEquals(1, resultado.getTotalElements());
        verify(productoRepository).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    @DisplayName("Traer productos con búsqueda en blanco")
    void traerProductos_ConBusquedaEnBlanco() {
        List<ProductoEntity> listaProductos = Arrays.asList(productoEntity);
        Page<ProductoEntity> pageProductos = new PageImpl<>(listaProductos);

        when(productoRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(pageProductos);
        when(modelMapper.map(any(ProductoEntity.class), eq(ProductoDTO.class))).thenReturn(productoDTO);

        Page<ProductoDTO> resultado = productoService.traerProductos(0, 10, "   ", null, null);

        assertNotNull(resultado);
        assertEquals(1, resultado.getTotalElements());
        verify(productoRepository).findAll(any(Specification.class), any(Pageable.class));
    }

    // ================ Tests para eliminarProducto ================

    @Test
    @DisplayName("Eliminar producto exitosamente")
    void eliminarProducto_ExitoCuandoProductoExiste() {
        when(productoRepository.findById(1)).thenReturn(Optional.of(productoEntity));
        doNothing().when(productoRepository).delete(productoEntity);

        assertDoesNotThrow(() -> productoService.eliminarProducto(1));

        verify(productoRepository).findById(1);
        verify(productoRepository).delete(productoEntity);
    }


    // ================ Tests para traerInsumos ================

    @Test
    @DisplayName("Traer insumos paginados")
    void traerInsumos_RetornaPaginaDeInsumos() {
        List<ProductoEntity> listaInsumos = Arrays.asList(productoEntity);
        Page<ProductoEntity> pageInsumos = new PageImpl<>(listaInsumos);

        when(productoRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(pageInsumos);
        when(modelMapper.map(any(ProductoEntity.class), eq(ProductoDTO.class))).thenReturn(productoDTO);

        Page<ProductoDTO> resultado = productoService.traerInsumos(0, 10);

        assertNotNull(resultado);
        assertEquals(1, resultado.getTotalElements());
        verify(productoRepository).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    @DisplayName("Traer insumos retorna página vacía cuando no hay insumos")
    void traerInsumos_RetornaPaginaVaciaCuandoNoHayInsumos() {
        Page<ProductoEntity> pageVacia = new PageImpl<>(Arrays.asList());

        when(productoRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(pageVacia);

        Page<ProductoDTO> resultado = productoService.traerInsumos(0, 10);

        assertNotNull(resultado);
        assertEquals(0, resultado.getTotalElements());
        verify(productoRepository).findAll(any(Specification.class), any(Pageable.class));
    }
}