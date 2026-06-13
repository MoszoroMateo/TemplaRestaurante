import { Routes } from '@angular/router';
import { LoginComponent } from './features/login/login';
import { LayoutComponent } from './core/layout/layout';
import { DashboardComponent } from './features/dashboard/dashboard';
import { ProfileComponent } from './features/profile/profile';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // ── Sin layout (login full-screen) ──
  { path: 'login', component: LoginComponent },

  // ── Con layout (navbar + sidebar) ──
  {
    path: '',
    component: LayoutComponent,
    // canActivate: [AuthGuard], // ← TODO: implementar
    children: [
      { path: 'principal', component: DashboardComponent },

      { path: 'perfil', component: ProfileComponent },

      // { path: 'personas',   component: PersonasComponent,   canActivate: [RoleGuard], data: { permission: 'canViewPersonas' } },
      // { path: 'usuarios',   component: UsuariosComponent,   canActivate: [RoleGuard], data: { permission: 'canViewUsuarios' } },
      // { path: 'productos',  component: ProductosComponent,  canActivate: [RoleGuard], data: { permission: 'canViewProductos' } },
      // { path: 'platos',     component: PlatosComponent,     canActivate: [RoleGuard], data: { permission: 'canViewPlatos' } },
      // { path: 'menu',       component: MenuComponent,       canActivate: [RoleGuard], data: { permission: 'canViewMenu' } },
      // { path: 'mesas',      component: MesasComponent,      canActivate: [RoleGuard], data: { permission: 'canViewMesas' } },
      // { path: 'reservas',   component: ReservasComponent,   canActivate: [RoleGuard], data: { permission: 'canViewReservas' } },
      // { path: 'pedidos',    component: PedidosComponent,    canActivate: [RoleGuard], data: { permission: 'canViewPedidos' } },
      // { path: 'cocina',     component: CocinaComponent,     canActivate: [RoleGuard], data: { permission: 'canViewCocina' } },
      // { path: 'reportes',   component: ReportesComponent,   canActivate: [RoleGuard], data: { permission: 'canViewReportes' } },
    ],
  },

  { path: '**', redirectTo: 'login' },
];
