import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { LoginRequest } from '../componentes/models/LoginRequest';
import {LoginResponse} from '../componentes/models/LoginResponse'
import { RolUsuario } from '../componentes/models/UsuarioModel';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'http://localhost:8081/api/auth';
  private tokenKey = 'authToken';

  constructor(private http: HttpClient, private router: Router) { }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => {
          this.saveToken(response.token);
        })
      );
  }

  private saveToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return this.getToken() !== null;
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.router.navigate(['/login']);
  }

  getAuthHeaders(): { [key: string]: string } {
    const token = this.getToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // ✅ NUEVO: Decodificar el payload del JWT (sin validar la firma)
  private decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      const decodedPayload = atob(payload);
      return JSON.parse(decodedPayload);
    } catch (error) {
      console.error('Error al decodificar token:', error);
      return null;
    }
  }

  // ✅ NUEVO: Obtener información del usuario desde el token
  getUserInfo(): any {
    const token = this.getToken();
    if (!token) {
      console.warn('🔍 AuthService.getUserInfo(): No hay token disponible');
      return null;
    }
    
    const decoded = this.decodeToken(token);
    if (decoded) {
      console.log('🔍 AuthService.getUserInfo(): Token decodificado exitosamente');
      console.log('🔍 Campos disponibles:', Object.keys(decoded));
    } else {
      console.error('❌ AuthService.getUserInfo(): Error al decodificar token');
    }
    
    return decoded;
  }

  // ✅ NUEVO: Obtener el nombre de usuario desde el token
  getUsername(): string {
    const userInfo = this.getUserInfo();
    return userInfo?.sub || userInfo?.username || userInfo?.name || 'Usuario';
  }

  // Obtener el ID del usuario desde el token
  getUserId(): number | null {
    const userInfo = this.getUserInfo();
    
    if (!userInfo) {
      console.warn('🔍 AuthService.getUserId(): No se pudo obtener userInfo del token');
      return null;
    }

    console.log('🔍 AuthService.getUserId(): userInfo completo:', userInfo);

    // Buscar en varios campos posibles para el ID
    const possibleIdFields = ['userId', 'id', 'idUsuario', 'user_id', 'sub'];
    
    for (const field of possibleIdFields) {
      const fieldValue = userInfo[field];
      
      if (fieldValue !== undefined && fieldValue !== null) {
        console.log(`🔍 AuthService.getUserId(): Encontrado campo '${field}':`, fieldValue, `(${typeof fieldValue})`);
        
        // Si es un número válido, retornarlo
        if (typeof fieldValue === 'number' && !isNaN(fieldValue)) {
          console.log(`✅ AuthService.getUserId(): Usando ${field} = ${fieldValue}`);
          return fieldValue;
        }
        
        // Si es un string que se puede parsear a número
        if (typeof fieldValue === 'string' && !isNaN(Number(fieldValue)) && fieldValue.trim() !== '') {
          const parsedValue = Number(fieldValue);
          console.log(`✅ AuthService.getUserId(): Parseando ${field} '${fieldValue}' como ${parsedValue}`);
          return parsedValue;
        }
      }
    }
    
    console.warn('❌ AuthService.getUserId(): No se encontró ID válido en el token');
    console.warn('💡 Campos disponibles en token:', Object.keys(userInfo));
    return null;
  }

  // ✅ NUEVO: Obtener el rol del usuario desde el token
  getUserRole(): RolUsuario | null {
    const userInfo = this.getUserInfo();
    if (!userInfo) {
      console.warn('🔍 AuthService.getUserRole(): No se pudo obtener userInfo del token');
      return null;
    }

    console.log('🔍 AuthService.getUserRole(): userInfo completo:', userInfo);

    // Buscar en varios campos posibles para el rol
    const possibleRoleFields = ['role', 'roles', 'authorities', 'rolUsuario', 'rol', 'authority'];
    
    for (const field of possibleRoleFields) {
      const fieldValue = userInfo[field];
      
      if (fieldValue !== undefined && fieldValue !== null) {
        console.log(`🔍 AuthService.getUserRole(): Encontrado campo '${field}':`, fieldValue, `(${typeof fieldValue})`);
        
        // Si es un string, verificar si es un rol válido
        if (typeof fieldValue === 'string' && Object.values(RolUsuario).includes(fieldValue as RolUsuario)) {
          console.log(`✅ AuthService.getUserRole(): Usando ${field} = ${fieldValue}`);
          return fieldValue as RolUsuario;
        }
        
        // Si es un array, tomar el primer elemento válido
        if (Array.isArray(fieldValue) && fieldValue.length > 0) {
          const firstRole = fieldValue[0];
          if (typeof firstRole === 'string' && Object.values(RolUsuario).includes(firstRole as RolUsuario)) {
            console.log(`✅ AuthService.getUserRole(): Usando primer elemento de ${field} = ${firstRole}`);
            return firstRole as RolUsuario;
          }
        }
      }
    }
    
    console.warn('❌ AuthService.getUserRole(): No se encontró rol válido en el token');
    console.warn('💡 Campos disponibles en token:', Object.keys(userInfo));
    return null;
  }

  // ✅ NUEVO: Verificar si el usuario tiene un rol específico
  hasRole(role: RolUsuario): boolean {
    const userRole = this.getUserRole();
    return userRole === role;
  }

  // ✅ NUEVO: Verificar si el usuario tiene alguno de los roles especificados
  hasAnyRole(roles: RolUsuario[]): boolean {
    const userRole = this.getUserRole();
    return userRole ? roles.includes(userRole) : false;
  }

  // ✅ NUEVO: Verificar si el usuario es administrador
  isAdmin(): boolean {
    return this.hasRole(RolUsuario.ADMINISTRADOR);
  }

  // ✅ Método completo para debug de autenticación
  debugAuthInfo(): void {
    console.log('=================== DEBUG AUTENTICACIÓN ===================');
    const token = this.getToken();
    console.log('🔍 Token existe:', !!token);
    
    if (token) {
      const userInfo = this.getUserInfo();
      console.log('🔍 Token payload:', userInfo);
      
      const userId = this.getUserId();
      console.log('🔍 getUserId():', userId, `(${typeof userId})`);
      
      const username = this.getUsername();
      console.log('🔍 getUsername():', username);

      const userRole = this.getUserRole();
      console.log('🔍 getUserRole():', userRole);
      
      console.log('🔍 isLoggedIn():', this.isLoggedIn());
      console.log('🔍 isAdmin():', this.isAdmin());
      
      if (userId === null) {
        console.error('❌ PROBLEMA: No se puede obtener ID del usuario');
        console.log('💡 El backend debe incluir uno de estos campos en el JWT:');
        console.log('   - userId (número)');
        console.log('   - id (número)');
        console.log('   - idUsuario (número)');
      }

      if (userRole === null) {
        console.error('❌ PROBLEMA: No se puede obtener ROL del usuario');
        console.log('💡 El backend debe incluir uno de estos campos en el JWT:');
        console.log('   - role, roles, authorities, rolUsuario, rol, authority');
      }

      if (userId && userRole) {
        console.log('✅ Autenticación funcionando correctamente');
      }
    } else {
      console.log('❌ No hay token - usuario no logueado');
    }
    console.log('==========================================================');
  }

}
