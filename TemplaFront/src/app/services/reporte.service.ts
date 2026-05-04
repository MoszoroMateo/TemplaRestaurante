import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReporteReservasDTO } from '../componentes/models/ReporteReservasDTO';
import { ReportePedidosPorFechaDTO } from '../componentes/models/ReportePedidosPorFechaDTO';
import { ReporteStockBajoDTO } from '../componentes/models/ReporteStockBajoDTO';
import { ReportePlatoProductosDTO } from '../componentes/models/ReportePlatoProductosDTO';
import { ReporteClientesReservasDTO } from '../componentes/models/ReporteClientesReservasDTO';
import { ReporteMenusMasPedidosDTO } from '../componentes/models/ReporteMenusMasPedidosDTO';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReporteService {
  private apiUrl = `${environment.apiUrl}/reportes`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  // Método helper para crear headers con token
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

  getFechasConcurridas(fechaInicio?: string, fechaFin?: string): Observable<ReporteReservasDTO[]> {
    let params = new HttpParams();
    if (fechaInicio) {
      params = params.set('fechaInicio', fechaInicio);
    }
    if (fechaFin) {
      params = params.set('fechaFin', fechaFin);
    }
    return this.http.get<ReporteReservasDTO[]>(`${this.apiUrl}/fechas-concurridas`, this.getHttpOptions(params));
  }

  getHorariosConcurridos(fechaInicio?: string, fechaFin?: string): Observable<ReporteReservasDTO[]> {
    let params = new HttpParams();
    if (fechaInicio) {
      params = params.set('fechaInicio', fechaInicio);
    }
    if (fechaFin) {
      params = params.set('fechaFin', fechaFin);
    }
    return this.http.get<ReporteReservasDTO[]>(`${this.apiUrl}/horarios-concurridos`, this.getHttpOptions(params));
  }

  getPedidosPorFecha(fechaDesde?: string, fechaHasta?: string): Observable<ReportePedidosPorFechaDTO[]> {
    let params = new HttpParams();
    if (fechaDesde) {
      // Convertir formato de YYYY-MM-DD a DD-MM-YYYY para el backend
      const [year, month, day] = fechaDesde.split('-');
      params = params.set('fechaDesde', `${day}-${month}-${year}`);
    }
    if (fechaHasta) {
      const [year, month, day] = fechaHasta.split('-');
      params = params.set('fechaHasta', `${day}-${month}-${year}`);
    }
    
    const url = `${this.apiUrl}/pedidos-por-fecha`;
    console.log('URL del reporte de pedidos:', url);
    console.log('Parámetros:', params.toString());
    
    return this.http.get<ReportePedidosPorFechaDTO[]>(url, this.getHttpOptions(params));
  }

  // Método para obtener datos de reporte para exportar a PDF
  getDatosReporte(tipo: 'fechas' | 'horarios', fechaInicio?: string, fechaFin?: string): Observable<ReporteReservasDTO[]> {
    if (tipo === 'fechas') {
      return this.getFechasConcurridas(fechaInicio, fechaFin);
    } else {
      return this.getHorariosConcurridos(fechaInicio, fechaFin);
    }
  }

  // Método para obtener datos de pedidos para exportar a PDF
  getDatosPedidos(fechaInicio?: string, fechaFin?: string): Observable<ReportePedidosPorFechaDTO[]> {
    return this.getPedidosPorFecha(fechaInicio, fechaFin);
  }

  // Método para obtener productos con stock bajo
  getProductosStockBajo(): Observable<ReporteStockBajoDTO[]> {
    const url = `${this.apiUrl}/productos/stock-bajo`;
    console.log('URL del reporte de stock bajo:', url);
    
    return this.http.get<ReporteStockBajoDTO[]>(url, this.getHttpOptions());
  }

  // Método para obtener datos de stock bajo para exportar a PDF
  getDatosStockBajo(): Observable<ReporteStockBajoDTO[]> {
    return this.getProductosStockBajo();
  }

  // Método para obtener platos por cantidad de productos
  getPlatosPorCantidadProductos(): Observable<ReportePlatoProductosDTO[]> {
    const url = `${this.apiUrl}/platos-productos`;
    console.log('URL del reporte de platos por productos:', url);
    
    return this.http.get<ReportePlatoProductosDTO[]>(url, this.getHttpOptions());
  }

  // Método para obtener datos de platos por productos para exportar a PDF
  getDatosPlatosProductos(): Observable<ReportePlatoProductosDTO[]> {
    return this.getPlatosPorCantidadProductos();
  }

  // ✅ NUEVO: Método para obtener reporte de clientes con más reservas
  getClientesConMasReservas(): Observable<ReporteClientesReservasDTO[]> {
    const url = `${this.apiUrl}/clientes-reservas`;
    console.log('URL del reporte de clientes con más reservas:', url);
    
    return this.http.get<ReporteClientesReservasDTO[]>(url, this.getHttpOptions());
  }

  // ✅ NUEVO: Método para obtener datos de clientes para exportar a PDF
  getDatosClientesReservas(): Observable<ReporteClientesReservasDTO[]> {
    return this.getClientesConMasReservas();
  }

  // Método para obtener menús más pedidos
  getMenusMasPedidos(fechaDesde?: string, fechaHasta?: string): Observable<ReporteMenusMasPedidosDTO[]> {
    let params = new HttpParams();
    if (fechaDesde) {
      // Convertir formato de YYYY-MM-DD a DD-MM-YYYY para el backend
      const [year, month, day] = fechaDesde.split('-');
      params = params.set('fechaDesde', `${day}-${month}-${year}`);
    }
    if (fechaHasta) {
      const [year, month, day] = fechaHasta.split('-');
      params = params.set('fechaHasta', `${day}-${month}-${year}`);
    }
    
    const url = `${this.apiUrl}/menus-mas-pedidos`;
    console.log('URL del reporte de menús más pedidos:', url);
    console.log('Parámetros:', params.toString());
    
    return this.http.get<ReporteMenusMasPedidosDTO[]>(url, this.getHttpOptions(params));
  }

  // Método para obtener datos de menús para exportar a PDF
  getDatosMenusMasPedidos(fechaDesde?: string, fechaHasta?: string): Observable<ReporteMenusMasPedidosDTO[]> {
    return this.getMenusMasPedidos(fechaDesde, fechaHasta);
  }
}