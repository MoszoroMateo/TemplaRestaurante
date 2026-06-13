import { Component, signal, afterNextRender, inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar';
import { SidebarComponent } from './components/sidebar/sidebar';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, SidebarComponent],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class LayoutComponent {
  private router = inject(Router);

  protected sidebarOpen = signal(true);

  constructor() {
    afterNextRender(() => {
      this.sidebarOpen.set(window.innerWidth >= 768);
    });
  }

  protected toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }

  protected closeMobileSidebar(): void {
    if (window.innerWidth < 768) {
      this.sidebarOpen.set(false);
    }
  }

  protected logout(): void {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}
