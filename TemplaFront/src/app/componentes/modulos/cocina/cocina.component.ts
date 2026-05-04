import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GetPedidoDto, GetPedidoDetalleDto, EstadoPedido, EstadoPedidoDetalle } from '../../models/PedidoModel';
import { CocinaService } from '../../../services/cocina.service';
import { AlertService } from '../../../services/alert.service';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

// Interfaz para agrupar pedidos por estado de detalles
interface PedidoPorEstado {
  pedidoOriginal: GetPedidoDto;
  estadoDetalle: EstadoPedidoDetalle;
  detalles: GetPedidoDetalleDto[];
  cantidadItems: number;
}

@Component({
  selector: 'app-cocina',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cocina.component.html',
  styleUrl: './cocina.component.css'
})
export class CocinaComponent implements OnInit, OnDestroy {
  pedidos: GetPedidoDto[] = [];
  pedidosFiltrados: GetPedidoDto[] = [];
  pedidosAgrupados: PedidoPorEstado[] = [];
  isLoading = false;
  
  // Referencias a los enums para usar en el template
  EstadoPedido = EstadoPedido;
  EstadoPedidoDetalle = EstadoPedidoDetalle;

  private subscriptions: Subscription[] = [];

  constructor(
    private cocinaService: CocinaService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    this.cargarPedidos();
    this.configurarActualizacionTiempoReal();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.cocinaService.desconectar();
  }

  cargarPedidos() {
    this.isLoading = true;
    this.cocinaService.obtenerPedidosCocina().subscribe({
      next: (pedidos: GetPedidoDto[]) => {
        this.pedidos = pedidos;
        this.aplicarFiltros();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error al cargar pedidos:', error);
        this.alertService.showError('Error al cargar los pedidos de cocina', 'Error');
        this.isLoading = false;
      }
    });
  }

  configurarActualizacionTiempoReal() {
    // Suscribirse a nuevos pedidos
    const nuevoPedidoSub = this.cocinaService.onNuevoPedido().subscribe((pedido: GetPedidoDto) => {
      console.log('🍽️ Nuevo pedido recibido en cocina:', pedido);
      // Solo agregar si no es un pedido entregado o finalizado
      if (pedido.estado !== EstadoPedido.ENTREGADO && pedido.estado !== EstadoPedido.FINALIZADO) {
        this.pedidos.unshift(pedido);
        this.aplicarFiltros();
        this.mostrarNotificacionNuevoPedido(pedido);
      }
    });

    // Suscribirse a actualizaciones de pedidos
    const actualizacionSub = this.cocinaService.onActualizacionPedido().subscribe((pedidoActualizado: GetPedidoDto) => {
      console.log('🔄 Pedido actualizado:', pedidoActualizado);
      const index = this.pedidos.findIndex(p => p.idPedido === pedidoActualizado.idPedido);
      
      // Si el pedido está entregado o finalizado, eliminarlo de la lista
      if (pedidoActualizado.estado === EstadoPedido.ENTREGADO || 
          pedidoActualizado.estado === EstadoPedido.FINALIZADO) {
        if (index !== -1) {
          console.log('🗑️ Eliminando pedido entregado/finalizado:', pedidoActualizado.idPedido);
          this.pedidos = this.pedidos.filter(p => p.idPedido !== pedidoActualizado.idPedido);
        }
      } else if (index !== -1) {
        // Actualizar el pedido si aún debe estar en cocina
        this.pedidos[index] = pedidoActualizado;
      }
      
      this.aplicarFiltros();
    });

    this.subscriptions.push(nuevoPedidoSub, actualizacionSub);
  }

  aplicarFiltros() {
    this.pedidosFiltrados = this.pedidos.filter(pedido => {
      // Solo mostrar pedidos que necesitan atención en cocina
      // Excluir explícitamente pedidos ENTREGADOS y FINALIZADOS
      return pedido.estado === EstadoPedido.ORDENADO || 
             pedido.estado === EstadoPedido.EN_PROCESO ||
             pedido.estado === EstadoPedido.LISTO_PARA_ENTREGAR;
    });
    
    // Agrupar pedidos por estado de detalles
    this.pedidosAgrupados = this.agruparPedidosPorEstadoDetalle(this.pedidosFiltrados);
  }

  agruparPedidosPorEstadoDetalle(pedidos: GetPedidoDto[]): PedidoPorEstado[] {
    const pedidosAgrupados: PedidoPorEstado[] = [];
    
    pedidos.forEach(pedido => {
      // Agrupar los detalles por estado, excluyendo estados finalizados
      const detallesPorEstado = new Map<EstadoPedidoDetalle, GetPedidoDetalleDto[]>();
      
      pedido.detalles.forEach(detalle => {
        // ✅ Solo procesar items que aún necesitan atención en cocina
        if (detalle.estado !== EstadoPedidoDetalle.ENTREGADO && 
            detalle.estado !== EstadoPedidoDetalle.CANCELADO) {
          if (!detallesPorEstado.has(detalle.estado)) {
            detallesPorEstado.set(detalle.estado, []);
          }
          detallesPorEstado.get(detalle.estado)!.push(detalle);
        }
      });
      
      // Crear una entrada por cada estado que tenga items activos
      detallesPorEstado.forEach((detalles, estado) => {
        const cantidadItems = detalles.reduce((sum, detalle) => sum + detalle.cantidad, 0);
        
        pedidosAgrupados.push({
          pedidoOriginal: pedido,
          estadoDetalle: estado,
          detalles: detalles,
          cantidadItems: cantidadItems
        });
      });
    });
    
    // Ordenar por ID de pedido y luego por prioridad de estado
    return pedidosAgrupados.sort((a, b) => {
      if (a.pedidoOriginal.idPedido !== b.pedidoOriginal.idPedido) {
        return a.pedidoOriginal.idPedido - b.pedidoOriginal.idPedido;
      }
      
      // Orden de prioridad de estados en cocina
      const prioridadEstados = {
        [EstadoPedidoDetalle.PENDIENTE]: 1,
        [EstadoPedidoDetalle.EN_PREPARACION]: 2,
        [EstadoPedidoDetalle.LISTO_PARA_ENTREGAR]: 3,
        [EstadoPedidoDetalle.ENTREGADO]: 4,
        [EstadoPedidoDetalle.CANCELADO]: 5
      };
      
      return prioridadEstados[a.estadoDetalle] - prioridadEstados[b.estadoDetalle];
    });
  }

  cambiarEstadoPedido(pedido: GetPedidoDto, nuevoEstado: EstadoPedido) {
    // Si el estado es LISTO_PARA_ENTREGAR, mostrar mensaje especial
    let tituloConfirmacion = '¿Confirmar cambio de estado?';
    let textoConfirmacion = `¿Cambiar pedido ${pedido.idPedido} a ${nuevoEstado}?`;
    
    if (nuevoEstado === EstadoPedido.LISTO_PARA_ENTREGAR) {
      tituloConfirmacion = '¿Pedido listo para entregar?';
      textoConfirmacion = `El pedido ${pedido.idPedido} será marcado como listo y automáticamente entregado. Desaparecerá de la pantalla de cocina.`;
    }

    Swal.fire({
      title: tituloConfirmacion,
      text: textoConfirmacion,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745'
    }).then((result) => {
      if (result.isConfirmed) {
        // Si es LISTO_PARA_ENTREGAR, hacer la secuencia completa
        if (nuevoEstado === EstadoPedido.LISTO_PARA_ENTREGAR) {
          this.procesarPedidoListoYEntregar(pedido);
        } else {
          // Para otros estados, comportamiento normal
          this.actualizarEstadoPedido(pedido, nuevoEstado);
        }
      }
    });
  }

  private procesarPedidoListoYEntregar(pedido: GetPedidoDto) {
    // Paso 1: Marcar como LISTO_PARA_ENTREGAR
    this.cocinaService.actualizarEstadoPedido(pedido.idPedido, EstadoPedido.LISTO_PARA_ENTREGAR).subscribe({
      next: (pedidoListo: GetPedidoDto) => {
        console.log('✅ Pedido marcado como listo:', pedidoListo);
        
        // Paso 2: Después de un pequeño delay, marcar como ENTREGADO
        setTimeout(() => {
          this.cocinaService.actualizarEstadoPedido(pedido.idPedido, EstadoPedido.ENTREGADO).subscribe({
            next: (pedidoEntregado: GetPedidoDto) => {
              console.log('📦 Pedido marcado como entregado:', pedidoEntregado);
              
              // Remover el pedido de la lista (desaparece de cocina)
              this.pedidos = this.pedidos.filter(p => p.idPedido !== pedido.idPedido);
              this.aplicarFiltros();
              
              this.alertService.showSuccess(`Pedido #${pedido.idPedido} entregado correctamente`, 'Pedido Completado');
            },
            error: (error: any) => {
              console.error('Error al marcar como entregado:', error);
              this.alertService.showError('Error al completar la entrega del pedido', 'Error');
            }
          });
        }, 1000); // 1 segundo de delay para mostrar el cambio
      },
      error: (error: any) => {
        console.error('Error al marcar como listo:', error);
        this.alertService.showError('Error al marcar el pedido como listo', 'Error');
      }
    });
  }

  private actualizarEstadoPedido(pedido: GetPedidoDto, nuevoEstado: EstadoPedido) {
    this.cocinaService.actualizarEstadoPedido(pedido.idPedido, nuevoEstado).subscribe({
      next: (pedidoActualizado: GetPedidoDto) => {
        const index = this.pedidos.findIndex(p => p.idPedido === pedido.idPedido);
        if (index !== -1) {
          // Si el nuevo estado es ENTREGADO o FINALIZADO, remover de la lista
          if (nuevoEstado === EstadoPedido.ENTREGADO || nuevoEstado === EstadoPedido.FINALIZADO) {
            this.pedidos = this.pedidos.filter(p => p.idPedido !== pedido.idPedido);
          } else {
            this.pedidos[index] = pedidoActualizado;
          }
          this.aplicarFiltros();
        }
        this.alertService.showSuccess('Estado del pedido actualizado correctamente', 'Éxito');
      },
      error: (error: any) => {
        console.error('Error al actualizar estado:', error);
        this.alertService.showError('Error al actualizar el estado del pedido', 'Error');
      }
    });
  }

  cambiarEstadoDetalle(pedido: GetPedidoDto, detalle: GetPedidoDetalleDto, nuevoEstado: EstadoPedidoDetalle) {
    console.log(`🔄 Cambiando estado de detalle: ${detalle.estado} -> ${nuevoEstado}`);
    
    // Determinar qué método del servicio llamar según el nuevo estado
    let observable;
    
    switch (nuevoEstado) {
      case EstadoPedidoDetalle.EN_PREPARACION:
        // Cambiar todos los detalles PENDIENTES a EN_PREPARACION
        observable = this.cocinaService.actualizarEstadoPedido(pedido.idPedido, EstadoPedido.EN_PROCESO);
        break;
        
      case EstadoPedidoDetalle.LISTO_PARA_ENTREGAR:
        // Cambiar todos los detalles EN_PREPARACION a LISTO_PARA_ENTREGAR
        observable = this.cocinaService.actualizarEstadoPedido(pedido.idPedido, EstadoPedido.LISTO_PARA_ENTREGAR);
        break;
        
      case EstadoPedidoDetalle.ENTREGADO:
        // Cambiar todos los detalles LISTO_PARA_ENTREGAR a ENTREGADO
        observable = this.cocinaService.actualizarEstadoPedido(pedido.idPedido, EstadoPedido.ENTREGADO);
        break;
        
      case EstadoPedidoDetalle.CANCELADO:
        // Cancelar detalles pendientes
        observable = this.cocinaService.actualizarEstadoPedido(pedido.idPedido, EstadoPedido.CANCELADO);
        break;
        
      default:
        console.warn(`Estado ${nuevoEstado} no manejado`);
        return;
    }
    
    observable.subscribe({
      next: (pedidoActualizado: GetPedidoDto) => {
        console.log('✅ Pedido actualizado:', pedidoActualizado);
        
        // Actualizar el pedido en la lista local
        const index = this.pedidos.findIndex(p => p.idPedido === pedido.idPedido);
        if (index !== -1) {
          this.pedidos[index] = pedidoActualizado;
          this.aplicarFiltros();
        }
        
        this.alertService.showSuccess(
          `Items actualizados a ${this.formatearEstadoDetalle(nuevoEstado)}`, 
          'Estado Actualizado'
        );
      },
      error: (error: any) => {
        console.error('Error al actualizar estado del detalle:', error);
        this.alertService.showError('Error al actualizar el estado del item', 'Error');
      }
    });
  }

  obtenerColorEstado(estado: string): string {
    // Usar los mismos colores que el componente de pedidos
    switch (estado) {
      case EstadoPedido.ORDENADO:
        return '#856404'; // warning text color
      case EstadoPedido.EN_PROCESO:
        return '#0c5460'; // info text color
      case EstadoPedido.LISTO_PARA_ENTREGAR:
        return '#004085'; // primary text color
      case EstadoPedido.ENTREGADO:
        return '#155724'; // success text color
      case EstadoPedido.FINALIZADO:
        return '#155724'; // success text color
      case EstadoPedido.CANCELADO:
        return '#721c24'; // danger text color
      default:
        return '#383d41'; // secondary text color
    }
  }

  obtenerColorFondoEstado(estado: string): string {
    // Usar los mismos colores de fondo que el componente de pedidos
    switch (estado) {
      case EstadoPedido.ORDENADO:
        return '#fff3cd'; // warning background
      case EstadoPedido.EN_PROCESO:
        return '#d1ecf1'; // info background
      case EstadoPedido.LISTO_PARA_ENTREGAR:
        return '#cce7ff'; // primary background
      case EstadoPedido.ENTREGADO:
        return '#d4edda'; // success background
      case EstadoPedido.FINALIZADO:
        return '#d4edda'; // success background
      case EstadoPedido.CANCELADO:
        return '#f8d7da'; // danger background
      default:
        return '#e2e3e5'; // secondary background
    }
  }

  obtenerColorEstadoDetalle(estado: EstadoPedidoDetalle): string {
    switch (estado) {
      case EstadoPedidoDetalle.PENDIENTE:
        return '#856404'; // warning text color
      case EstadoPedidoDetalle.EN_PREPARACION:
        return '#0c5460'; // info text color
      case EstadoPedidoDetalle.LISTO_PARA_ENTREGAR:
        return '#004085'; // primary text color
      case EstadoPedidoDetalle.ENTREGADO:
        return '#155724'; // success text color
      case EstadoPedidoDetalle.CANCELADO:
        return '#721c24'; // danger text color
      default:
        return '#383d41'; // secondary text color
    }
  }

  obtenerColorFondoEstadoDetalle(estado: EstadoPedidoDetalle): string {
    switch (estado) {
      case EstadoPedidoDetalle.PENDIENTE:
        return '#fff3cd'; // warning background
      case EstadoPedidoDetalle.EN_PREPARACION:
        return '#d1ecf1'; // info background
      case EstadoPedidoDetalle.LISTO_PARA_ENTREGAR:
        return '#cce7ff'; // primary background
      case EstadoPedidoDetalle.ENTREGADO:
        return '#d4edda'; // success background
      case EstadoPedidoDetalle.CANCELADO:
        return '#f8d7da'; // danger background
      default:
        return '#e2e3e5'; // secondary background
    }
  }

  formatearFecha(fecha: number[] | string): string {
    if (Array.isArray(fecha)) {
      // Si es array [año, mes, día, hora, minuto, segundo]
      const fechaObj = new Date(fecha[0], fecha[1] - 1, fecha[2], fecha[3], fecha[4], fecha[5]);
      return fechaObj.toLocaleString('es-ES');
    } else {
      // Si es string
      return new Date(fecha).toLocaleString('es-ES');
    }
  }

  private mostrarNotificacionNuevoPedido(pedido: GetPedidoDto) {
    // Notificación de sonido (opcional)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Nuevo Pedido en Cocina', {
        body: `Pedido #${pedido.idPedido} - Mesa ${pedido.numeroMesa}`,
        icon: 'assets/iconos/cocina.png'
      });
    }
  }



  getPosiblesEstados(estadoActual: EstadoPedido): EstadoPedido[] {
    switch (estadoActual) {
      case EstadoPedido.ORDENADO:
        return [EstadoPedido.EN_PROCESO, EstadoPedido.CANCELADO];
      case EstadoPedido.EN_PROCESO:
        return [EstadoPedido.LISTO_PARA_ENTREGAR, EstadoPedido.CANCELADO];
      case EstadoPedido.LISTO_PARA_ENTREGAR:
        // No mostrar botones para LISTO_PARA_ENTREGAR ya que se auto-procesa
        return [];
      default:
        return [];
    }
  }

  getPosiblesEstadosDetalle(estadoActual: EstadoPedidoDetalle): EstadoPedidoDetalle[] {
    switch (estadoActual) {
      case EstadoPedidoDetalle.PENDIENTE:
        return [EstadoPedidoDetalle.EN_PREPARACION, EstadoPedidoDetalle.CANCELADO];
      case EstadoPedidoDetalle.EN_PREPARACION:
        return [EstadoPedidoDetalle.LISTO_PARA_ENTREGAR, EstadoPedidoDetalle.CANCELADO];
      case EstadoPedidoDetalle.LISTO_PARA_ENTREGAR:
        return [EstadoPedidoDetalle.ENTREGADO];
      default:
        return [];
    }
  }

  // Función trackBy para optimizar el renderizado
  trackByPedidoId(index: number, pedido: GetPedidoDto): number {
    return pedido.idPedido;
  }

  // Función trackBy para pedidos agrupados
  trackByPedidoAgrupado(index: number, pedidoAgrupado: PedidoPorEstado): string {
    return `${pedidoAgrupado.pedidoOriginal.idPedido}-${pedidoAgrupado.estadoDetalle}`;
  }

  // ✅ Función para formatear estados sin guiones bajos
  formatearEstado(estado: string): string {
    return estado.replace(/_/g, ' ');
  }

  // ✅ Función para formatear estados de detalles sin guiones bajos
  formatearEstadoDetalle(estado: EstadoPedidoDetalle): string {
    return estado.replace(/_/g, ' ');
  }

  // Métodos para los botones de acción simplificados
  iniciarPreparacion(pedido: GetPedidoDto) {
    Swal.fire({
      title: '¿Iniciar preparación?',
      text: `¿Comenzar a cocinar el pedido de la Mesa ${pedido.numeroMesa}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, cocinar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745'
    }).then((result) => {
      if (result.isConfirmed) {
        this.actualizarEstadoPedido(pedido, EstadoPedido.EN_PROCESO);
      }
    });
  }

  // ✅ Iniciar preparación de items específicos de un pedido agrupado
  iniciarPreparacionItems(pedidoAgrupado: PedidoPorEstado) {
    const pedido = pedidoAgrupado.pedidoOriginal;
    const cantidadItems = pedidoAgrupado.cantidadItems;
    
    Swal.fire({
      title: '¿Iniciar preparación?',
      text: `¿Comenzar a cocinar ${cantidadItems} item(s) del pedido de la Mesa ${pedido.numeroMesa}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, cocinar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745'
    }).then((result) => {
      if (result.isConfirmed) {
        // Cambiar estado del pedido a EN_PROCESO, lo cual cambiará todos los detalles PENDIENTES a EN_PREPARACION
        this.actualizarEstadoPedido(pedido, EstadoPedido.EN_PROCESO);
      }
    });
  }

  marcarComoListo(pedido: GetPedidoDto) {
    Swal.fire({
      title: '¿Pedido listo?',
      text: `¿El pedido de la Mesa ${pedido.numeroMesa} está listo para entregar?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, está listo',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#007bff'
    }).then((result) => {
      if (result.isConfirmed) {
        this.procesarPedidoListoYEntregar(pedido);
      }
    });
  }

  // Métodos auxiliares para el template
  getPosiblesEstadosString(estado: string): EstadoPedido[] {
    return this.getPosiblesEstados(estado as EstadoPedido);
  }

  getPosiblesEstadosDetalleString(estado: EstadoPedidoDetalle): EstadoPedidoDetalle[] {
    return this.getPosiblesEstadosDetalle(estado);
  }

  // Métodos para obtener clases CSS de badges (iguales que PedidoService)
  obtenerClaseBadgeEstado(estado: string): string {
    switch (estado) {
      case EstadoPedido.ORDENADO:
        return 'badge-warning';
      case EstadoPedido.EN_PROCESO:
        return 'badge-info';
      case EstadoPedido.LISTO_PARA_ENTREGAR:
        return 'badge-primary';
      case EstadoPedido.ENTREGADO:
        return 'badge-success';
      case EstadoPedido.FINALIZADO:
        return 'badge-success';
      case EstadoPedido.CANCELADO:
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  }

  obtenerClaseBadgeEstadoDetalle(estado: EstadoPedidoDetalle): string {
    switch (estado) {
      case EstadoPedidoDetalle.PENDIENTE:
        return 'badge-warning';
      case EstadoPedidoDetalle.EN_PREPARACION:
        return 'badge-info';
      case EstadoPedidoDetalle.LISTO_PARA_ENTREGAR:
        return 'badge-primary';
      case EstadoPedidoDetalle.ENTREGADO:
        return 'badge-success';
      case EstadoPedidoDetalle.CANCELADO:
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  }

  // Función auxiliar para obtener el total de items de un pedido
  obtenerTotalItemsPedido(pedido: GetPedidoDto): number {
    return pedido.detalles.reduce((total, detalle) => total + detalle.cantidad, 0);
  }

  // Función auxiliar para verificar si hay más cards del mismo pedido
  esMismoPedidoSiguiente(index: number): boolean {
    if (index >= this.pedidosAgrupados.length - 1) return false;
    return this.pedidosAgrupados[index].pedidoOriginal.idPedido === 
           this.pedidosAgrupados[index + 1].pedidoOriginal.idPedido;
  }

  // ✅ Marcar todos los items en preparación como listos para entregar
  marcarItemsListosParaEntregar(pedidoAgrupado: PedidoPorEstado) {
    const pedido = pedidoAgrupado.pedidoOriginal;
    const cantidadItems = pedidoAgrupado.cantidadItems;
    
    Swal.fire({
      title: '¿Marcar como listo?',
      text: `¿Marcar ${cantidadItems} item(s) del pedido de la Mesa ${pedido.numeroMesa} como listos para entregar?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, listo',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#007bff'
    }).then((result) => {
      if (result.isConfirmed) {
        // Marcar como LISTO_PARA_ENTREGAR (el pedido se mantiene visible en cocina)
        this.cocinaService.actualizarEstadoPedido(pedido.idPedido, EstadoPedido.LISTO_PARA_ENTREGAR).subscribe({
          next: (pedidoListo: GetPedidoDto) => {
            console.log('✅ Items marcados como listos:', pedidoListo);
            
            // Actualizar el pedido en la lista local
            const index = this.pedidos.findIndex(p => p.idPedido === pedido.idPedido);
            if (index !== -1) {
              this.pedidos[index] = pedidoListo;
              this.aplicarFiltros();
            }
            
            this.alertService.showSuccess(`Pedido #${pedido.idPedido} marcado como listo para entregar`, 'Pedido Listo');
          },
          error: (error: any) => {
            console.error('Error al marcar como listo:', error);
            this.alertService.showError('Error al marcar el pedido como listo', 'Error');
          }
        });
      }
    });
  }

  // ✅ Marcar todos los items listos para entregar como entregados
  marcarItemsEntregados(pedidoAgrupado: PedidoPorEstado) {
    const pedido = pedidoAgrupado.pedidoOriginal;
    const cantidadItems = pedidoAgrupado.cantidadItems;
    
    Swal.fire({
      title: '¿Pedido entregado?',
      text: `¿Confirmar que ${cantidadItems} item(s) del pedido de la Mesa ${pedido.numeroMesa} fueron entregados? El pedido desaparecerá de la cocina.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, entregado',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745'
    }).then((result) => {
      if (result.isConfirmed) {
        // Cambiar estado de todos los items listos a ENTREGADO
        let itemsActualizados = 0;
        const totalItems = pedidoAgrupado.detalles.length;
        
        pedidoAgrupado.detalles.forEach(detalle => {
          if (detalle.estado === EstadoPedidoDetalle.LISTO_PARA_ENTREGAR) {
            this.cocinaService.actualizarEstadoDetalle(detalle.idPedidoDetalle, EstadoPedidoDetalle.ENTREGADO).subscribe({
              next: () => {
                detalle.estado = EstadoPedidoDetalle.ENTREGADO;
                itemsActualizados++;
                
                // Cuando todos los items se actualizaron, verificar si el pedido completo está entregado
                if (itemsActualizados === totalItems) {
                  // Verificar si todos los detalles del pedido están entregados
                  const todosEntregados = pedido.detalles.every(d => 
                    d.estado === EstadoPedidoDetalle.ENTREGADO || 
                    d.estado === EstadoPedidoDetalle.CANCELADO
                  );
                  
                  if (todosEntregados) {
                    // Remover el pedido de la lista
                    this.pedidos = this.pedidos.filter(p => p.idPedido !== pedido.idPedido);
                  }
                  
                  this.aplicarFiltros();
                  this.alertService.showSuccess(`Items del pedido #${pedido.idPedido} marcados como entregados`, 'Pedido Entregado');
                }
              },
              error: (error: any) => {
                console.error('Error al marcar item como entregado:', error);
                this.alertService.showError('Error al marcar items como entregados', 'Error');
              }
            });
          }
        });
      }
    });
  }
}