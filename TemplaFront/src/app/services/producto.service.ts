import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Producto, ProductoDTO, PostProductoDTO, TipoProducto, FiltroProducto, GetProductosFiltroDTO } from '../componentes/models/ProductoModel';
import { environment } from '../../environments/environment';
import { Page } from '../componentes/models/CommonModels';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {

  private readonly http: HttpClient = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = `${environment.apiUrl}/producto`;

  // ✅ Método para obtener headers con token
  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // ✅ Obtener productos con paginación básica
  obtenerProductos(page: number = 0, size: number = 10): Observable<Page<ProductoDTO>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    const token = this.authService.getToken();
    
    const httpOptions = {
      params,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    return this.http.get<Page<ProductoDTO>>(`${this.apiUrl}/listar`, httpOptions);
  }

  // ✅ Obtener productos con filtros (coincide con tu backend)
  obtenerProductosConFiltros(filtros: FiltroProducto): Observable<Page<ProductoDTO>> {
    let params = new HttpParams();
    console.log('🔍 Filtros recibidos en producto service:', filtros);

    // Paginación
    if (filtros.page !== undefined) {
      params = params.set('page', filtros.page.toString());
    } else {
      params = params.set('page', '0');
    }

    if (filtros.size !== undefined) {
      params = params.set('size', filtros.size.toString());
    } else {
      params = params.set('size', '10');
    }

    // Filtro de búsqueda
    if (filtros.busqueda && filtros.busqueda.trim()) {
      params = params.set('buscar', filtros.busqueda.trim());
    }

    // Filtro por tipo de producto
    if (filtros.tipo && filtros.tipo.trim() !== '') {
      params = params.set('tipoProducto', filtros.tipo);
    }

    // Filtro por estado activo
    if (filtros.activo !== undefined) {
      const estado = filtros.activo ? 'ACTIVOS' : 'INACTIVOS';
      params = params.set('activo', estado);
      console.log('🔍 Agregando parámetro activo:', estado);
    } else {
      params = params.set('activo', 'TODOS');
      console.log('🔍 Sin filtro de estado (TODOS)');
    }

    console.log('🔍 Parámetros finales productos:', params.toString());

    const token = this.authService.getToken();
    
    const httpOptions = {
      params,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    return this.http.get<Page<ProductoDTO>>(`${this.apiUrl}/filtrar`, httpOptions);
  }

  // ✅ Crear producto
  crearProducto(productoDto: PostProductoDTO): Observable<ProductoDTO> {
    const token = this.authService.getToken();
    console.log('Token en crearProducto:', token);
    console.log('Producto DTO:', productoDto);
    console.log('API URL:', `${this.apiUrl}/crear`);
    
    const httpOptions = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    return this.http.post<ProductoDTO>(`${this.apiUrl}/crear`, productoDto, httpOptions);
  }

  // ✅ Actualizar producto
  actualizarProducto(id: number, producto: ProductoDTO): Observable<ProductoDTO> {
    return this.http.put<ProductoDTO>(`${this.apiUrl}/editar/${id}`, producto, { 
      headers: this.getHeaders() 
    });
  }

  // ✅ Eliminar producto (baja lógica)
  eliminarProducto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/eliminar/${id}`, { 
      headers: this.getHeaders() 
    });
  }

  // ✅ Obtener solo productos de tipo INSUMO (para ingredientes de platos)
  obtenerInsumos(page: number = 0, size: number = 10): Observable<Page<ProductoDTO>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    const token = this.authService.getToken();
    
    const httpOptions = {
      params,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    return this.http.get<Page<ProductoDTO>>(`${this.apiUrl}/insumos`, httpOptions);
  }

  // ✅ Obtener producto por ID (endpoint no implementado aún en el backend)
  // obtenerProductoPorId(id: number): Observable<ProductoDTO> {
  //   return this.http.get<ProductoDTO>(`${this.apiUrl}/${id}`, { 
  //     headers: this.getHeaders() 
  //   });
  // }

 
  // ✅ Método helper para convertir filtros del frontend al DTO del backend
  private convertirFiltrosADto(filtros: FiltroProducto): GetProductosFiltroDTO {
    const dto: GetProductosFiltroDTO = {
      page: filtros.page,
      size: filtros.size
    };

    if (filtros.busqueda && filtros.busqueda.trim()) {
      dto.buscar = filtros.busqueda.trim();
    }

    if (filtros.tipo && filtros.tipo.trim() !== '') {
      dto.tipoProducto = filtros.tipo;
    }

    if (filtros.activo !== undefined) {
      dto.activo = filtros.activo ? 'ACTIVOS' : 'INACTIVOS';
    } else {
      dto.activo = 'TODOS';
    }

    return dto;
  }
}
