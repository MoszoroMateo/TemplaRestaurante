import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {FormsModule,ReactiveFormsModule} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RoleAccessService } from '../../services/role-access.service';
import { LoginRequest } from '../models/LoginRequest';
import { RolUsuario } from '../models/UsuarioModel';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule,RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  username = '';
  password = '';
  isLoading = false;
  errorMessage = '';

  constructor(
    public authService: AuthService,
    private router: Router,
    private roleAccessService: RoleAccessService
  ) { }
  
  // ✅ TEST: Función para verificar getUserId después del login
  public testUserIdAfterLogin() {
    console.log('=== TEST getUserId() después del login ===');
    
    const token = this.authService.getToken();
    console.log('🔍 Token existe:', !!token);
    
    const userInfo = this.authService.getUserInfo();
    console.log('🔍 UserInfo:', userInfo);
    
    const userId = this.authService.getUserId();
    console.log('🔍 getUserId() resultado:', userId, `(${typeof userId})`);
    
    const username = this.authService.getUsername();
    console.log('🔍 getUsername() resultado:', username);
    
    if (userId === null) {
      console.error('❌ PROBLEMA: getUserId() retorna null');
      console.log('💡 SOLUCIÓN: El backend debe incluir un campo de ID numérico en el JWT');
      console.log('💡 Campos sugeridos: "userId", "id", "idUsuario"');
    } else {
      console.log('✅ SUCCESS: getUserId() funciona correctamente');
    }
    
    console.log('=== FIN TEST ===');
  }

  login() {
    this.isLoading = true;
    this.errorMessage = '';

    const credentials: LoginRequest = {
      username: this.username,
      password: this.password
    };

    console.log('🔍 Iniciando login con credenciales:', { username: this.username, password: '[OCULTA]' });

    this.authService.login(credentials).subscribe({
      next: (response) => {
        console.log('✅ Login exitoso, respuesta del servidor:', response);
        
        // ✅ TEST: Verificar getUserId después del login exitoso
        this.testUserIdAfterLogin();
        
        // ✅ NUEVO: Debug completo de autenticación y permisos
        this.authService.debugAuthInfo();
        
        // ✅ MEJORADO: Redirigir según permisos del usuario
        this.redirectUserBasedOnRole();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Credenciales inválidas. Por favor, intente nuevamente.';
        
        // Mostrar SweetAlert con error
        Swal.fire({
          icon: 'error',
          title: 'Error de autenticación',
          text: 'Usuario o contraseña inválidos',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#d33'
        });
        
        console.error('❌ Error en login:', error);
        console.error('❌ Detalles del error:', error.error);
        console.error('❌ Status del error:', error.status);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  // ✅ NUEVO: Redirigir según rol del usuario
  private redirectUserBasedOnRole() {
    const userRole = this.authService.getUserRole();
    console.log('🔍 Redirigiendo usuario con rol:', userRole);

    if (!userRole) {
      console.warn('⚠️ No se pudo obtener el rol del usuario, redirigiendo a personas por defecto');
      this.router.navigate(['/personas']);
      return;
    }

    // Redirigir según el rol a la primera pantalla accesible
    switch (userRole) {
      case RolUsuario.ADMINISTRADOR:
        // Admin puede ver todo, ir a personas
        console.log('🔍 Redirigiendo ADMINISTRADOR a /personas');
        this.router.navigate(['/personas']);
        break;
        
      case RolUsuario.MOZO:
        // Mozo puede ver personas, mesas, pedidos - ir a personas
        console.log('🔍 Redirigiendo MOZO a /personas');
        this.router.navigate(['/personas']);
        break;
        
      case RolUsuario.COCINA:
        // Cocina puede ver productos y cocina - ir a productos
        console.log('🔍 Redirigiendo COCINA a /productos');
        this.router.navigate(['/productos']);
        break;
        
      case RolUsuario.ENCARGADO:
        // Encargado puede ver personas y platos - ir a personas
        console.log('🔍 Redirigiendo ENCARGADO a /personas');
        this.router.navigate(['/personas']);
        break;
        
      case RolUsuario.CLIENTE:
        // Cliente puede ver menú y reservas - ir a menú
        console.log('🔍 Redirigiendo CLIENTE a /menu');
        this.router.navigate(['/menu']);
        break;
        
      default:
        console.warn('⚠️ Rol no reconocido:', userRole, 'redirigiendo a personas por defecto');
        this.router.navigate(['/personas']);
        break;
    }
  }
}
