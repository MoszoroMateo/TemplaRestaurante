package Templa.Tesis.App.servicies.impl;

import Templa.Tesis.App.dtos.GetMenuDTO;
import Templa.Tesis.App.dtos.GetProductosMenuDto;
import Templa.Tesis.App.dtos.PostMenuDTO;
import Templa.Tesis.App.dtos.PostProductosMenuDto;
import Templa.Tesis.App.entities.MenuDetalleEntity;
import Templa.Tesis.App.entities.MenuEntity;
import Templa.Tesis.App.entities.PlatoEntity;
import Templa.Tesis.App.entities.ProductoEntity;
import Templa.Tesis.App.repositories.MenuDetalleRepository;
import Templa.Tesis.App.repositories.MenuRepository;
import Templa.Tesis.App.repositories.PlatoRepository;
import Templa.Tesis.App.repositories.ProductoRepository;
import Templa.Tesis.App.servicies.IMenuService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MenuServiceImpl implements IMenuService {

    private final MenuRepository menuRepository;
    private final MenuDetalleRepository menuDetalleRepository;
    private final PlatoRepository platoRepository;
    private final ProductoRepository productoRepository;
    private final ModelMapper modelMapper;

    /**
     * Obtiene una lista paginada de todos los menús activos en el sistema.
     * Convierte cada entidad MenuEntity a su representación GetMenuDTO correspondiente.
     *
     * @param page Número de página a recuperar (comenzando desde 0).
     * @param size Cantidad de elementos por página.
     * @return Page<GetMenuDTO> que contiene los menús de la página solicitada,
     *         con información de paginación incluida.
     * @throws Exception si ocurre un error durante la consulta a la base de datos.
     */
    @Override
    public Page<GetMenuDTO> getMenus(int page, int size) {
        Pageable pageable = PageRequest.of(page, size,
                Sort.by(Sort.Order.desc("activo"), Sort.Order.asc("nombre")));
        Page<MenuEntity> menuEntities = menuRepository.findAll(pageable);
        return menuEntities.map(this::convertToDto);
    }

    /**
     * Obtiene una lista paginada de menús aplicando filtros de búsqueda y estado.
     * Permite filtrar menús por texto (nombre o descripción) y por estado de activación.
     *
     * @param buscarFiltro Texto para filtrar por nombre o descripción del menú.
     *                    Si es null o vacío, no se aplica filtro de texto.
     * @param estado Filtro por estado de activación ("activo", "inactivo" o null para todos).
     * @param page Número de página a recuperar (comenzando desde 0).
     * @param size Cantidad de elementos por página.
     * @return Page<GetMenuDTO> con los menús filtrados y paginados.
     * @throws Exception si ocurre un error durante la consulta a la base de datos.
     */
    @Override
    public Page<GetMenuDTO> getMenus(String buscarFiltro, String estado, int page, int size) {
        Pageable pageable = PageRequest.of(page, size,
                Sort.by(Sort.Order.desc("activo"), Sort.Order.asc("nombre")));
        Page<MenuEntity> menuEntities = menuRepository.findMenusWithFilters(buscarFiltro, estado, pageable);
        return menuEntities.map(menu -> convertToDto(menu));
    }

    private GetMenuDTO convertToDto(MenuEntity menu) {
        GetMenuDTO dto = modelMapper.map(menu, GetMenuDTO.class);

        // Obtener los productos del menú
        List<MenuDetalleEntity> detalles = menuDetalleRepository.findByMenuId(menu.getId());

        List<GetProductosMenuDto> productosDtos = detalles.stream()
                .map(detalle -> {
                    GetProductosMenuDto productoDto = new GetProductosMenuDto();

                    // ✅ CORRECCIÓN: Solo asignar IDs si no son null
                    if (detalle.getPlato() != null) {
                        productoDto.setIdPlato(detalle.getPlato().getIdPlato());
                    }
                    if (detalle.getProducto() != null) {
                        productoDto.setIdProducto(detalle.getProducto().getId());
                    }

                    return productoDto;
                })
                .collect(Collectors.toList());

        dto.setProductos(productosDtos);
        return dto;
    }


    /**
     * Crea un nuevo menú en el sistema con los productos y/o platos asociados.
     * Realiza validaciones de datos, crea la entidad principal y sus detalles,
     * y mantiene la consistencia transaccional.
     *
     * @param postMenuDTO Objeto DTO con los datos del menú a crear, incluyendo
     *                    nombre, precio, descripción y lista de productos/platos.
     * @return GetMenuDTO que representa el menú creado con todos sus detalles.
     * @throws ResponseStatusException con código 400 si:
     *         - El nombre es nulo o vacío
     *         - El precio es nulo o menor/igual a 0
     *         - No se proporcionan productos/platos
     *         - Un item no tiene ni plato ni producto
     *         - Un plato o producto referenciado no existe
     * @throws ResponseStatusException con código 500 si ocurre un error interno.
     * @Transactional La operación se ejecuta dentro de una transacción.
     */
    @Override
    @Transactional
    public GetMenuDTO createMenu(PostMenuDTO postMenuDTO) {
        // Validaciones
        if (postMenuDTO.getNombre() == null || postMenuDTO.getNombre().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe ingresar un nombre válido");
        }

        if (postMenuDTO.getPrecio() == null || postMenuDTO.getPrecio() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe ingresar un precio válido");
        }

        if (postMenuDTO.getProductos() == null || postMenuDTO.getProductos().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe agregar al menos un producto al menú");
        }

        try {
            MenuEntity menuEntity = modelMapper.map(postMenuDTO, MenuEntity.class);
            menuEntity.setActivo(true);
            MenuEntity savedMenu = menuRepository.save(menuEntity);

            // Crear los detalles del menú - VERSIÓN CORREGIDA
            List<MenuDetalleEntity> detalles = new ArrayList<>();
            for (PostProductosMenuDto producto : postMenuDTO.getProductos()) {
                MenuDetalleEntity detalle = new MenuDetalleEntity();
                detalle.setMenu(savedMenu);

                // ✅ CORRECCIÓN: Validar que al menos uno de los dos IDs esté presente
                if (producto.getIdPlato() == null && producto.getIdProducto() == null) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Cada item del menú debe tener al menos un plato o un producto");
                }

                // ✅ CORRECCIÓN: Agregar plato solo si viene el ID
                if (producto.getIdPlato() != null) {
                    PlatoEntity plato = platoRepository.findById(producto.getIdPlato())
                            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                    "El plato con ID " + producto.getIdPlato() + " no existe"));
                    detalle.setPlato(plato);
                }

                // ✅ CORRECCIÓN: Agregar producto solo si viene el ID
                if (producto.getIdProducto() != null) {
                    ProductoEntity productoEntity = productoRepository.findById(producto.getIdProducto())
                            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                    "El producto con ID " + producto.getIdProducto() + " no existe"));
                    detalle.setProducto(productoEntity);
                }

                detalles.add(detalle);
            }
            menuDetalleRepository.saveAll(detalles);

            return convertToDto(savedMenu);

        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Error al crear el menú: " + e.getMessage());
        }
    }

    /**
     * Actualiza completamente un menú existente identificado por su ID.
     * Modifica todos los campos del menú y reemplaza completamente la lista de productos/platos.
     *
     * @param menuActualizar Objeto DTO con los datos actualizados del menú,
     *                       incluyendo ID, nombre, precio, estado y lista de productos/platos.
     * @return GetMenuDTO que representa el menú actualizado.
     * @throws ResponseStatusException con código 400 si:
     *         - El nombre es nulo o vacío
     *         - El precio es nulo o menor/igual a 0
     *         - Un item no tiene ni plato ni producto
     *         - Un plato o producto referenciado no existe
     * @throws ResponseStatusException con código 404 si el menú no existe.
     * @throws ResponseStatusException con código 500 si ocurre un error interno.
     * @Transactional La operación se ejecuta dentro de una transacción.
     */
    @Override
    @Transactional
    public GetMenuDTO actualizarMenu(GetMenuDTO menuActualizar) {
        // Validaciones
        if (menuActualizar.getNombre() == null || menuActualizar.getNombre().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe ingresar un nombre válido");
        }

        if (menuActualizar.getPrecio() == null || menuActualizar.getPrecio() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe ingresar un precio válido");
        }

        Optional<MenuEntity> menuOptional = menuRepository.findById(menuActualizar.getId());
        if (menuOptional.isPresent()) {
            try {
                MenuEntity menuExistente = menuOptional.get();
                menuExistente.setNombre(menuActualizar.getNombre());
                menuExistente.setDescripcion(menuActualizar.getDescripcion());
                menuExistente.setPrecio(menuActualizar.getPrecio());
                menuExistente.setDisponibleDesde(menuActualizar.getDisponibleDesde());
                menuExistente.setDisponibleHasta(menuActualizar.getDisponibleHasta());
                menuExistente.setActivo(menuActualizar.isActivo());

                MenuEntity menuActualizado = menuRepository.save(menuExistente);

                // Actualizar productos del menú
                updateProductosMenu(menuActualizado, menuActualizar.getProductos());

                return convertToDto(menuActualizado);

            } catch (ResponseStatusException e) {
                throw e;
            } catch (Exception e) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "Error al actualizar el menú: " + e.getMessage());
            }
        }
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Menu no encontrado con ID: " + menuActualizar.getId());
    }

    private void updateProductosMenu(MenuEntity menu, List<GetProductosMenuDto> nuevosProductos) {
        // Eliminar detalles actuales
        List<MenuDetalleEntity> detallesActuales = menuDetalleRepository.findByMenuId(menu.getId());
        if (!detallesActuales.isEmpty()) {
            menuDetalleRepository.deleteAll(detallesActuales);
        }

        // Crear nuevos detalles - VERSIÓN CORREGIDA
        if (nuevosProductos != null && !nuevosProductos.isEmpty()) {
            List<MenuDetalleEntity> nuevosDetalles = new ArrayList<>();

            for (GetProductosMenuDto producto : nuevosProductos) {
                MenuDetalleEntity detalle = new MenuDetalleEntity();
                detalle.setMenu(menu);

                // ✅ CORRECCIÓN: Validar que al menos uno de los dos IDs esté presente
                if (producto.getIdPlato() == null && producto.getIdProducto() == null) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Cada item del menú debe tener al menos un plato o un producto");
                }

                // ✅ CORRECCIÓN: Agregar plato solo si viene el ID
                if (producto.getIdPlato() != null) {
                    PlatoEntity plato = platoRepository.findById(producto.getIdPlato())
                            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                    "Plato con ID " + producto.getIdPlato() + " no existe"));
                    detalle.setPlato(plato);
                }

                // ✅ CORRECCIÓN: Agregar producto solo si viene el ID
                if (producto.getIdProducto() != null) {
                    ProductoEntity productoEntity = productoRepository.findById(producto.getIdProducto())
                            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                    "Producto con ID " + producto.getIdProducto() + " no existe"));
                    detalle.setProducto(productoEntity);
                }

                nuevosDetalles.add(detalle);
            }

            menuDetalleRepository.saveAll(nuevosDetalles);
        }
    }

    /**
     * Alterna el estado de activación de un menú (activo ↔ inactivo).
     * Si el menú está activo, lo desactiva, y viceversa.
     *
     * @param id Identificador único del menú a modificar.
     * @throws ResponseStatusException con código 404 si no existe un menú con el ID proporcionado.
     * @return String con mensaje de advertencia si hay items con problemas, null si todo está bien.
     * @throws Exception si ocurre un error durante la actualización.
     */
    @Override
    public String activarDesactivarMenu(Integer id) {
        Optional<MenuEntity> menuOptional = menuRepository.findById(id);
        if (menuOptional.isPresent()) {
            MenuEntity menu = menuOptional.get();
            
            String mensajeAdvertencia = null;
            
            // ✅ Si está inactivo y se intenta activar, validar items
            if (!menu.getActivo()) {
                List<MenuDetalleEntity> detalles = menuDetalleRepository.findByMenuId(menu.getId());
                List<String> itemsProblematicos = new ArrayList<>();
                
                for (MenuDetalleEntity detalle : detalles) {
                    if (detalle.getProducto() != null) {
                        ProductoEntity producto = detalle.getProducto();
                        if (!producto.getActivo()) {
                            itemsProblematicos.add("Producto: " + producto.getNombre() + " (inactivo)");
                        } else if (producto.getStockActual() <= producto.getStockMinimo()) {
                            itemsProblematicos.add("Producto: " + producto.getNombre() + " (stock bajo)");
                        }
                    }
                    
                    if (detalle.getPlato() != null) {
                        PlatoEntity plato = detalle.getPlato();
                        if (!plato.getDisponible()) {
                            itemsProblematicos.add("Plato: " + plato.getNombre() + " (no disponible)");
                        }
                    }
                }
                
                if (!itemsProblematicos.isEmpty()) {
                    mensajeAdvertencia = "El menú se activó pero los siguientes items tienen stock bajo o esta inactivo: " +
                        String.join(", ", itemsProblematicos);
                }
            }
            
            menu.setActivo(!menu.getActivo());
            menuRepository.save(menu);
            
            return mensajeAdvertencia;
        } else {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Menu no encontrado con ID: " + id);
        }
    }

    /**
     * Desactiva permanentemente un menú, estableciendo su estado activo a false.
     * Esta operación es irreversible desde este método (requeriría activarDesactivarMenu).
     *
     * @param id Identificador único del menú a desactivar.
     * @throws ResponseStatusException con código 404 si no existe un menú con el ID proporcionado.
     * @throws Exception si ocurre un error durante la actualización.
     */
    @Override
    public void bajaMenu(Integer id) {
        Optional<MenuEntity> menuOptional = menuRepository.findById(id);
        if (menuOptional.isPresent()) {
            MenuEntity menu = menuOptional.get();
            menu.setActivo(false);
            menuRepository.save(menu);
        } else {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Menu no encontrado con ID: " + id);
        }
    }

    public List<MenuDetalleEntity> obtenerDetallesMenu(Integer idMenu) {
        List<MenuDetalleEntity> detalles = menuDetalleRepository.findByMenuId(idMenu);

        if (detalles.isEmpty()) {
            throw new RuntimeException("El menú con id " + idMenu + " no existe o no tiene detalles");
        }

        return detalles;
    }

    /**
     * Busca un menú por su identificador único y lo devuelve con todos sus detalles.
     * Incluye la lista de productos y platos asociados al menú.
     *
     * @param id Identificador único del menú a buscar.
     * @return GetMenuDTO con toda la información del menú y sus detalles.
     * @throws ResponseStatusException con código 404 si no existe un menú con el ID proporcionado.
     * @throws Exception si ocurre un error durante la consulta.
     */
    @Override
    public GetMenuDTO obtenerMenuPorId(Integer id) {
        Optional<MenuEntity> menuOptional = menuRepository.findById(id);
        if (menuOptional.isPresent()) {
            return convertToDto(menuOptional.get());
        } else {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Menu no encontrado con ID: " + id);
        }
    }


    @Override
    public void desactivarMenusQueUsan(Integer idProducto) {
        List<MenuEntity> menusConProducto = menuRepository.findByDetallesProductoId(idProducto);

        for (MenuEntity menu : menusConProducto) {
            if (menu.getActivo()) {
                menu.setActivo(false);
                menuRepository.save(menu);

                System.out.println("Menú desactivado: " + menu.getNombre() +
                        " (falta producto: " + idProducto + ")");
            }
        }

        // Menús que contengan platos que usan este producto
        List<PlatoEntity> platosAfectados = platoRepository.findByIngredienteProductoId(idProducto);

        for (PlatoEntity plato : platosAfectados) {
            List<MenuEntity> menusConPlato = menuRepository.findByDetallesPlatoId(plato.getIdPlato());

            for (MenuEntity menu : menusConPlato) {
                if (menu.getActivo()) {
                    menu.setActivo(false);
                    menuRepository.save(menu);

                    System.out.println("Menú desactivado: " + menu.getNombre() +
                            " (falta producto en plato: " + plato.getNombre() + ")");
                }
            }
        }
    }

    /**
     * Reactiva automáticamente los menús que utilizan un producto específico,
     * verificando previamente que todos los componentes del menú estén disponibles.
     * Se utiliza cuando un producto vuelve a estar disponible.
     *
     * @param idProducto Identificador del producto que ha vuelto a estar disponible.
     * @throws Exception si ocurre un error durante las actualizaciones.
     * @note Solo reactiva menús si todos sus productos/platos están disponibles.
     */
    @Override
    public void reactivarMenusQueUsan(Integer idProducto) {
        List<MenuEntity> menus = menuRepository.findByDetallesProductoId(idProducto);

        for (MenuEntity menu : menus) {
            if (todosLosItemsDelMenuDisponibles(menu) && !menu.getActivo()) {
                menu.setActivo(true);
                menuRepository.save(menu);

                System.out.println("Menú reactivado: " + menu.getNombre());
            }
        }

        // Reactivar menús que contienen platos con este producto
        List<PlatoEntity> platos = platoRepository.findByIngredienteProductoId(idProducto);

        for (PlatoEntity plato : platos) {
            if (plato.getDisponible()) {
                List<MenuEntity> menusConPlato = menuRepository.findByDetallesPlatoId(plato.getIdPlato());

                for (MenuEntity menu : menusConPlato) {
                    if (todosLosItemsDelMenuDisponibles(menu) && !menu.getActivo()) {
                        menu.setActivo(true);
                        menuRepository.save(menu);

                        System.out.println("Menú reactivado: " + menu.getNombre());
                    }
                }
            }
        }
    }

    /**
     * Verifica si todos los items (productos y platos) de un menú están disponibles.
     * Para productos: deben estar activos y tener stock mayor a 0.
     * Para platos: deben estar disponibles (disponible = true).
     *
     * @param menu Entidad MenuEntity a verificar.
     * @return true si todos los items del menú están disponibles, false en caso contrario.
     * @note Retorna false si algún detalle no tiene ni producto ni plato asociado.
     */
private boolean todosLosItemsDelMenuDisponibles(MenuEntity menu) {
    List<MenuDetalleEntity> detalles = menuDetalleRepository.findByMenuId(menu.getId());
    return detalles.stream().allMatch(detalle -> {
        ProductoEntity producto = detalle.getProducto();
        if (producto != null) {
            return producto.getActivo() && producto.getStockActual() > 0;
        }
        PlatoEntity plato = detalle.getPlato();
        if (plato != null) {
            return plato.getDisponible();
        }
        return false;
    });
}
}
