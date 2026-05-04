
import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { RoleAccessService } from '../services/role-access.service';
import { RolUsuario } from '../componentes/models/UsuarioModel';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private roleAccessService: RoleAccessService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    // 1. Verificar si está logueado
    if (!this.authService.isLoggedIn()) {
      console.log('❌ AuthGuard: Usuario no logueado, redirigiendo a login');
      this.router.navigate(['/login']);
      return false;
    }

    // 2. Verificar permisos específicos de la ruta
    const routePath = route.routeConfig?.path;
    const requiredRoles = route.data?.['requiredRoles'] as RolUsuario[];
    const requiredPermission = route.data?.['requiredPermission'] as string;

    console.log(`🔍 AuthGuard: Verificando acceso a ruta '${routePath}'`);
    console.log(`🔍 AuthGuard: Roles requeridos:`, requiredRoles);
    console.log(`🔍 AuthGuard: Permiso requerido:`, requiredPermission);

    // 3. Si la ruta especifica roles requeridos, verificarlos
    if (requiredRoles && requiredRoles.length > 0) {
      const hasRequiredRole = this.authService.hasAnyRole(requiredRoles);
      if (!hasRequiredRole) {
        console.log(`❌ AuthGuard: Usuario no tiene roles requeridos para '${routePath}'`);
        this.router.navigate(['/login']); // O a una página de "sin permisos"
        return false;
      }
    }

    // 4. Si la ruta especifica un permiso requerido, verificarlo
    if (requiredPermission) {
      const hasPermission = this.roleAccessService.hasPermission(requiredPermission as any);
      if (!hasPermission) {
        console.log(`❌ AuthGuard: Usuario no tiene permiso '${requiredPermission}' para '${routePath}'`);
        this.router.navigate(['/login']); // O a una página de "sin permisos"
        return false;
      }
    }

    // 5. Verificación específica por módulo
    if (routePath) {
      const hasModuleAccess = this.checkModuleAccess(routePath);
      if (!hasModuleAccess) {
        console.log(`❌ AuthGuard: Usuario no tiene acceso al módulo '${routePath}'`);
        this.router.navigate(['/login']); // O a una página de "sin permisos"
        return false;
      }
    }

    console.log(`✅ AuthGuard: Acceso permitido a '${routePath}'`);
    return true;
  }

  private checkModuleAccess(routePath: string): boolean {
    // Mapear rutas a métodos de verificación de permisos
    switch (true) {
      case routePath.startsWith('personas'):
        return this.roleAccessService.canAccessPersonas();
      
      case routePath.includes('usuarios'):
        return this.roleAccessService.canAccessUsuarios();
      
      case routePath.startsWith('productos'):
        return this.roleAccessService.canAccessProductos();
      
      case routePath.startsWith('platos'):
        return this.roleAccessService.canAccessPlatos();
      
      case routePath.startsWith('menu'):
        return this.roleAccessService.canAccessMenu();
      
      case routePath.startsWith('mesas'):
        return this.roleAccessService.canAccessMesas();
      
      case routePath.startsWith('reservas'):
        return this.roleAccessService.canAccessReservas();
      
      case routePath.startsWith('pedidos'):
        return this.roleAccessService.canAccessPedidos();
      
      case routePath.includes('cocina'):
        return this.roleAccessService.canAccessCocina();
      
      case routePath.startsWith('reportes'):
        return this.roleAccessService.canAccessReportes();
      
      default:
        // Para rutas no específicas, permitir acceso si está logueado
        console.log(`🔍 AuthGuard: Ruta '${routePath}' no tiene verificación específica`);
        return true;
    }
  }
}