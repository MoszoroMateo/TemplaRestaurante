import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { GetPlatoDto } from '../../models/PlatoModel';
import { FiltroProducto, ProductoDTO } from '../../models/ProductoModel';
import { PlatoService } from '../../../services/plato.service';
import { ProductoService } from '../../../services/producto.service';
import { MenuService } from '../../../services/menu.service';
import { GetMenuDTO } from '../../models/MenuModel';
import { MenuModalComponent } from '../../modales/menu-modal/menu-modal.component';
import { Page } from '../../models/CommonModels';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-menus',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './menus.component.html',
  styleUrl: './menus.component.css'
})
export class MenusComponent implements OnInit {

  // ✅ Datos mostrados
  menus: GetMenuDTO[] = [];
  pageInfo: Page<GetMenuDTO> | null = null;
  
  // ✅ Filtros
  busqueda: string = '';
  estadoSeleccionado: string = 'TODOS';
  
  // ✅ Paginación
  paginaActual: number = 0;
  tamanoPagina: number = 12;
  
  // ✅ Loading
  cargando: boolean = false;

  // ✅ Datos para modales
  platosDisponibles: GetPlatoDto[] = [];
  productosDisponibles: ProductoDTO[] = [];

  get Math() {
    return Math;
  }

  constructor(
    private modalService: NgbModal,
    private platoService: PlatoService,
    private productoService: ProductoService,
    private menuService: MenuService
  ) { }

  ngOnInit(): void {
    console.log('Componente de Menús cargado');
    this.cargarPlatosDisponibles();
    this.cargarProductosDisponibles();
    this.cargarMenus();
  }

  // ✅ Cargar platos para los modales
  cargarPlatosDisponibles(): void {
    this.platoService.getPlatosFiltrados(0, 100).subscribe({
      next: (response: any) => {
        if (response?.content) {
          this.platosDisponibles = response.content;
          console.log('Platos cargados para menús:', this.platosDisponibles.length);
        }
      },
      error: (error) => {
        console.error('Error al cargar platos:', error);
      }
    });
  }

  // ✅ Cargar productos para los modales
  cargarProductosDisponibles(): void {
    const filtros: FiltroProducto = {
      page: 0,
      size: 100,
      busqueda: '',
      tipo: undefined,
      activo: true
    };
    
    this.productoService.obtenerProductosConFiltros(filtros).subscribe({
      next: (response: any) => {
        if (response?.content) {
          this.productosDisponibles = response.content;
          console.log('Productos cargados para menús:', this.productosDisponibles.length);
        }
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
      }
    });
  }

  // ✅ Cargar menús desde el servicio
  cargarMenus(): void {
    this.cargando = true;

    // Convertir el estado seleccionado al formato que espera el backend
    let estadoFiltro: string | undefined = undefined;
    if (this.estadoSeleccionado === 'ACTIVOS') {
      estadoFiltro = 'ACTIVO';
    } else if (this.estadoSeleccionado === 'INACTIVOS') {
      estadoFiltro = 'INACTIVO';
    }
    // Si es 'TODOS', estadoFiltro queda undefined

    console.log('Aplicando filtros:', {
      pagina: this.paginaActual,
      busqueda: this.busqueda,
      estadoSeleccionado: this.estadoSeleccionado,
      estadoFiltro: estadoFiltro
    });

    this.menuService.getMenusFiltrados(
      this.paginaActual,
      this.tamanoPagina,
      this.busqueda || undefined,
      estadoFiltro
    ).subscribe({
      next: (response: Page<GetMenuDTO>) => {
        this.pageInfo = response;
        this.menus = response.content;
        this.cargando = false;
        console.log('Menús cargados:', this.menus);
      },
      error: (error) => {
        console.error('Error al cargar menús:', error);
        this.cargando = false;
        Swal.fire({
          title: 'Error',
          text: 'No se pudieron cargar los menús',
          icon: 'error',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  // ✅ Métodos de paginación
  irAPagina(pagina: number): void {
    if (pagina >= 0 && pagina < (this.pageInfo?.totalPages || 0)) {
      this.paginaActual = pagina;
      this.cargarMenus();
    }
  }

  obtenerPaginasVisibles(): (number | null)[] {
    if (!this.pageInfo) return [];

    const totalPages = this.pageInfo.totalPages;
    const pages: (number | null)[] = [];

    if (totalPages <= 7) {
      // Si hay 7 páginas o menos, mostrar todas
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Mostrar: 1, 2, 3, 4, ..., última
      pages.push(0, 1, 2, 3);
      pages.push(null); // Puntos suspensivos
      pages.push(totalPages - 1);
    }

    return pages;
  }

  // ✅ Métodos de filtros
  onBusquedaChange(): void {
    this.aplicarFiltros();
  }

  onEstadoChange(estado: string): void {
    this.estadoSeleccionado = estado;
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    this.paginaActual = 0;
    this.cargarMenus();
  }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.estadoSeleccionado = 'TODOS';
    this.paginaActual = 0;
    this.cargarMenus();
  }

  // ✅ Métodos de estado
  getEstadoBadgeClass(menu: GetMenuDTO): string {
    return menu.activo ? 'estado-badge estado-disponible' : 'estado-badge estado-no-disponible';
  }

  getEstadoTexto(menu: GetMenuDTO): string {
    return menu.activo ? 'Disponible' : 'No Disponible';
  }

  // ✅ Verificar disponibilidad por fechas
  estaDisponible(menu: GetMenuDTO): boolean {
    if (!menu.activo) return false;
    
    const hoy = new Date();
    const desde = menu.disponibleDesde ? new Date(menu.disponibleDesde) : null;
    const hasta = menu.disponibleHasta ? new Date(menu.disponibleHasta) : null;
    
    if (desde && hoy < desde) return false;
    if (hasta && hoy > hasta) return false;
    
    return true;
  }

  // ✅ Formatear contenidos del menú - LÓGICA DEFINITIVA
formatearContenidos(menu: GetMenuDTO): string {
  if (!menu.productos || menu.productos.length === 0) {
    return 'Sin contenidos';
  }

  const contenidos: string[] = [];
  
  console.log('🔍 Formateando menú:', menu.nombre);
  
  menu.productos.forEach((item, index) => {
    console.log(`Procesando item ${index}:`, item);
    
    // ✅ BUSCAR PLATO (si existe)
    if (item.idPlato) {
      const plato = this.platosDisponibles.find(p => p.idPlato === item.idPlato);
      if (plato) {
        contenidos.push(plato.nombre);
        console.log(`✅ Plato agregado: ${plato.nombre}`);
      }
    }
    
    // ✅ BUSCAR PRODUCTO (si existe)  
    if (item.idProducto) {
      const producto = this.productosDisponibles.find(p => p.id === item.idProducto);
      if (producto) {
        contenidos.push(producto.nombre);
        console.log(`✅ Producto agregado: ${producto.nombre}`);
      }
    }
  });

  const contenidosUnicos = [...new Set(contenidos)];
  console.log('🎯 Resultado final:', contenidosUnicos);
  
  return contenidosUnicos.length > 0 ? contenidosUnicos.join(', ') : 'Sin contenidos válidos';
}
  // ✅ Modal para nuevo menú
  abrirModalNuevoMenu(): void {
    const modalRef = this.modalService.open(MenuModalComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false
    });

    modalRef.componentInstance.platos = this.platosDisponibles;
    modalRef.componentInstance.productos = this.productosDisponibles;

    modalRef.result.then((result) => {
      if (result?.action === 'created') {
        this.cargarMenus(); // Recargar la lista
      }
    }).catch((error) => {
      console.log('Modal cerrado sin guardar');
    });
  }

  // ✅ Modal para editar menú
  abrirModalEditarMenu(menu: GetMenuDTO): void {
    console.log('📝 Abriendo modal para editar menú:', menu.nombre);
    console.log('Datos del menú:', menu);
    console.log('Productos del menú:', menu.productos);
    console.log('Platos disponibles:', this.platosDisponibles.length);
    console.log('Productos disponibles:', this.productosDisponibles.length);
    
    const modalRef = this.modalService.open(MenuModalComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false
    });

    modalRef.componentInstance.menu = menu;
    modalRef.componentInstance.platos = this.platosDisponibles;
    modalRef.componentInstance.productos = this.productosDisponibles;

    modalRef.result.then((result) => {
      if (result?.action === 'updated') {
        console.log('✅ Menú actualizado, recargando lista...');
        this.cargarMenus(); // Recargar la lista
      }
    }).catch((error) => {
      console.log('Modal cerrado sin guardar');
    });
  }

  // ✅ Activar/Desactivar menú
  activarDesactivarMenu(menu: GetMenuDTO): void {
    if (!menu.id) return;

    const accion = menu.activo ? 'desactivar' : 'activar';
    
    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas ${accion} este menú?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, continuar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed && menu.id) {
        this.menuService.activarDesactivarMenu(menu.id).subscribe({
          next: (response) => {
            this.cargarMenus();
            
            // ✅ Mostrar advertencia si existe
            if (response.mensaje) {
              Swal.fire({
                title: `Menú ${accion === 'activar' ? 'activado' : 'desactivado'} con advertencia`,
                html: `<p>${response.mensaje}</p>`,
                icon: 'warning',
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#f5d76e'
              });
            } else {
              Swal.fire({
                title: 'Éxito',
                text: `Menú ${accion === 'activar' ? 'activado' : 'desactivado'} exitosamente`,
                icon: 'success',
                confirmButtonText: 'Aceptar'
              });
            }
          },
          error: (error) => {
            console.error(`Error al ${accion} menú:`, error);
            Swal.fire({
              title: 'Error',
              text: `No se pudo ${accion} el menú`,
              icon: 'error',
              confirmButtonText: 'Aceptar'
            });
          }
        });
      }
    });
  }

  // ✅ Eliminar menú
  eliminarMenu(menu: GetMenuDTO): void {
    if (!menu.id) return;

    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#e74c3c'
    }).then((result) => {
      if (result.isConfirmed && menu.id) {
        this.menuService.bajaMenu(menu.id).subscribe({
          next: () => {
            Swal.fire({
              title: 'Eliminado',
              text: 'Menú eliminado exitosamente',
              icon: 'success',
              confirmButtonText: 'Aceptar'
            });
            this.cargarMenus();
          },
          error: (error) => {
            console.error('Error al eliminar menú:', error);
            Swal.fire({
              title: 'Error',
              text: 'No se pudo eliminar el menú',
              icon: 'error',
              confirmButtonText: 'Aceptar'
            });
          }
        });
      }
    });
  }

}
