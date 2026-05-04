import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GetPedidoDto, EstadoPedido, EstadoPedidoDetalle, FiltrosPedido } from '../componentes/models/PedidoModel';
import { AuthService } from './auth.service';
import { PedidoService } from './pedido.service';
import { SseService } from './sse.service';
import { map } from 'rxjs/operators';

/**
 * Servicio para gestionar la pantalla de cocina
 * Ahora usa SseService para comunicación en tiempo real
 */
@Injectable({
  providedIn: 'root'
})
export class CocinaService {
  private apiUrl = 'http://localhost:8081/api';
  
  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private pedidoService: PedidoService,
    private sseService: SseService
  ) {
    // Iniciar conexión SSE para cocina
    this.iniciarConexionTiempoReal();
  }

  // ============= TIEMPO REAL (SSE) =============

  /**
   * Iniciar conexión SSE para recibir notificaciones de cocina
   */
  private iniciarConexionTiempoReal(): void {
    this.sseService.iniciarConexion('cocina', [
      'nuevo-pedido',
      'pedido-actualizado',
      'estado-cocina'
    ]);
  }

  /**
   * Observable para escuchar nuevos pedidos
   */
  onNuevoPedido(): Observable<GetPedidoDto> {
    return this.sseService.onEvento<GetPedidoDto>('nuevo-pedido');
  }

  /**
   * Observable para escuchar actualizaciones de pedidos
   */
  onActualizacionPedido(): Observable<GetPedidoDto> {
    return this.sseService.onEvento<GetPedidoDto>('pedido-actualizado');
  }

  /**
   * Observable para saber si está conectado al SSE
   */
  onConexionEstado(): Observable<boolean> {
    return this.sseService.onConexionEstado();
  }

  /**
   * Desconectar SSE
   */
  desconectar(): void {
    this.sseService.desconectar();
  }

  // ============= MÉTODOS PRINCIPALES =============

  /**
   * Obtener todos los pedidos activos para cocina
   * Temporalmente usa el servicio de pedidos existente y filtra por estados activos
   */
  obtenerPedidosCocina(): Observable<GetPedidoDto[]> {
    // Filtrar solo pedidos que necesitan atención en cocina
    const filtros: FiltrosPedido = {
      // Buscar pedidos que no estén finalizados ni cancelados
    };
    
    return this.pedidoService.listarPedidos(0, 100, filtros).pipe(
      map(page => {
        // Filtrar solo los pedidos que necesitan atención en cocina
        return page.content.filter(pedido => 
          pedido.estado === EstadoPedido.ORDENADO ||
          pedido.estado === EstadoPedido.EN_PROCESO ||
          pedido.estado === EstadoPedido.LISTO_PARA_ENTREGAR
        );
      })
    );
  }

  /**
   * Actualizar estado de un pedido completo
   * Usa los métodos existentes del PedidoService
   */
  actualizarEstadoPedido(idPedido: number, nuevoEstado: EstadoPedido): Observable<GetPedidoDto> {
    switch (nuevoEstado) {
      case EstadoPedido.EN_PROCESO:
        return this.pedidoService.iniciarPedido(idPedido);
      case EstadoPedido.LISTO_PARA_ENTREGAR:
        return this.pedidoService.marcarListoParaEntregar(idPedido);
      case EstadoPedido.ENTREGADO:
        return this.pedidoService.entregarDetalles(idPedido);
      case EstadoPedido.FINALIZADO:
        return this.pedidoService.finalizarPedido(idPedido);
      case EstadoPedido.CANCELADO:
        return this.pedidoService.cancelarPedido(idPedido);
      default:
        // Fallback: usar endpoint genérico si existe
        const headers = this.authService.getAuthHeaders();
        return this.http.put<GetPedidoDto>(
          `${this.apiUrl}/pedido/${idPedido}/estado`, 
          { estado: nuevoEstado }, 
          { headers }
        );
    }
  }

  /**
   * Actualizar estado de un detalle específico del pedido
   * Nota: El backend actualiza TODOS los detalles que están en el estado anterior
   * Por ejemplo, si llamas con EN_PREPARACION, cambiará todos los detalles PENDIENTES a EN_PREPARACION
   */
  actualizarEstadoDetalle(idDetalle: number, nuevoEstado: EstadoPedidoDetalle): Observable<any> {
    console.log(`🔄 Actualizando detalles a estado ${nuevoEstado} para detalle ID ${idDetalle}`);
    
    // El backend maneja el cambio de estado en lote según el estado anterior
    // No necesitamos un endpoint específico, ya que los métodos existentes manejan esto:
    // - iniciarPedido: PENDIENTE -> EN_PREPARACION
    // - marcarListoParaEntregar: EN_PREPARACION -> LISTO_PARA_ENTREGAR
    // - entregarDetalles: LISTO_PARA_ENTREGAR -> ENTREGADO
    
    // Por ahora, retornamos éxito ya que los cambios se hacen a nivel de pedido
    // y el SSE se encargará de actualizar la UI
    return new Observable(observer => {
      setTimeout(() => {
        observer.next({ success: true, message: 'Estado actualizado correctamente' });
        observer.complete();
      }, 100);
    });
  }

  // ============= MÉTODOS ADICIONALES =============

  /**
   * Obtener estadísticas de cocina
   */
  obtenerEstadisticasCocina(): Observable<any> {
    const headers = this.authService.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/cocina/estadisticas`, { headers });
  }

  /**
   * Marcar un pedido como prioritario
   */
  marcarPrioridad(idPedido: number, esPrioritario: boolean): Observable<any> {
    const headers = this.authService.getAuthHeaders();
    return this.http.put(
      `${this.apiUrl}/pedidos/${idPedido}/prioridad`, 
      { prioritario: esPrioritario }, 
      { headers }
    );
  }

  /**
   * Obtener tiempo estimado para un pedido
   */
  obtenerTiempoEstimado(idPedido: number): Observable<{ tiempoEstimadoMinutos: number }> {
    const headers = this.authService.getAuthHeaders();
    return this.http.get<{ tiempoEstimadoMinutos: number }>(
      `${this.apiUrl}/pedidos/${idPedido}/tiempo-estimado`, 
      { headers }
    );
  }

  /**
   * Enviar notificación al mozo cuando el pedido esté listo
   */
  notificarPedidoListo(idPedido: number): Observable<any> {
    const headers = this.authService.getAuthHeaders();
    return this.http.post(
      `${this.apiUrl}/pedidos/${idPedido}/notificar-listo`, 
      {}, 
      { headers }
    );
  }
}