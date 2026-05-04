import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DisponibilidadModel, PostDisponibilidadModel } from '../componentes/models/DisponibilidadModel';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class DisponibilidadService {
  private baseUrl = `${environment.apiUrl}/disponibilidad`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  // Método helper para crear headers con token
  private getHttpOptions(): { headers: HttpHeaders } {
    const token = this.authService.getToken();
    if (token) {
      return {
        headers: new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        })
      };
    }
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
  }

  /**
   * Crear disponibilidad
   * 🌍 Usa endpoint público si no hay token
   * 🔒 Usa endpoint protegido si hay token
   */
  crearDisponibilidad(disponibilidad: PostDisponibilidadModel): Observable<DisponibilidadModel> {
    const token = this.authService.getToken();
    const endpoint = token ? `${this.baseUrl}/crear` : `${this.baseUrl}/publica`;
    return this.http.post<DisponibilidadModel>(endpoint, disponibilidad, this.getHttpOptions());
  }

  /**
   * Obtener todas las disponibilidades
   * 🌍 Usa endpoint público si no hay token
   * 🔒 Usa endpoint protegido si hay token
   */
  obtenerTodasLasDisponibilidades(): Observable<DisponibilidadModel[]> {
    const token = this.authService.getToken();
    const endpoint = token ? `${this.baseUrl}/listar` : `${this.baseUrl}/publica`;
    return this.http.get<DisponibilidadModel[]>(endpoint, this.getHttpOptions());
  }

  /**
   * Obtener disponibilidad por ID (requiere autenticación)
   */
  obtenerDisponibilidadPorId(id: number): Observable<DisponibilidadModel> {
    return this.http.get<DisponibilidadModel>(`${this.baseUrl}/${id}`, this.getHttpOptions());
  }

  /**
   * Actualizar disponibilidad (requiere autenticación)
   */
  actualizarDisponibilidad(id: number, disponibilidad: PostDisponibilidadModel): Observable<DisponibilidadModel> {
    return this.http.put<DisponibilidadModel>(`${this.baseUrl}/editar/${id}`, disponibilidad, this.getHttpOptions());
  }

  /**
   * Eliminar disponibilidad (requiere autenticación)
   */
  eliminarDisponibilidad(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, this.getHttpOptions());
  }
}