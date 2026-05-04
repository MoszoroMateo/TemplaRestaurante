import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ReservaModel, PostReservaModel } from '../componentes/models/ReservaModel';
import { ReservaVipRequest, ReservaVipResponse } from '../componentes/models/MercadoPagoModels';
import { AuthService } from './auth.service';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class ReservaService {
  // El backend define el controller con @RequestMapping("/api/reserva")
  // por eso la ruta base debe ser singular: '/reserva'
  private baseUrl = `${environment.apiUrl}/reserva`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  // Método helper para crear headers con token
  private getHttpOptions(params?: HttpParams): { headers: HttpHeaders; params?: HttpParams } {
    const token = this.authService.getToken();
    const headers: any = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const options: any = {
      headers: new HttpHeaders(headers)
    };

    if (params) {
      options.params = params;
    }

    return options;
  }

  crearReserva(reserva: PostReservaModel): Observable<ReservaModel> {
    return this.http.post<ReservaModel>(`${this.baseUrl}/crear`, reserva, this.getHttpOptions());
  }

  obtenerReservas(page: number = 0, size: number = 10): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<any>(`${this.baseUrl}/listar`, this.getHttpOptions(params));
  }

  // Método para obtener reservas con filtros
  obtenerReservasConFiltros(filtros: { page: number; size: number; evento?: string; fechaDesde?: string; fechaHasta?: string }): Observable<any> {
    let params = new HttpParams()
      .set('page', filtros.page.toString())
      .set('size', filtros.size.toString());

    console.log('🔧 ReservaService - Filtros recibidos:', filtros);

    // Manejar filtro de evento según la lógica del backend
    if (filtros.evento && filtros.evento !== 'TODOS') {
      params = params.set('evento', filtros.evento);
      console.log('🎭 ReservaService - Agregando filtro evento:', filtros.evento);
    } else {
      console.log('🎭 ReservaService - Filtro TODOS: no enviando parámetro evento');
    }

    // Agregar filtros de fecha si están definidos
    if (filtros.fechaDesde && filtros.fechaDesde.trim() !== '') {
      params = params.set('fechaDesde', filtros.fechaDesde);
      console.log('📅 ReservaService - Agregando fechaDesde:', filtros.fechaDesde);
    }

    if (filtros.fechaHasta && filtros.fechaHasta.trim() !== '') {
      params = params.set('fechaHasta', filtros.fechaHasta);
      console.log('📅 ReservaService - Agregando fechaHasta:', filtros.fechaHasta);
    }

    const url = `${this.baseUrl}/filtrar`;
    console.log('🚀 ReservaService - URL final:', url);
    console.log('📋 ReservaService - Parámetros finales:', params.toString());

    return this.http.get<any>(url, this.getHttpOptions(params));
  }

  actualizarReserva(id: number, reserva: PostReservaModel): Observable<ReservaModel> {
    return this.http.put<ReservaModel>(`${this.baseUrl}/editar/${id}`, reserva, this.getHttpOptions());
  }

  eliminarReserva(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/eliminar/${id}`, this.getHttpOptions());
  }

  // ==================== MÉTODOS DE MERCADO PAGO ====================

  /**
   * Crea una reserva VIP que requiere pago mediante Mercado Pago
   * @param request Datos de la reserva VIP con información del cliente
   * @returns Observable con la respuesta que incluye los links de pago
   */
  crearReservaVip(request: ReservaVipRequest): Observable<ReservaVipResponse> {
    console.log('💳 ReservaService - Creando reserva VIP con pago:', request);
    return this.http.post<ReservaVipResponse>(
      `${this.baseUrl}/crear-vip`, 
      request, 
      this.getHttpOptions()
    );
  }

  /**
   * Verifica el estado del pago de una reserva
   * @param reservaId ID de la reserva a verificar
   * @returns Observable con los datos actualizados de la reserva
   */
  verificarPagoReserva(reservaId: number): Observable<ReservaModel> {
    console.log('🔍 ReservaService - Verificando pago de reserva:', reservaId);
    return this.http.get<ReservaModel>(
      `${this.baseUrl}/verificar-pago/${reservaId}`, 
      this.getHttpOptions()
    );
  }

  /**
   * Abre el checkout de Mercado Pago usando el SDK con la public key correcta
   * @param preferenceId ID de la preferencia creada
   * @param publicKey Public key de Mercado Pago
   * @param reservaId ID de la reserva para tracking
   */
  abrirCheckoutMercadoPago(preferenceId: string, publicKey: string, reservaId: number): void {
    console.log('🌐 Abriendo checkout de Mercado Pago con SDK:', {
      preferenceId,
      publicKey,
      reservaId
    });

    // Usar el SDK de Mercado Pago con la public key correcta
    const mp = new (window as any).MercadoPago(publicKey, {
      locale: 'es-AR'
    });

    // Abrir el checkout
    mp.checkout({
      preference: {
        id: preferenceId
      },
      autoOpen: true
    });
  }
}