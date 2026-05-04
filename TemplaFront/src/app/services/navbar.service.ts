import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { MenuItem, RouteMenuData } from '../componentes/models/menu-model';
import { RoleAccessService } from './role-access.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class NavbarService {

  constructor(
    private router: Router,
    private roleAccessService: RoleAccessService,
    private authService: AuthService
  ) { }

  getMenuItems(): Observable<MenuItem[]> {
    const allMenuItems = this.generateMenuFromRoutes();
    const filteredMenuItems = this.filterMenuByPermissions(allMenuItems);
    console.log('🔍 NavbarService: Menú filtrado por permisos:', filteredMenuItems);
    return of(filteredMenuItems);
  }

private generateMenuFromRoutes(): MenuItem[] {
  const routes = this.router.config;
  const menuMap = new Map<string, MenuItem>();
  
  console.log('🔍 Rutas encontradas:', routes);
  
  // Filtrar rutas que deben aparecer en el menú
  const menuRoutes = routes.filter(route => {
    const data = route.data as RouteMenuData;
    return data?.showInMenu && route.path && route.path !== '';
  });

  console.log('🔍 Rutas de menú filtradas:', menuRoutes);

  // Procesar rutas principales (sin parentMenu)
  menuRoutes
    .filter(route => !(route.data as RouteMenuData)?.parentMenu)
    .forEach(route => {
      const data = route.data as RouteMenuData;
      const menuItem: MenuItem = {
        id: route.path!,
        icon: data.icon || '📄',
        label: data.menuLabel || route.path!,
        route: `/${route.path}`,
        hasSubmenu: data.hasSubmenu || false, // ✅ AGREGAR
        submenu: [],
        isPrincipal: data.isPrincipal || false // ✅ AGREGAR
      };
      
      console.log('🔍 Procesando ruta principal:', route.path, menuItem);
      menuMap.set(route.path!, menuItem);
    });

  // Procesar subrutas (con parentMenu)
  menuRoutes
    .filter(route => (route.data as RouteMenuData)?.parentMenu)
    .forEach(route => {
      const data = route.data as RouteMenuData;
      const parentPath = data.parentMenu!;
      const parentItem = menuMap.get(parentPath);
      
      console.log('🔍 Procesando subruta:', route.path, 'Parent:', parentPath);
      
      if (parentItem) {
        parentItem.hasSubmenu = true; // ✅ ASEGURAR que se marca como true
        parentItem.submenu!.push({
          label: data.menuLabel || route.path!.split('/').pop() || '',
          route: `/${route.path}`
        });
        
        console.log('🔍 Parent actualizado:', parentItem);
      } else {
        console.log('❌ Parent no encontrado para:', route.path);
      }
    });

  // Convertir map a array y ordenar
  const menuArray = Array.from(menuMap.values());
  console.log('🔍 Menú final antes de ordenar:', menuArray);
  
  const sortedMenu = menuArray.sort((a, b) => {
    const orderA = this.getRouteOrder(a.id);
    const orderB = this.getRouteOrder(b.id);
    return orderA - orderB;
  });
  
  console.log('🔍 Menú final ordenado:', sortedMenu);
  return sortedMenu;
}

  private getRouteOrder(path: string): number {
    const route = this.router.config.find(r => r.path === path);
    const data = route?.data as RouteMenuData;
    return data?.order || 999;
  }

  // ✅ NUEVO: Filtrar menú según permisos del usuario
  private filterMenuByPermissions(menuItems: MenuItem[]): MenuItem[] {
    if (!this.authService.isLoggedIn()) {
      console.log('🔍 NavbarService: Usuario no logueado, retornando menú vacío');
      return [];
    }

    return menuItems.filter(menuItem => {
      const hasAccess = this.checkMenuItemAccess(menuItem);
      
      if (hasAccess && menuItem.submenu && menuItem.submenu.length > 0) {
        // Filtrar submenu items también
        menuItem.submenu = menuItem.submenu.filter(subItem => {
          const subItemAccess = this.checkSubmenuItemAccess(subItem);
          console.log(`🔍 NavbarService: Submenu '${subItem.label}' acceso: ${subItemAccess}`);
          return subItemAccess;
        });
        
        // Si después del filtrado no quedan subitems, ocultar el item principal
        if (menuItem.submenu.length === 0) {
          console.log(`🔍 NavbarService: Item '${menuItem.label}' oculto porque no tiene subitems accesibles`);
          return false;
        }
      }
      
      console.log(`🔍 NavbarService: Item '${menuItem.label}' acceso: ${hasAccess}`);
      return hasAccess;
    });
  }

  // ✅ Verificar acceso a un item de menú principal
  private checkMenuItemAccess(menuItem: MenuItem): boolean {
    const routePath = menuItem.id;
    
    switch (routePath) {
      case 'personas':
        return this.roleAccessService.canAccessPersonas();
      
      case 'productos':
        return this.roleAccessService.canAccessProductos();
      
      case 'platos':
        return this.roleAccessService.canAccessPlatos();
      
      case 'menu':
        return this.roleAccessService.canAccessMenu();
      
      case 'mesas':
        return this.roleAccessService.canAccessMesas();
      
      case 'reservas':
        return this.roleAccessService.canAccessReservas();
      
      case 'pedidos':
        return this.roleAccessService.canAccessPedidos();
      
      case 'reportes':
        return this.roleAccessService.canAccessReportes();
      
      default:
        console.log(`🔍 NavbarService: Ruta '${routePath}' no tiene verificación específica, permitiendo acceso`);
        return true;
    }
  }

  // ✅ Verificar acceso a un subitem de menú
  private checkSubmenuItemAccess(subItem: { label: string; route: string }): boolean {
    const route = subItem.route;
    
    if (route.includes('usuarios')) {
      return this.roleAccessService.canAccessUsuarios();
    }
    
    if (route.includes('personas')) {
      return this.roleAccessService.canAccessPersonas();
    }
    
    if (route.includes('cocina')) {
      return this.roleAccessService.canAccessCocina();
    }
    
    if (route.includes('pedidos')) {
      return this.roleAccessService.canAccessPedidos();
    }
    
    // Para otros subitems, verificar según el módulo padre
    if (route.startsWith('/productos')) {
      return this.roleAccessService.canAccessProductos();
    }
    
    if (route.startsWith('/platos')) {
      return this.roleAccessService.canAccessPlatos();
    }
    
    if (route.startsWith('/menu')) {
      return this.roleAccessService.canAccessMenu();
    }
    
    if (route.startsWith('/mesas')) {
      return this.roleAccessService.canAccessMesas();
    }
    
    if (route.startsWith('/reservas')) {
      return this.roleAccessService.canAccessReservas();
    }
    
    // Por defecto, permitir acceso
    console.log(`🔍 NavbarService: Subruta '${route}' no tiene verificación específica, permitiendo acceso`);
    return true;
  }
}
