import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ProductoModalComponent } from '../../modales/producto-modal/producto-modal.component';
import { ReportesModalComponent } from '../../modales/reportes-modal/reportes-modal.component';
import { ProductoService } from '../../../services/producto.service';
import { NotificationService } from '../../../services/notification.service';
import { ProductoDTO, PostProductoDTO, TipoProducto, FiltroProducto } from '../../models/ProductoModel';
import { Page } from '../../models/CommonModels';
import { AlertService } from '../../../services/alert.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './productos.component.html',
  styleUrl: './productos.component.css'
})
export class ProductosComponent implements OnInit {
  
  // ✅ Datos
  productos: ProductoDTO[] = [];
  pageInfo: Page<ProductoDTO> | null = null;
  
  // ✅ Filtros
  busqueda: string = '';
  tipoSeleccionado: TipoProducto | '' = '';
  estadoSeleccionado: string = 'ACTIVOS';
  
  // ✅ Paginación
  paginaActual: number = 0;
  tamanoPagina: number = 10;

  // ✅ Loading
  cargando: boolean = false;

  // ✅ Modal de reportes - Ya no necesitamos ViewChild, usamos modalService directamente

  TipoProducto = TipoProducto;

  get Math() {
    return Math;
  }

  constructor(
    private modalService: NgbModal,
    private productoService: ProductoService,
    private notificationService: NotificationService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    this.cargarProductosIniciales();
  }

  // ✅ Carga inicial
  cargarProductosIniciales() {
    this.cargando = true;
    
    console.log('🚀 Iniciando carga de productos...');

    this.productoService.obtenerProductos(0, 10).subscribe({
      next: (page) => {
        console.log('✅ Respuesta del backend:', page);
        this.pageInfo = page;
        this.productos = page.content;
        this.paginaActual = page.number;
        this.cargando = false;
        console.log('✅ Productos cargados:', page.content.length);
        console.log('✅ Datos de productos:', this.productos);
        
        // Debug específico para ver los campos de cada producto
        if (this.productos.length > 0) {
          console.log('🔍 Primer producto completo:', this.productos[0]);
          console.log('🔍 Campos disponibles:', Object.keys(this.productos[0]));
          console.log('🔍 tipo:', this.productos[0].tipo);
        }
      },
      error: (error) => {
        console.error('❌ Error al cargar productos:', error);
        this.cargando = false;
        this.alertService.producto.loadError();
      }
    });
  }

  private construirFiltros(pagina: number = 0): FiltroProducto {
    let activoFiltro: boolean | undefined;
    
    if (this.estadoSeleccionado === 'ACTIVOS') {
      activoFiltro = true;
    } else if (this.estadoSeleccionado === 'INACTIVOS') {
      activoFiltro = false;
    } else {
      activoFiltro = undefined; // TODOS
    }
    
    return {
      busqueda: this.busqueda,
      tipo: this.tipoSeleccionado === '' ? undefined : this.tipoSeleccionado,
      activo: activoFiltro,
      page: pagina,
      size: this.tamanoPagina
    };
  }

  // ✅ Aplicar filtros
  aplicarFiltros() {
    this.cargando = true;
    const filtros = this.construirFiltros(0); // Siempre empezar en página 0

    this.productoService.obtenerProductosConFiltros(filtros).subscribe({
      next: (page) => {
        this.pageInfo = page;
        this.productos = page.content;
        this.paginaActual = page.number;
        this.cargando = false;
        console.log('✅ Filtros aplicados, productos cargados:', page.content.length);
      },
      error: (error) => {
        console.error('Error al filtrar productos:', error);
        this.cargando = false;
        this.alertService.producto.loadError();
      }
    });
  }

  // ✅ Métodos de filtros
  onBusquedaChange() {
    this.aplicarFiltros();
  }

  onTipoChange(tipo: string) {
    this.tipoSeleccionado = tipo as TipoProducto | '';
    this.aplicarFiltros();
  }

  onEstadoChange(estado: string) {
    console.log('🔍 Estado seleccionado:', estado);
    this.estadoSeleccionado = estado;
    this.aplicarFiltros();
  }

  // ✅ Paginación
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

  irAPagina(pagina: number) {
    if (pagina >= 0 && this.pageInfo && pagina < this.pageInfo.totalPages) {
      this.paginaActual = pagina;
      const filtros = this.construirFiltros(pagina); // Mantener filtros actuales

      this.cargando = true;
      this.productoService.obtenerProductosConFiltros(filtros).subscribe({
        next: (page) => {
          this.pageInfo = page;
          this.productos = page.content;
          this.paginaActual = page.number;
          this.cargando = false;
        },
        error: (error) => {
          console.error('Error al cambiar página:', error);
          this.cargando = false;
          this.alertService.producto.loadError();
        }
      });
    }
  }

  // ✅ Modal para crear/editar
  openNewProductModal(producto?: ProductoDTO) {
    const modalRef = this.modalService.open(ProductoModalComponent, {
      size: 'lg',
      backdrop: 'static'
    });

    if (producto) {
      modalRef.componentInstance.isEditMode = true;
      modalRef.componentInstance.productoData = { ...producto };
    } else {
      modalRef.componentInstance.isEditMode = false;
    }

    modalRef.result.then((result: ProductoDTO) => {
      console.log('Producto guardado:', result);
      
      if (producto && producto.id) {
        // Es edición
        this.actualizarProducto(producto.id, result);
      } else {
        // Es creación
        this.crearProducto(result);
      }
    }).catch((error) => {
      console.log('Modal cerrado sin guardar');
    });
  }

  // ✅ Crear producto
  crearProducto(productoData: ProductoDTO) {
    this.cargando = true;
    
    const productoDto: PostProductoDTO = {
      nombre: productoData.nombre,
      tipo: productoData.tipo,
      unidadMedida: productoData.unidadMedida,
      stockActual: productoData.stockActual,
      stockMinimo: productoData.stockMinimo,
      stockMaximo: productoData.stockMaximo,
      activo: productoData.activo,
      precio: productoData.precio
    };
    
    this.productoService.crearProducto(productoDto).subscribe({
      next: (productoCreado) => {
        console.log('✅ Producto creado exitosamente:', productoCreado);
        
        // ✅ NUEVO: Verificar stock bajo del producto recién creado
        this.verificarStockBajo(productoCreado);
        
        this.cargarProductosIniciales();
        this.alertService.producto.created();
      },
      error: (error) => {
        console.error('❌ Error al crear producto:', error);
        this.cargando = false;
        this.alertService.producto.createError();
      }
    });
  }

  // ✅ Actualizar producto
  actualizarProducto(id: number, productoData: ProductoDTO) {
    this.cargando = true;
    
    this.productoService.actualizarProducto(id, productoData).subscribe({
      next: (productoActualizado) => {
        console.log('✅ Producto actualizado exitosamente:', productoActualizado);
        
        // ✅ NUEVO: Verificar stock bajo después de actualizar
        this.verificarStockBajo(productoActualizado);
        
        this.aplicarFiltros(); // Recargar con filtros actuales
        this.alertService.producto.updated();
      },
      error: (error) => {
        console.error('❌ Error al actualizar producto:', error);
        this.cargando = false;
        this.alertService.producto.updateError();
      }
    });
  }

  // ✅ Eliminar producto
  eliminarProducto(producto: ProductoDTO) {
    this.alertService.producto.confirmDelete(producto.nombre).then((result) => {
      if (result.isConfirmed) {
        this.cargando = true;
        
        if (producto.id) {
          this.productoService.eliminarProducto(producto.id).subscribe({
            next: () => {
              console.log('✅ Producto eliminado exitosamente');
              
              this.aplicarFiltros(); // Recargar lista
              this.alertService.producto.deleted();
            },
            error: (error) => {
              console.error('❌ Error al eliminar producto:', error);
              this.cargando = false;
              this.alertService.producto.deleteError();
            }
          });
        } else {
          console.error('❌ No se puede eliminar: producto sin ID');
          this.cargando = false;
          this.alertService.showError('Error', 'Producto sin ID válido');
        }
      }
    });
  }

  // ✅ Clases para badges
  getBadgeClassTipo(tipo: TipoProducto): string {
    switch (tipo) {
      case TipoProducto.INSUMO: return 'badge badge-insumo'; 
      case TipoProducto.ACOMPAÑANTE: return 'badge badge-acompañante'; 
      case TipoProducto.BEBIDA: return 'badge badge-bebida';
      default: return 'badge badge-default';
    }
  }

  getBadgeClassEstado(activo: boolean): string {
    return activo ? 'badge badge-activo' : 'badge badge-baja';
  }

  // ✅ Helper para mostrar unidad de medida
  getUnidadMedidaCorta(unidad: string): string {
    switch (unidad) {
      case 'KILOGRAMO': return 'kg';
      case 'LITRO': return 'lt';
      case 'GRAMO': return 'g';
      case 'UNIDAD': return 'u';
      default: return unidad;
    }
  }

  // ✅ Helper para determinar color de stock
  getStockClass(producto: ProductoDTO): string {
    if (producto.stockActual <= producto.stockMinimo) {
      return 'text-danger'; // Rojo - stock bajo
    } else if (producto.stockActual >= producto.stockMaximo) {
      return 'text-warning'; // Amarillo - stock alto
    } else {
      return 'text-success'; // Verde - stock normal
    }
  }

  // ✅ Verificar stock bajo y emitir notificación
  verificarStockBajo(producto: ProductoDTO): void {
    if (producto.stockActual <= producto.stockMinimo) {
      const mensaje = `ALERTA: Stock bajo para el producto '${producto.nombre}'. Stock actual: ${producto.stockActual}, Stock mínimo: ${producto.stockMinimo}`;
      
      this.notificationService.addStockAlertNotification(mensaje, producto);
      
      console.log(`⚠️ ALERTA DE STOCK BAJO: ${producto.nombre}`);
    }
  }

  // ✅ Verificar stock bajo para todos los productos cargados
  verificarStockBajoTodos(): void {
    this.productos.forEach(producto => {
      this.verificarStockBajo(producto);
    });
  }

  // ✅ Método para probar la alerta de stock bajo (para testing)
  probarAlertaStockBajo(): void {
    this.notificationService.sendTestStockAlert();
    
    Swal.fire({
      title: 'Alerta de Prueba',
      text: 'Se ha enviado una alerta de stock bajo de prueba',
      icon: 'info',
      confirmButtonText: 'OK',
      confirmButtonColor: '#84C473'
    });
  }

  // 🔍 Método para depurar las propiedades de un producto
  debugProducto(producto: any): void {
    console.log('=== DEBUG PRODUCTO ===');
    console.log('Producto completo:', producto);
    console.log('Propiedades del producto:');
    Object.keys(producto).forEach(key => {
      console.log(`  ${key}:`, producto[key]);
    });
    console.log('tipo específicamente:', producto.tipo);
    console.log('=====================');
  }

  // ✅ Método para abrir el modal de reportes
  abrirReportes(): void {
    const modalRef = this.modalService.open(ReportesModalComponent, {
      size: 'xl',
      backdrop: 'static',
      centered: true
    });
    modalRef.componentInstance.show('stock');
    
    // Manejar el cierre del modal
    modalRef.result.then(() => {
      console.log('Modal de reportes cerrado');
    }).catch(() => {
      console.log('Modal de reportes cancelado');
    });
  }
}
