import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbDropdownModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PedidoService } from '../../../services/pedido.service';
import { AlertService } from '../../../services/alert.service';
import { AuthService } from '../../../services/auth.service';
import { Page } from '../../models/CommonModels';
import { GetPedidoDto, EstadoPedido, FiltrosPedido } from '../../models/PedidoModel';
import { PedidoModalComponent } from '../../modales/pedido-modal/pedido-modal.component';
import { ReportesModalComponent } from '../../modales/reportes-modal/reportes-modal.component';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbDropdownModule, ReportesModalComponent],
  templateUrl: './pedidos.component.html',
  styleUrl: './pedidos.component.css'
})
export class PedidosComponent implements OnInit {

  // ✅ Datos
  pedidos: GetPedidoDto[] = [];
  pageInfo: Page<GetPedidoDto> | null = null;
  total: number = 0.00;
  // ✅ Filtros
  busqueda: string = '';
  estadoSeleccionado: string = '';
  fechaDesde: string = '';
  fechaHasta: string = '';

  // ✅ Paginación
  paginaActual: number = 0;
  tamanoPagina: number = 10;

  // ✅ Loading
  cargando: boolean = false;

  // ✅ Modal de reportes
  @ViewChild('reportesModal') reportesModal!: ReportesModalComponent;

  get Math() {
    return Math;
  }

  constructor(
    private modalService: NgbModal,
    private pedidoService: PedidoService,
    private authService: AuthService,
    private alertService: AlertService
  ) { }

  ngOnInit() {
    this.cargarPedidos();
    console.log('Componente de pedidos inicializado');
  }

  cargarPedidos(): void {
    this.cargando = true;

    const filtros: FiltrosPedido = {
      buscarFiltro: this.busqueda || undefined,
      estado: this.estadoSeleccionado !== 'TODOS' ? this.estadoSeleccionado : undefined,
      fechaDesde: this.fechaDesde || undefined,
      fechaHasta: this.fechaHasta || undefined
    };

    this.pedidoService.listarPedidos(this.paginaActual, this.tamanoPagina, filtros).subscribe({
      next: (response) => {
        this.pedidos = response.content;
        this.pageInfo = response;
        this.cargando = false;

        // ✅ El backend ya calcula el total excluyendo items cancelados
        // Ya no necesitamos calcularlo aquí manualmente

        console.log('✅ Pedidos cargados:', this.pedidos);
      },
      error: (error) => {
        console.error('❌ Error cargando pedidos:', error);
        this.alertService.showError('Error', 'No se pudieron cargar los pedidos');
        this.cargando = false;
      }
    });
  }

  aplicarFiltros(): void {
    this.paginaActual = 0;
    this.cargarPedidos();
  }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.estadoSeleccionado = 'TODOS';
    this.fechaDesde = '';
    this.fechaHasta = '';
    this.aplicarFiltros();
  }

  // ✅ Métodos de filtros (stubs)
  onBusquedaChange() {
    this.aplicarFiltros();
  }

  onEstadoChange(estado: string) {
    this.estadoSeleccionado = estado;
    this.aplicarFiltros();
  }

  onFechaChange() {
    this.aplicarFiltros();
  }

  formatearFecha(fechaHora: number[] | string): string {
    if (Array.isArray(fechaHora)) {
      const [year, month, day, hour, minute] = fechaHora;

      const fecha = new Date(year, month - 1, day, hour, minute);

      const dd = String(fecha.getDate()).padStart(2, '0');
      const mm = String(fecha.getMonth() + 1).padStart(2, '0');
      const yyyy = fecha.getFullYear();
      const hh = String(fecha.getHours()).padStart(2, '0');
      const min = String(fecha.getMinutes()).padStart(2, '0');

      return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
    }
    return fechaHora;
  }

  // ✅ Métodos de acciones (stubs)
  abrirNuevoPedido(pedido?: GetPedidoDto): void {
    const modalRef = this.modalService.open(PedidoModalComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false
    });

    // Si viene un pedido, es modo edición (agregar items)
    if (pedido) {
      modalRef.componentInstance.isEditMode = true;
      modalRef.componentInstance.pedidoData = pedido;
    } else {
      modalRef.componentInstance.isEditMode = false;
      modalRef.componentInstance.pedidoData = null;
    }

    modalRef.result.then(
      (result) => {
        if (result && result.accion === 'crear') {
          // El modal YA creó el pedido, solo actualizar la lista
          console.log('✅ Pedido creado en el modal:', result.pedido);
          this.alertService.showSuccess('Éxito', 'Pedido creado correctamente');
          this.cargarPedidos(); // Recargar la lista
        } else if (result && result.accion === 'actualizado') {
          // El modal YA actualizó el pedido
          console.log('✅ Pedido actualizado en el modal:', result.pedido);
          this.alertService.showSuccess('Éxito', 'Pedido actualizado correctamente');
          this.cargarPedidos(); // Recargar la lista
        } else if (result && result.accion === 'agregar') {
          // Agregar items a pedido existente (legacy - ya no se usa)
          console.log('Agregar items:', result.pedido);
          this.agregarItemsAPedido(pedido!.idPedido, result.pedido);
        }
      },
      (reason) => {
        console.log('Modal cerrado:', reason);
      }
    );
  }

  crearPedido(pedidoDTO: any): void {
    this.pedidoService.crearPedido(pedidoDTO).subscribe({
      next: (response) => {
        console.log('✅ Pedido creado:', response);
        this.alertService.showSuccess('Éxito', 'Pedido creado correctamente');
        this.cargarPedidos(); // Recargar la lista
      },
      error: (error) => {
        console.error('❌ Error creando pedido:', error);

        // ✅ Extraer el mensaje específico del backend
        let mensajeError = 'No se pudo crear el pedido';

        if (error.error && error.error.message) {
          // El backend devuelve: "Error interno del servidor: Stock insuficiente"
          mensajeError = error.error.message;

          // ✅ Quitar el prefijo "Error interno del servidor: "
          mensajeError = mensajeError.replace('Error interno del servidor: ', '');
        } else if (error.message) {
          mensajeError = error.message;
        }

        // Mostrar el error específico
        this.alertService.showError('Error al crear pedido', mensajeError);
      }
    });
  }

  agregarItemsAPedido(idPedido: number, pedidoDTO: any): void {
    console.log('📝 Agregando items al pedido:', idPedido, pedidoDTO);

    this.pedidoService.actualizarPedido(idPedido, pedidoDTO).subscribe({
      next: (response) => {
        console.log('✅ Items agregados:', response);
        this.alertService.showSuccess('Éxito', 'Items agregados correctamente al pedido');
        this.cargarPedidos();
      },
      error: (error) => {
        console.error('❌ Error agregando items:', error);

        let mensajeError = 'No se pudieron agregar los items';
        if (error.error && error.error.message) {
          mensajeError = error.error.message.replace('Error interno del servidor: ', '');
        }

        this.alertService.showError('Error', mensajeError);
      }
    });
  }

  verPedido(pedido: GetPedidoDto): void {
    console.log('Ver pedido:', pedido);

    const modalRef = this.modalService.open(PedidoModalComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false
    });

    // Configurar modal en modo solo lectura
    modalRef.componentInstance.isEditMode = false;
    modalRef.componentInstance.pedidoData = pedido;
    modalRef.componentInstance.soloLectura = true; // ✅ Modo visualización

    modalRef.result.then(
      (result) => {
        console.log('Modal de visualización cerrado');
      },
      (reason) => {
        console.log('Modal cerrado:', reason);
      }
    );
  }

  cancelarPedido(pedido: GetPedidoDto): void {
    this.alertService.showConfirmation(
      'Cancelar Pedido',
      `¿Está seguro que desea cancelar el pedido de la mesa ${pedido.numeroMesa}?`
    ).then((confirmado) => {
      if (confirmado) {
        this.pedidoService.cancelarPedido(pedido.idPedido).subscribe({
          next: (response) => {
            console.log('✅ Pedido cancelado:', response);
            this.alertService.showSuccess('Éxito', 'Pedido cancelado correctamente');
            this.cargarPedidos();
          },
          error: (error) => {
            console.error('❌ Error cancelando pedido:', error);

            let mensajeError = 'No se pudo cancelar el pedido';
            if (error.error && error.error.message) {
              mensajeError = error.error.message.replace('Error interno del servidor: ', '');
            }

            this.alertService.showError('Error', mensajeError);
          }
        });
      }
    });
  }

  getEstadoBadgeClass(estado: string): string {
    const clases: { [key: string]: string } = {
      'ORDENADO': 'badge-warning',
      'EN_PROCESO': 'badge-info',
      'LISTO_PARA_ENTREGAR': 'badge-primary',
      'ENTREGADO': 'badge-success',
      'FINALIZADO': 'badge-secondary',
      'CANCELADO': 'badge-danger'
    };
    return clases[estado] || 'badge-secondary';
  }

  getEstadoTexto(estado: string): string {
    const textos: { [key: string]: string } = {
      'ORDENADO': 'Ordenado',
      'EN_PROCESO': 'En Proceso',
      'LISTO_PARA_ENTREGAR': 'Listo',
      'ENTREGADO': 'Entregado',
      'FINALIZADO': 'Finalizado',
      'CANCELADO': 'Cancelado'
    };
    return textos[estado] || estado;
  }

  cambiarEstadoPedido(pedido: GetPedidoDto, accion: string): void {
    let mensajeConfirmacion = '';
    let observable: Observable<GetPedidoDto> | null = null;

    switch (accion) {
      case 'iniciar':
        mensajeConfirmacion = `¿Iniciar el pedido de la mesa NRO: ${pedido.numeroMesa}?`;
        observable = this.pedidoService.iniciarPedido(pedido.idPedido);
        break;

      case 'listo':
        mensajeConfirmacion = `¿Marcar el pedido de la mesa NRO: ${pedido.numeroMesa} como listo para entregar?`;
        observable = this.pedidoService.marcarListoParaEntregar(pedido.idPedido);
        break;

      case 'entregar':
        mensajeConfirmacion = `¿Entregar el pedido de la mesa NRO: ${pedido.numeroMesa}?`;
        observable = this.pedidoService.entregarDetalles(pedido.idPedido);
        break;

      case 'finalizar':
        mensajeConfirmacion = `¿Finalizar el pedido de la mesa NRO: ${pedido.numeroMesa}?`;
        observable = this.pedidoService.finalizarPedido(pedido.idPedido);
        break;

      default:
        console.error('Acción no válida:', accion);
        return;
    }

    // Confirmar acción
    this.alertService.showConfirmation(
      'Confirmar acción',
      mensajeConfirmacion
    ).then((confirmado) => {
      if (confirmado && observable) {
        observable.subscribe({
          next: (response) => {
            console.log('✅ Estado actualizado:', response);
            this.alertService.showSuccess('Éxito', 'Estado actualizado correctamente');
            this.cargarPedidos(); // Recargar lista
          },
          error: (error) => {
            console.error('❌ Error actualizando estado:', error);

            let mensajeError = 'No se pudo actualizar el estado';
            if (error.error && error.error.message) {
              mensajeError = error.error.message.replace('Error interno del servidor: ', '');
            }

            this.alertService.showError('Error', mensajeError);
          }
        });
      }
    });
  }

  irAPagina(pagina: number) {
    if (pagina >= 0 && this.pageInfo && pagina < this.pageInfo.totalPages) {
      this.paginaActual = pagina;
      this.cargarPedidos();
    }
  }

  obtenerPaginasVisibles(): (number | null)[] {
    if (!this.pageInfo) {
      return [];
    }

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

  todosLosDetallesEntregados(pedido: GetPedidoDto): boolean {
    if (!pedido.detalles || pedido.detalles.length === 0) {
      return false;
    }

    // ✅ Filtrar solo los items que NO están cancelados
    const itemsActivos = pedido.detalles.filter(d => d.estado !== 'CANCELADO');
    if (itemsActivos.length === 0) {
      return false;
    }

    return itemsActivos.every(detalle => detalle.estado === 'ENTREGADO');
  }

    todosLosDetallesParaEntregar(pedido: GetPedidoDto): boolean {
    if (!pedido.detalles || pedido.detalles.length === 0) {
      return false;
    }

    return pedido.detalles.every(detalle => detalle.estado === 'LISTO_PARA_ENTREGAR' || detalle.estado === 'ENTREGADO');
  }

  // Método para abrir el modal de reportes
  abrirReportes() {
    this.reportesModal.show('pedidos');
  }

}