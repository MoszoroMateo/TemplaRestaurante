import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { RolUsuario } from '../componentes/models/UsuarioModel';

// ✅ Interfaz para definir qué puede hacer cada rol
export interface RolePermissions {
  canViewPersonas: boolean;
  canViewUsuarios: boolean;
  canViewProductos: boolean;
  canViewPlatos: boolean;
  canViewMenu: boolean;
  canViewMesas: boolean;
  canViewReservas: boolean;
  canViewPedidos: boolean;
  canViewCocina: boolean;
  canViewReportes: boolean;
  canManageUsers: boolean;
}

// ✅ Configuración de acceso por rol según tu backend
export const ROLE_ACCESS_CONFIG: Record<RolUsuario, RolePermissions> = {
  [RolUsuario.ADMINISTRADOR]: {
    canViewPersonas: true,     // ADMINISTRADOR, MOZO, ENCARGADO
    canViewUsuarios: true,     // Solo ADMINISTRADOR
    canViewProductos: true,    // ADMINISTRADOR, COCINA
    canViewPlatos: true,       // ADMINISTRADOR, ENCARGADO
    canViewMenu: true,         // ADMINISTRADOR, CLIENTE
    canViewMesas: true,        // ADMINISTRADOR, MOZO
    canViewReservas: true,     // ADMINISTRADOR, CLIENTE
    canViewPedidos: true,      // ADMINISTRADOR, MOZO
    canViewCocina: true,       // ADMINISTRADOR puede ver todo
    canViewReportes: true,     // Solo ADMINISTRADOR
    canManageUsers: true       // Solo ADMINISTRADOR
  },
  
  [RolUsuario.MOZO]: {
    canViewPersonas: true,     // ADMINISTRADOR, MOZO, ENCARGADO
    canViewUsuarios: false,    // Solo ADMINISTRADOR
    canViewProductos: false,   // ADMINISTRADOR, COCINA
    canViewPlatos: false,      // ADMINISTRADOR, ENCARGADO
    canViewMenu: false,        // ADMINISTRADOR, CLIENTE
    canViewMesas: true,        // ADMINISTRADOR, MOZO
    canViewReservas: false,    // ADMINISTRADOR, CLIENTE
    canViewPedidos: true,      // ADMINISTRADOR, MOZO
    canViewCocina: false,      // Solo acceso específico
    canViewReportes: false,    // Solo ADMINISTRADOR
    canManageUsers: false      // Solo ADMINISTRADOR
  },
  
  [RolUsuario.COCINA]: {
    canViewPersonas: false,    // ADMINISTRADOR, MOZO, ENCARGADO
    canViewUsuarios: false,    // Solo ADMINISTRADOR
    canViewProductos: true,    // ADMINISTRADOR, COCINA
    canViewPlatos: true,      // ADMINISTRADOR, ENCARGADO
    canViewMenu: false,        // ADMINISTRADOR, CLIENTE
    canViewMesas: false,        // ADMINISTRADOR, MOZO, COCINA (para ver mapa de mesas)
    canViewReservas: false,    // ADMINISTRADOR, CLIENTE
    canViewPedidos: true,      // ADMINISTRADOR, MOZO, COCINA (actualizado)
    canViewCocina: true,       // Cocina ve su módulo
    canViewReportes: false,    // Solo ADMINISTRADOR
    canManageUsers: false      // Solo ADMINISTRADOR
  },
  
  [RolUsuario.ENCARGADO]: {
    canViewPersonas: true,     // ADMINISTRADOR, MOZO, ENCARGADO
    canViewUsuarios: true,    // Solo ADMINISTRADOR
    canViewProductos: false,   // ADMINISTRADOR, COCINA
    canViewPlatos: true,       // ADMINISTRADOR, ENCARGADO
    canViewMenu: true,        // ADMINISTRADOR, CLIENTE
    canViewMesas: true,       // ADMINISTRADOR, MOZO
    canViewReservas: true,    // ADMINISTRADOR, CLIENTE
    canViewPedidos: true,     // ADMINISTRADOR, MOZO
    canViewCocina: false,      // Solo acceso específico
    canViewReportes: true,    // ADMINISTRADOR, ENCARGADO
    canManageUsers: false      // Solo ADMINISTRADOR
  },
  
  [RolUsuario.CLIENTE]: {
    canViewPersonas: false,    // ADMINISTRADOR, MOZO, ENCARGADO
    canViewUsuarios: false,    // Solo ADMINISTRADOR
    canViewProductos: false,   // ADMINISTRADOR, COCINA
    canViewPlatos: false,      // ADMINISTRADOR, ENCARGADO
    canViewMenu: true,         // ADMINISTRADOR, CLIENTE
    canViewMesas: false,       // ADMINISTRADOR, MOZO
    canViewReservas: true,     // ADMINISTRADOR, CLIENTE
    canViewPedidos: false,     // ADMINISTRADOR, MOZO
    canViewCocina: false,      // Solo acceso específico
    canViewReportes: false,    // Solo ADMINISTRADOR
    canManageUsers: false      // Solo ADMINISTRADOR
  }
};

@Injectable({
  providedIn: 'root'
})
export class RoleAccessService {

  constructor(private authService: AuthService) { }

  // ✅ Obtener permisos del usuario actual
  getCurrentUserPermissions(): RolePermissions | null {
    const userRole = this.authService.getUserRole();
    if (!userRole) {
      console.warn('RoleAccessService: No se pudo obtener el rol del usuario');
      return null;
    }

    const permissions = ROLE_ACCESS_CONFIG[userRole];
    console.log(`🔍 RoleAccessService: Permisos para rol ${userRole}:`, permissions);
    return permissions;
  }

  // ✅ Verificar un permiso específico
  hasPermission(permission: keyof RolePermissions): boolean {
    const permissions = this.getCurrentUserPermissions();
    if (!permissions) {
      return false;
    }
    
    const hasAccess = permissions[permission];
    console.log(`🔍 RoleAccessService: Verificando permiso '${permission}': ${hasAccess}`);
    return hasAccess;
  }

  // ✅ Métodos de conveniencia para verificar acceso a módulos específicos
  canAccessPersonas(): boolean {
    return this.hasPermission('canViewPersonas');
  }

  canAccessUsuarios(): boolean {
    return this.hasPermission('canViewUsuarios');
  }

  canAccessProductos(): boolean {
    return this.hasPermission('canViewProductos');
  }

  canAccessPlatos(): boolean {
    return this.hasPermission('canViewPlatos');
  }

  canAccessMenu(): boolean {
    return this.hasPermission('canViewMenu');
  }

  canAccessMesas(): boolean {
    return this.hasPermission('canViewMesas');
  }

  canAccessReservas(): boolean {
    return this.hasPermission('canViewReservas');
  }

  canAccessPedidos(): boolean {
    return this.hasPermission('canViewPedidos');
  }

  canAccessCocina(): boolean {
    return this.hasPermission('canViewCocina');
  }

  canAccessReportes(): boolean {
    return this.hasPermission('canViewReportes');
  }

  // ✅ Verificar si puede gestionar usuarios
  canManageUsers(): boolean {
    return this.hasPermission('canManageUsers');
  }

  // ✅ Obtener módulos accesibles para el usuario actual
  getAccessibleModules(): string[] {
    const permissions = this.getCurrentUserPermissions();
    if (!permissions) {
      return [];
    }

    const modules: string[] = [];
    
    if (permissions.canViewPersonas) modules.push('personas');
    if (permissions.canViewUsuarios) modules.push('usuarios');
    if (permissions.canViewProductos) modules.push('productos');
    if (permissions.canViewPlatos) modules.push('platos');
    if (permissions.canViewMenu) modules.push('menu');
    if (permissions.canViewMesas) modules.push('mesas');
    if (permissions.canViewReservas) modules.push('reservas');
    if (permissions.canViewPedidos) modules.push('pedidos');
    if (permissions.canViewCocina) modules.push('cocina');
    if (permissions.canViewReportes) modules.push('reportes');

    console.log(`🔍 RoleAccessService: Módulos accesibles:`, modules);
    return modules;
  }

  // ✅ Debug: Mostrar información completa de permisos
  debugPermissions(): void {
    console.log('=================== DEBUG PERMISOS ===================');
    const userRole = this.authService.getUserRole();
    console.log('🔍 Rol del usuario:', userRole);
    
    if (userRole) {
      const permissions = this.getCurrentUserPermissions();
      console.log('🔍 Permisos completos:', permissions);
      
      const accessibleModules = this.getAccessibleModules();
      console.log('🔍 Módulos accesibles:', accessibleModules);
    } else {
      console.log('❌ No se pudo obtener el rol del usuario');
    }
    console.log('=====================================================');
  }
}