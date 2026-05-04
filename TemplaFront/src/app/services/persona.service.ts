/* filepath: c:\Users\Mateo Moszoro\Desktop\Templa\APP\PS2025_TemplaRestaurante\TemplaFront\src\app\services\persona.service.ts */
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Persona, TipoPersona, FiltroPersona, PostPersonaDto } from '../componentes/models/PersonaModel';
import { environment } from '../../environments/environment';
import { Page } from '../componentes/models/CommonModels';
import { AuthService } from './auth.service'; // ✅ Importar AuthService

@Injectable({
  providedIn: 'root'
})
export class PersonaService {

  private readonly http: HttpClient = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = `${environment.apiUrl}/persona`;

  // ✅ Método simplificado usando solo getToken()
  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken(); // ✅ Solo usar getToken()
    if (token) {
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
    }
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  obtenerPersonas(page: number = 0, size: number = 10): Observable<Page<Persona>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    const token = this.authService.getToken();
    
    const headers: any = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const httpOptions = {
      params,
      headers
    };

    return this.http.get<Page<Persona>>(`${this.apiUrl}/personas`, httpOptions);
  }

  /**
   * Obtiene personas de tipo PERSONAL que NO tienen un usuario asignado.
   * Útil para el dropdown al crear un nuevo usuario.
   */
  obtenerPersonalSinUsuario(page: number = 0, size: number = 1000): Observable<Page<Persona>> {
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

    return this.http.get<Page<Persona>>(`${this.apiUrl}/personas/sin-usuario`, httpOptions);
  }

  obtenerPersonasConFiltros(filtros: FiltroPersona): Observable<Page<Persona>> {
    let params = new HttpParams();
   console.log('🔍 Filtros recibidos en service:', filtros);

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

    if (filtros.busqueda && filtros.busqueda.trim()) {
      params = params.set('buscarFiltro', filtros.busqueda.trim());
    }

    if (filtros.tipo && filtros.tipo.trim() !== '') {
      params = params.set('tipoPersona', filtros.tipo);
    }

    if (filtros.activo !== undefined) {
      const estado = filtros.activo ? 'ACTIVOS' : 'BAJA';
      params = params.set('estado', estado);
      console.log('🔍 Agregando parámetro estado:', estado);
    } else {
      console.log('🔍 Sin filtro de estado (TODOS)');
    }

    console.log('🔍 Parámetros finales:', params.toString());

    const token = this.authService.getToken();
    
    // ✅ USAR EL MISMO PATRÓN
    const httpOptions = {
      params,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    return this.http.get<Page<Persona>>(`${this.apiUrl}/personas/filtrar`, httpOptions);
  }

  crearPersona(personaDto: PostPersonaDto): Observable<Persona> {
    const token = this.authService.getToken();
    // ✅ USAR EL MISMO PATRÓN
    console.log('Token en crearPersona:', token);
    console.log('Persona DTO:', personaDto);
    console.log('API URL:', `${this.apiUrl}/crear`);
    const httpOptions = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    return this.http.post<Persona>(`${this.apiUrl}/crear`, personaDto, httpOptions);
  }

  actualizarPersona(persona: Persona): Observable<Persona> {
    return this.http.put<Persona>(`${this.apiUrl}/actualizar`, persona, { 
      headers: this.getHeaders() 
    });
  }

  eliminarPersona(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/baja/${id}`, { 
      headers: this.getHeaders() 
    });
  }

  buscarPersonaPorDni(dni: number): Observable<Persona | null> {
    const token = this.authService.getToken();
    const httpOptions = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    return this.http.get<Persona>(`${this.apiUrl}/personas/dni/${dni}`, httpOptions);
  }
}
