import { Component, inject, input, output, HostBinding } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { RoleAccessService, RolePermissions } from '../../../services/role-access.service';
import {
  LucideLayoutDashboard,
  LucideUsers,
  LucideUserCog,
  LucidePackage,
  LucideUtensilsCrossed,
  LucideBookOpen,
  LucideGrid3x3,
  LucideCalendarCheck,
  LucideClipboardList,
  LucideChefHat,
  LucideBarChart3,
  LucideLogOut,
} from '@lucide/angular';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  permission?: keyof RolePermissions;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    LucideLayoutDashboard,
    LucideUsers,
    LucideUserCog,
    LucidePackage,
    LucideUtensilsCrossed,
    LucideBookOpen,
    LucideGrid3x3,
    LucideCalendarCheck,
    LucideClipboardList,
    LucideChefHat,
    LucideBarChart3,
    LucideLogOut,
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class SidebarComponent {
  private roleAccess = inject(RoleAccessService);

  collapsed = input(false);

  @HostBinding('class.is-collapsed')
  get hostCollapsed(): boolean {
    return this.collapsed();
  }

  navClicked = output<void>();
  logout = output<void>();

  protected readonly allItems: NavItem[] = [
    { label: 'Home',         route: '/principal', icon: 'dashboard' },
    { label: 'Staff',        route: '/personas',  icon: 'users',     permission: 'canViewPersonas' },
    { label: 'Users',        route: '/usuarios',  icon: 'userCog',   permission: 'canViewUsuarios' },
    { label: 'Products',     route: '/productos', icon: 'package',   permission: 'canViewProductos' },
    { label: 'Dishes',       route: '/platos',    icon: 'utensils',  permission: 'canViewPlatos' },
    { label: 'Menu',         route: '/menu',      icon: 'bookOpen',  permission: 'canViewMenu' },
    { label: 'Tables',       route: '/mesas',     icon: 'grid',      permission: 'canViewMesas' },
    { label: 'Reservations', route: '/reservas',  icon: 'calendar',  permission: 'canViewReservas' },
    { label: 'Orders',       route: '/pedidos',   icon: 'clipboard', permission: 'canViewPedidos' },
    { label: 'Live Kitchen', route: '/cocina',    icon: 'chefHat',   permission: 'canViewCocina' },
    { label: 'Reports',      route: '/reportes',  icon: 'chart',     permission: 'canViewReportes' },
  ];

  protected get items(): NavItem[] {
    const perms = this.roleAccess.getCurrentUserPermissions();
    if (!perms) return [this.allItems[0]];
    return this.allItems.filter(i => !i.permission || perms[i.permission]);
  }

  protected onNavClick(): void {
    this.navClicked.emit();
  }
}
