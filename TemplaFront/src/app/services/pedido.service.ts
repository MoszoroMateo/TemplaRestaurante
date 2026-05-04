import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Page } from '../componentes/models/CommonModels';
import { PostPedidoDto, GetPedidoDto, FiltrosPedido, EstadoPedido, EstadoPedidoDetalle } from '../componentes/models/PedidoModel';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class PedidoService {
    private readonly http: HttpClient = inject(HttpClient);
    private readonly authService = inject(AuthService);
    private readonly apiUrl = `${environment.apiUrl}/pedido`;

    // ✅ Método helper para crear headers con token
    private getHttpOptions(params?: HttpParams): { headers: HttpHeaders; params?: HttpParams } {
        const token = this.authService.getToken();
        const options: any = {
            headers: new HttpHeaders({
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            })
        };

        if (params) {
            options.params = params;
        }

        return options;
    }

    // ✅ Crear pedido
    crearPedido(pedido: PostPedidoDto): Observable<GetPedidoDto> {
        console.log('🚀 Creando pedido:', pedido);
        return this.http.post<GetPedidoDto>(`${this.apiUrl}/crear`, pedido, this.getHttpOptions());
    }

    // ✅ Obtener pedido por ID
    obtenerPedido(id: number): Observable<GetPedidoDto> {
        return this.http.get<GetPedidoDto>(`${this.apiUrl}/obtener/${id}`, this.getHttpOptions());
    }

    // ✅ Listar pedidos con filtros
    listarPedidos(
        page: number = 0,
        size: number = 10,
        filtros?: FiltrosPedido
    ): Observable<Page<GetPedidoDto>> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        if (filtros) {
            // Filtro de búsqueda
            if (filtros.buscarFiltro && filtros.buscarFiltro.trim()) {
                params = params.set('buscarFiltro', filtros.buscarFiltro.trim());
            }

            // Filtro de estado
            if (filtros.estado && filtros.estado !== 'TODOS') {
                params = params.set('estado', filtros.estado);
            }

            // Filtros de fecha
            if (filtros.fechaDesde) {
                params = params.set('fechaDesde', filtros.fechaDesde);
            }
            if (filtros.fechaHasta) {
                params = params.set('fechaHasta', filtros.fechaHasta);
            }
        }

        console.log('📋 Parámetros de consulta pedidos:', params.toString());
        return this.http.get<Page<GetPedidoDto>>(`${this.apiUrl}`, this.getHttpOptions(params));
    }

    // ✅ Actualizar pedido (agregar detalles)
    actualizarPedido(id: number, pedido: PostPedidoDto): Observable<GetPedidoDto> {
        console.log('✏️ Actualizando pedido:', id, pedido);
        return this.http.put<GetPedidoDto>(`${this.apiUrl}/actualizar/${id}`, pedido, this.getHttpOptions());
    }

    // ✅ Cancelar pedido completo
    cancelarPedido(id: number): Observable<GetPedidoDto> {
        console.log('❌ Cancelando pedido:', id);
        return this.http.delete<GetPedidoDto>(`${this.apiUrl}/cancelar/${id}`, this.getHttpOptions());
    }

    // ✅ Cancelar detalles pendientes
    cancelarDetalles(id: number): Observable<GetPedidoDto> {
        console.log('❌ Cancelando detalles del pedido:', id);
        return this.http.post<GetPedidoDto>(`${this.apiUrl}/cancelar-detalles/${id}`, {}, this.getHttpOptions());
    }

    // ✅ Cancelar detalle específico
    cancelarDetalleEspecifico(idPedido: number, idDetalle: number): Observable<GetPedidoDto> {
        console.log('❌ Cancelando detalle específico:', idPedido, idDetalle);
        return this.http.post<GetPedidoDto>(`${this.apiUrl}/cancelar-detalle/${idPedido}/${idDetalle}`, {}, this.getHttpOptions());
    }

    // ✅ Marcar detalles como entregados
    entregarDetalles(id: number): Observable<GetPedidoDto> {
        console.log('📦 Entregando detalles del pedido:', id);
        return this.http.post<GetPedidoDto>(`${this.apiUrl}/entregar-detalles/${id}`, {}, this.getHttpOptions());
    }

    // ✅ Iniciar pedido (cambiar a EN_PROCESO)
    iniciarPedido(id: number): Observable<GetPedidoDto> {
        console.log('🔄 Iniciando pedido:', id);
        return this.http.post<GetPedidoDto>(`${this.apiUrl}/iniciar/${id}`, {}, this.getHttpOptions());
    }

    // ✅ Marcar detalles como listos para entregar
    marcarListoParaEntregar(id: number): Observable<GetPedidoDto> {
        console.log('✅ Marcando pedido listo para entregar:', id);
        return this.http.post<GetPedidoDto>(`${this.apiUrl}/listo-para-entregar/${id}`, {}, this.getHttpOptions());
    }

    // ✅ Finalizar pedido
    finalizarPedido(id: number): Observable<GetPedidoDto> {
        console.log('🎉 Finalizando pedido:', id);
        return this.http.post<GetPedidoDto>(`${this.apiUrl}/finalizar/${id}`, {}, this.getHttpOptions());
    }

    // ✅ Obtener pedido activo de una mesa
    obtenerPedidoPorMesa(idMesa: number): Observable<GetPedidoDto> {
        console.log('🔍 Buscando pedido activo de mesa:', idMesa);
        return this.http.get<GetPedidoDto>(`${this.apiUrl}/mesa/${idMesa}`, this.getHttpOptions());
    }

    // ✅ Métodos helper para manejo de estados y fechas
    
    // Obtener texto legible del estado del pedido
    getEstadoPedidoTexto(estado: string): string {
        switch (estado) {
            case EstadoPedido.ORDENADO:
                return 'Ordenado';
            case EstadoPedido.EN_PROCESO:
                return 'En Proceso';
            case EstadoPedido.LISTO_PARA_ENTREGAR:
                return 'Listo para Entregar';
            case EstadoPedido.ENTREGADO:
                return 'Entregado';
            case EstadoPedido.FINALIZADO:
                return 'Finalizado';
            case EstadoPedido.CANCELADO:
                return 'Cancelado';
            default:
                return estado;
        }
    }

    // Obtener texto legible del estado del detalle
    getEstadoDetalleTexto(estado: EstadoPedidoDetalle): string {
        switch (estado) {
            case EstadoPedidoDetalle.PENDIENTE:
                return 'Pendiente';
            case EstadoPedidoDetalle.EN_PREPARACION:
                return 'En Preparación';
            case EstadoPedidoDetalle.LISTO_PARA_ENTREGAR:
                return 'Listo para Entregar';
            case EstadoPedidoDetalle.ENTREGADO:
                return 'Entregado';
            case EstadoPedidoDetalle.CANCELADO:
                return 'Cancelado';
            default:
                return estado;
        }
    }

    // Obtener clase CSS para el estado del pedido
    getEstadoPedidoBadgeClass(estado: string): string {
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

    // Obtener clase CSS para el estado del detalle
    getEstadoDetalleBadgeClass(estado: EstadoPedidoDetalle): string {
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

    // Formatear fecha para mostrar
    formatearFecha(fechaHora: string): string {
        try {
            const fecha = new Date(fechaHora);
            return fecha.toLocaleString('es-AR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return fechaHora;
        }
    }

    // Obtener fecha de hoy en formato YYYY-MM-DD
    getFechaHoy(): string {
        return new Date().toISOString().split('T')[0];
    }

    // Obtener primer día del mes actual en formato YYYY-MM-DD
    getPrimerDiaDelMes(): string {
        const hoy = new Date();
        const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        return primerDia.toISOString().split('T')[0];
    }
}
