import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, OnInit, OnDestroy} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MenuItem } from '../models/menu-model';
import { NavbarService } from '../../services/navbar.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService, NotificacionDTO } from '../../services/notification.service';
import { RoleAccessService } from '../../services/role-access.service';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit, OnDestroy {
  username = 'Usuario';
  notificationCount = 0;
  notifications: NotificacionDTO[] = [];
  isExpanded = false;
  menuItems: MenuItem[] = [];
  expandedSubmenu: string | null = null;
  
  private subscriptions: Subscription[] = [];

  @Output() navbarToggled = new EventEmitter<boolean>();

  constructor(
    private router: Router,
    private navbarService: NavbarService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private roleAccessService: RoleAccessService
  ) { }

  // ✅ CORREGIR: Getter para módulos principales (CON y SIN submenu)
  get modulosPrincipales(): MenuItem[] {
    return this.menuItems.filter(item => item.isPrincipal); // ← QUITAR && !item.hasSubmenu
  }

  // ✅ CORREGIR: Getter para módulos principales CON submenu
  get modulosPrincipalesConSubmenu(): MenuItem[] {
    return this.menuItems.filter(item => item.isPrincipal && item.hasSubmenu);
  }

  // ✅ MANTENER: Getter para módulos secundarios  
  get modulosSecundarios(): MenuItem[] {
    return this.menuItems.filter(item => !item.isPrincipal);
  }

  ngOnInit() {
    this.loadMenu();
    this.loadUserInfo();
    this.setupNotifications();
    this.resetNavbarState();
    
    // Debug info para desarrollo
    if (this.authService.isLoggedIn()) {
      console.log('🔍 Navbar: Información de debug de autenticación y permisos');
      this.authService.debugAuthInfo();
    }
  }

  ngOnDestroy() {
    // Limpiar suscripciones
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.notificationService.disconnect();
  }

  private setupNotifications() {
    // Suscribirse al contador de notificaciones no leídas
    const countSub = this.notificationService.unreadCount$.subscribe(count => {
      this.notificationCount = count;
    });

    // Suscribirse a las notificaciones
    const notificationsSub = this.notificationService.notifications$.subscribe(notifications => {
      this.notifications = notifications;
    });

    this.subscriptions.push(countSub, notificationsSub);
    
    // ✅ NUEVO: Conectar a alertas de stock bajo automáticamente
    this.notificationService.conectarAlertasStock();
  }

  private loadUserInfo() {
    // Obtener username del token JWT
    const baseUsername = this.authService.getUsername();
    const userRole = this.authService.getUserRole();
    
    // Mostrar solo el username, sin el rol
    this.username = baseUsername;
    
    // Debug para desarrollo
    if (userRole) {
      console.log(`🔍 Navbar: Usuario cargado - ${this.username} con rol ${userRole}`);
      this.roleAccessService.debugPermissions();
    }
  }

  private resetNavbarState() {
    this.isExpanded = false;
    this.expandedSubmenu = null;
    this.navbarToggled.emit(false);
  }

  private loadMenu() {
    this.navbarService.getMenuItems().subscribe((items: MenuItem[]) => {
      this.menuItems = items;
      console.log('Menú generado automáticamente:', this.menuItems);
    });
  }

  toggleNavbar() {
    this.isExpanded = !this.isExpanded;
    this.navbarToggled.emit(this.isExpanded); // ✅ Esto emite un boolean
    if (!this.isExpanded) {
      this.expandedSubmenu = null;
    }
  }

  getSubmenuIcon(label: string): string {
    const iconMap: { [key: string]: string } = {
      'Empleados': 'bi-person-badge-fill',
      'Usuarios': 'bi-person-fill',
      'Listado': 'bi-list-ul', 
      'Usuarios Sistema': 'bi-gear-fill',
      'Reportes': 'bi-bar-chart-fill',
      'Configuración': 'bi-gear-fill',
      'Gestión de Pedidos': 'fa-solid fa-list-check',
      'Cocina': 'fa-solid fa-fire',
      'Tomar Pedido': 'fa-solid fa-pen-to-square'
    };
    
    return iconMap[label] || 'bi-file-earmark';
  }

  toggleSubmenu(itemId: string) {
    if (this.expandedSubmenu === itemId) {
      this.expandedSubmenu = null;
    } else {
      this.expandedSubmenu = itemId;
    }
  }

  logout() {
    console.log('Logout clicked');
    this.authService.logout(); // Esto ya navega a /login y limpia el token
  }



  showNotifications() {
    // Marcar notificaciones como leídas
    this.notificationService.markAsRead();
    
    if (this.notifications.length === 0) {
      Swal.fire({
        title: 'Notificaciones',
        text: 'No hay notificaciones nuevas',
        icon: 'info',
        confirmButtonText: 'OK',
        confirmButtonColor: '#84C473'
      });
      return;
    }

    // Crear HTML para mostrar las notificaciones
    const notificationsHtml = this.notifications
      .slice(0, 5) // Mostrar solo las últimas 5
      .map(notification => `
        <div class="notification-item" style="border-left: 4px solid #28a745; padding: 10px; margin: 5px 0; background: #f8f9fa;">
          <div style="font-weight: bold; color: #28a745;">${this.getTipoNotificacionTexto(notification.tipo)}</div>
          <div style="margin: 5px 0;">${notification.mensaje}</div>
          <div style="font-size: 0.8em; color: #6c757d;">${this.formatearFecha(notification.timestamp)}</div>
        </div>
      `).join('');

    Swal.fire({
      title: 'Notificaciones Recientes',
      html: `
        <div style="max-height: 400px; overflow-y: auto; text-align: left;">
          ${notificationsHtml}
        </div>
        ${this.notifications.length > 5 ? '<p style="text-align: center; color: #6c757d; margin-top: 10px;">Mostrando las últimas 5 notificaciones</p>' : ''}
      `,
      showCancelButton: true,
      confirmButtonText: 'Limpiar Todo',
      cancelButtonText: 'Cerrar',
      confirmButtonColor: '#e74c3c',
      cancelButtonColor: '#6c757d',
      width: '600px'
    }).then((result) => {
      if (result.isConfirmed) {
        this.notificationService.clearNotifications();
        Swal.fire({
          title: 'Notificaciones Limpiadas',
          text: 'Todas las notificaciones han sido eliminadas',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }
    });
  }

  private getTipoNotificacionTexto(tipo: string): string {
    switch (tipo) {
      case 'NUEVO_PRODUCTO': return '📦 Nuevo Producto';
      case 'PRODUCTO_ACTUALIZADO': return '✏️ Producto Actualizado';
      case 'PRODUCTO_ELIMINADO': return '🗑️ Producto Eliminado';
      case 'STOCK_BAJO': return '⚠️ Alerta Stock Bajo';
      case 'TEST': return '🧪 Prueba';
      default: return '📢 Notificación';
    }
  }

  private formatearFecha(timestamp: string): string {
    const fecha = new Date(timestamp);
    return fecha.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
