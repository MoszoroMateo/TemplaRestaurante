import { Routes } from '@angular/router';
import { LoginComponent } from './componentes/login/login.component';
import { LandingComponent } from './componentes/landing/landing.component';
import { PersonasComponent } from './componentes/modulos/personas/personas.component';
import { UsuariosComponent } from './componentes/modulos/usuarios/usuarios.component';
import { ProductosComponent } from './componentes/modulos/productos/productos.component';
import { AuthGuard as authGuard } from './guards/auth-guard.guard';
import { PlatosComponent } from './componentes/modulos/platos/platos.component';
import { MenusComponent } from './componentes/modulos/menus/menus.component';
import { MesasComponent } from './componentes/modulos/mesas/mesas.component';
import { ReservasComponent } from './componentes/modulos/reservas/reservas.component';
import { ReservaPublicaComponent } from './componentes/modulos/reserva-publica/reserva-publica.component';
import { PedidosComponent } from './componentes/modulos/pedidos/pedidos.component';
import { CocinaComponent } from './componentes/modulos/cocina/cocina.component';
import { MapaMesasComponent } from './componentes/modulos/mapa-mesas/mapa-mesas.component';
import { MpResultadoComponent } from './componentes/modulos/mp-resultado/mp-resultado.component';
import { ReportesComponent } from './componentes/modulos/reportes/reportes.component';
import { RolUsuario } from './componentes/models/UsuarioModel';

export const routes: Routes = [
  // Landing page pública (sin autenticación)
  { path: '', component: LandingComponent },
  { path: 'home', component: LandingComponent },
  
  // Login
  { path: 'login', component: LoginComponent },

  // Ruta pública para crear reservas (SIN PROTECCIÓN)
  { path: 'nueva-reserva', component: ReservaPublicaComponent },

  // Ruta de resultado de Mercado Pago (SIN PROTECCIÓN, SIN NAVBAR)
  { path: 'mp-resultado', component: MpResultadoComponent },

  // Rutas principales del menú (PROTEGIDAS)
  {
    path: 'personas',
    component: PersonasComponent,
    canActivate: [authGuard],
    data: {
      showInMenu: true,
      menuLabel: 'Personas',
      icon: 'bi-people-fill',
      order: 1,
      isPrincipal: true,
      hasSubmenu: true,
      requiredRoles: [RolUsuario.ADMINISTRADOR, RolUsuario.MOZO, RolUsuario.ENCARGADO],
      requiredPermission: 'canViewPersonas'
    }
  },

  // Subrutas de personas (PROTEGIDAS)
  {
    path: 'personas/listado',
    component: PersonasComponent,
    canActivate: [authGuard],
    data: {
      showInMenu: true,
      parentMenu: 'personas',
      menuLabel: 'Empleados',
      requiredRoles: [RolUsuario.ADMINISTRADOR, RolUsuario.MOZO, RolUsuario.ENCARGADO],
      requiredPermission: 'canViewPersonas'
    }
  },
  {
    path: 'personas/usuarios',
    component: UsuariosComponent,
    canActivate: [authGuard],
    data: {
      showInMenu: true,
      parentMenu: 'personas',
      menuLabel: 'Usuarios',
      requiredRoles: [RolUsuario.ADMINISTRADOR, RolUsuario.ENCARGADO], // ✅ AGREGADO ENCARGADO
      requiredPermission: 'canViewUsuarios'
    }
  },

  // Rutas de productos (PROTEGIDAS)
  {
    path: 'productos',
    component: ProductosComponent,
    canActivate: [authGuard],
    data: {
      showInMenu: true,
      menuLabel: 'Productos',
      icon: 'bi-box-seam-fill',
      order: 2,
      isPrincipal: true,
      requiredRoles: [RolUsuario.ADMINISTRADOR, RolUsuario.COCINA, RolUsuario.ENCARGADO], // ✅ AGREGADO ENCARGADO
      requiredPermission: 'canViewProductos'
    }
  },

  // Rutas de Platos (PROTEGIDAS)
  {
    path: 'platos',
    component: PlatosComponent,
    canActivate: [authGuard],
    data: {
      showInMenu: true,
      menuLabel: 'Platos',
      icon: 'fa-solid fa-utensils',
      order: 3,
      isPrincipal: true,
      requiredRoles: [RolUsuario.ADMINISTRADOR, RolUsuario.ENCARGADO, RolUsuario.COCINA], // ✅ AGREGADO COCINA
      requiredPermission: 'canViewPlatos'
    }
  },

  // Rutas de Menú (PROTEGIDAS)
  {
    path: 'menu',
    component: MenusComponent,
    canActivate: [authGuard],
    data: {
      showInMenu: true,
      menuLabel: 'Menú',
      icon: 'bi-card-list',
      order: 4,
      isPrincipal: true,
      requiredRoles: [RolUsuario.ADMINISTRADOR, RolUsuario.CLIENTE, RolUsuario.ENCARGADO], // ✅ AGREGADO ENCARGADO
      requiredPermission: 'canViewMenu'
    }
  },

  // Rutas de Mesas (PROTEGIDAS)
  {
    path: 'mesas',
    component: MesasComponent,
    canActivate: [authGuard],
    data: {
      showInMenu: true,
      menuLabel: 'Mesas',
      icon: 'fa-solid fa-chair',
      order: 5,
      isPrincipal: true,
      requiredRoles: [RolUsuario.ADMINISTRADOR, RolUsuario.MOZO, RolUsuario.ENCARGADO], // ✅ AGREGADO ENCARGADO
      requiredPermission: 'canViewMesas'
    }
  },

  // Rutas de pedidos (PROTEGIDAS)
  {
    path: 'pedidos',
    component: PedidosComponent,
    canActivate: [authGuard],
    data: {
      showInMenu: true,
      menuLabel: 'Pedidos',
      icon: 'fa-solid fa-clipboard-list',
      order: 6,
      isPrincipal: true,
      hasSubmenu: true,
      requiredRoles: [RolUsuario.ADMINISTRADOR, RolUsuario.MOZO, RolUsuario.COCINA, RolUsuario.ENCARGADO], // ✅ AGREGADO ENCARGADO
      requiredPermission: 'canViewPedidos'
    }
  },

  // Subrutas de pedidos (PROTEGIDAS)
  {
    path: 'pedidos/listado',
    component: PedidosComponent,
    canActivate: [authGuard],
    data: {
      showInMenu: true,
      parentMenu: 'pedidos',
      menuLabel: 'Gestión de Pedidos',
      requiredRoles: [RolUsuario.ADMINISTRADOR, RolUsuario.MOZO, RolUsuario.COCINA, RolUsuario.ENCARGADO], // ✅ AGREGADO ENCARGADO
      requiredPermission: 'canViewPedidos'
    }
  },
  {
    path: 'pedidos/cocina',
    component: CocinaComponent,
    canActivate: [authGuard],
    data: {
      showInMenu: true,
      parentMenu: 'pedidos',
      menuLabel: 'Cocina',
      requiredRoles: [RolUsuario.ADMINISTRADOR, RolUsuario.COCINA],
      requiredPermission: 'canViewCocina'
    }
  },
  {
    path: 'pedidos/mapa',
    component: MapaMesasComponent,
    canActivate: [authGuard], 
    data: {
      showInMenu: true,
      parentMenu: 'pedidos',
      menuLabel: 'Tomar Pedido',
      requiredRoles: [RolUsuario.ADMINISTRADOR, RolUsuario.MOZO, RolUsuario.COCINA, RolUsuario.ENCARGADO], // ✅ AGREGADO ENCARGADO
      requiredPermission: 'canViewPedidos'
    }
  },

  // Rutas de Reservas (PROTEGIDAS)
  {
    path: 'reservas',
    component: ReservasComponent,
    canActivate: [authGuard],
    data: {
      showInMenu: true,
      menuLabel: 'Reservas',
      icon: 'bi-calendar-check-fill',
      order: 7,
      isPrincipal: true,
      requiredRoles: [RolUsuario.ADMINISTRADOR, RolUsuario.CLIENTE, RolUsuario.ENCARGADO], // ✅ AGREGADO ENCARGADO
      requiredPermission: 'canViewReservas'
    }
  },

  // Rutas de Reportes (PROTEGIDAS)
  {
    path: 'reportes',
    component: ReportesComponent,
    canActivate: [authGuard],
    data: {
      showInMenu: true,
      menuLabel: 'Reportes',
      icon: 'bi-bar-chart-fill',
      order: 8,
      isPrincipal: true,
      requiredRoles: [RolUsuario.ADMINISTRADOR, RolUsuario.ENCARGADO],
      requiredPermission: 'canViewReportes'
    }
  },
  {
    path: 'reportes/reservas-fecha',
    loadComponent: () => import('./componentes/modulos/reportes/reporte-reservas/reporte-reservas.component').then(m => m.ReporteReservasComponent),
    canActivate: [authGuard],
    data: {
      showInMenu: false,
      requiredRoles: [RolUsuario.ADMINISTRADOR, RolUsuario.ENCARGADO]
    }
  },
  {
    path: 'reportes/clientes-reservas',
    loadComponent: () => import('./componentes/modulos/reportes/reporte-clientes-reservas/reporte-clientes-reservas.component').then(m => m.ReporteClientesReservasComponent),
    canActivate: [authGuard],
    data: {
      showInMenu: false,
      requiredRoles: [RolUsuario.ADMINISTRADOR, RolUsuario.ENCARGADO]
    }
  },
  {
    path: 'reportes/pedidos-fecha',
    loadComponent: () => import('./componentes/modulos/reportes/reporte-pedidos/reporte-pedidos.component').then(m => m.ReportePedidosComponent),
    canActivate: [authGuard],
    data: {
      showInMenu: false,
      requiredRoles: [RolUsuario.ADMINISTRADOR, RolUsuario.ENCARGADO]
    }
  },
  {
    path: 'reportes/stock-bajo',
    loadComponent: () => import('./componentes/modulos/reportes/reporte-stock/reporte-stock.component').then(m => m.ReporteStockComponent),
    canActivate: [authGuard],
    data: {
      showInMenu: false,
      requiredRoles: [RolUsuario.ADMINISTRADOR, RolUsuario.ENCARGADO]
    }
  },
  {
    path: 'reportes/platos-productos',
    loadComponent: () => import('./componentes/modulos/reportes/reporte-platos/reporte-platos.component').then(m => m.ReportePlatosComponent),
    canActivate: [authGuard],
    data: {
      showInMenu: false,
      requiredRoles: [RolUsuario.ADMINISTRADOR, RolUsuario.ENCARGADO]
    }
  },
  {
    path: 'reportes/menus-pedidos',
    loadComponent: () => import('./componentes/modulos/reportes/reporte-menus/reporte-menus.component').then(m => m.ReporteMenusComponent),
    canActivate: [authGuard],
    data: {
      showInMenu: false,
      requiredRoles: [RolUsuario.ADMINISTRADOR, RolUsuario.ENCARGADO]
    }
  },

  // Ruta comodín para redireccionar a login si no existe la ruta
  { path: '**', redirectTo: '/login' }
];