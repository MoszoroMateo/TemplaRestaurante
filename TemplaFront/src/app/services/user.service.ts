import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UsuarioDTO} from '../componentes/models/UsuarioModel';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private readonly http: HttpClient = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = `${environment.apiUrl}/usuario`;

  // ✅ Método para obtener headers con token
  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  listarUsuarios(): Observable<UsuarioDTO[]> {
    const token = this.authService.getToken();
    
    const httpOptions = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    return this.http.get<UsuarioDTO[]>(`${this.apiUrl}/listar`, httpOptions);
  }

  buscarUsuarioPorId(id: number): Observable<UsuarioDTO> {
    const token = this.authService.getToken();
    
    const httpOptions = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    return this.http.get<UsuarioDTO>(`${this.apiUrl}/buscar/${id}`, httpOptions);
  }

  crearUsuario(usuario: any): Observable<UsuarioDTO> {
    const token = this.authService.getToken();
    
    const httpOptions = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    return this.http.post<UsuarioDTO>(`${this.apiUrl}/crear`, usuario, httpOptions);
  }

  actualizarUsuario(id: number, usuario: any): Observable<UsuarioDTO> {
    const token = this.authService.getToken();
    
    // ✅ LOGS para debug
    console.log('Token en actualizarUsuario:', token);  
    console.log('Usuario DTO:', usuario);
    console.log('API URL:', `${this.apiUrl}/editar/${id}`);
    
    const httpOptions = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    return this.http.put<UsuarioDTO>(`${this.apiUrl}/editar/${id}`, usuario, httpOptions);
  }

  eliminarUsuario(id: number): Observable<void> {
    const token = this.authService.getToken();
    
    const httpOptions = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    return this.http.delete<void>(`${this.apiUrl}/eliminar/${id}`, httpOptions);
  }
}
