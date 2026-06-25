import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { LoginRequest, LoginResponse, JwtPayload, RolUsuario, ForgotPasswordRequest, VerifyResetTokenRequest, ResetPasswordRequest } from '../models/auth.model';
import { tap, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({providedIn: 'root',})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly API_URL = `${environment.apiUrl}/auth`;

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/login`, credentials).pipe(
      tap(res => localStorage.setItem('token', res.token))
    );
  }

  // Mové la lógica de redirección aquí
  redirectByRole(): void {
    this.router.navigate(['/principal']);
  }

  /** Parse JWT payload from stored token */
  private getPayload(): JwtPayload | null {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split('.')[1])) as JwtPayload;
    } catch {
      return null;
    }
  }

  getUserRole(): RolUsuario | null {
    return this.getPayload()?.rol ?? null;
  }

  getUsername(): string {
    return this.getPayload()?.sub ?? 'Usuario';
  }

  getUserId(): number {
    return this.getPayload()?.userId ?? 0;
  }

  forgotPassword(request: ForgotPasswordRequest): Observable<string>{
    return this.http.post(`${this.API_URL}/forgot-password`, request, { responseType: 'text' });
  }

  verifyResetToken(request: VerifyResetTokenRequest): Observable<string>{
    return this.http.post(`${this.API_URL}/verify-reset-token`, request, { responseType: 'text' });
  }

  resetPassword(request: ResetPasswordRequest): Observable<string>{
    return this.http.post(`${this.API_URL}/reset-password`, request, { responseType: 'text' });
  }
}
