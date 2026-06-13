import { Component, inject, input, output, signal, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth-service';
import { NotificationService } from '../../../services/notificacion.service';
import { LucideBell, LucideChevronFirst, LucideChevronLast } from '@lucide/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    LucideBell, LucideChevronFirst, LucideChevronLast,
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class NavbarComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  collapsed = input(false);
  toggleSidebar = output<void>();
  logout = output<void>();

  // ── UI State ──
  protected notifOpen = signal(false);

  // ── Reactive data ──
  protected notifications = this.notificationService.notifications;
  protected unread = this.notificationService.unread;
  protected unreadCount = this.notificationService.unreadCount;
  protected connected = this.notificationService.connected;

  ngOnInit(): void {
    this.notificationService.connect();
  }

  ngOnDestroy(): void {
    this.notificationService.disconnect();
  }

  // ── Getters (simple synchronous) ──
  protected get username(): string {
    return this.authService.getUsername();
  }

  protected get role(): string {
    return this.authService.getUserRole() ?? '';
  }

  protected get roleLabel(): string {
    const labels: Record<string, string> = {
      ADMINISTRADOR: 'Admin',
      ENCARGADO: 'Manager',
      MOZO: 'Waiter',
      COCINA: 'Chef',
      CLIENTE: 'Client',
    };
    return labels[this.role] ?? this.role;
  }

  protected get pageTitle(): string {
    const path = this.router.url.split('/').filter(Boolean)[0] || 'principal';
    const titles: Record<string, string> = {
      personas: 'Staff',
      usuarios: 'Users',
      productos: 'Products',
      platos: 'Dishes',
      menu: 'Menu',
      mesas: 'Tables',
      reservas: 'Reservations',
      pedidos: 'Orders',
      cocina: 'Live Kitchen',
      reportes: 'Reports',
      perfil: 'My Profile',
    };
    if (path === 'principal') {
      return this.role === 'ADMINISTRADOR' ? 'Dashboard' : 'Home';
    }
    return titles[path] ?? (this.role === 'ADMINISTRADOR' ? 'Dashboard' : 'Home');
  }

  protected get shiftLabel(): string {
    const h = new Date().getHours();
    if (h >= 6 && h < 12) return 'Morning';
    if (h >= 12 && h < 18) return 'Afternoon';
    return 'Night';
  }

  // ── Actions ──
  protected toggleNotifPanel(): void {
    this.notifOpen.update(v => !v);
    if (this.notifOpen()) {
      this.notificationService.markAsRead();
    }
  }

  protected markAsRead(): void {
    this.notificationService.markAsRead();
  }

  protected clearAll(): void {
    this.notificationService.clearAll();
  }

  protected navigateToProfile(): void {
    this.router.navigate(['/perfil']);
  }

  protected onBack(): void {
    this.router.navigate(['/principal']);
  }
}