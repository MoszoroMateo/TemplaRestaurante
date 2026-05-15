import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { LoginRequest, LoginResponse, JwtPayload, RolUsuario } from '../models/auth.model';
import { tap, Observable } from 'rxjs';

@Injectable({providedIn: 'root',})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly API_URL = 'http://localhost:8081/api/auth';

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/login`, credentials).pipe(
      tap(res => localStorage.setItem('token', res.token))
    );
  }

  // Mové la lógica de redirección aquí
  redirectByRole(): void {
    this.router.navigate(['/principal']);
  }

  getUserRole(): RolUsuario | null {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1])) as JwtPayload;
    return payload.rol;
  }

  getUsername(): string {
    const token = localStorage.getItem('token');
    if (!token) return 'Usuario';

    const payload = JSON.parse(atob(token.split('.')[1])) as JwtPayload;
    return payload.sub;
  }
}
