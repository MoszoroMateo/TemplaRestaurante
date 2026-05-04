import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { NavbarComponent } from './componentes/navbar/navbar.component';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'TemplaFront';
  showNavbar = false;
  isNavbarExpanded = false;

  constructor(private router: Router) {
    this.checkCurrentRoute();
  }

  ngOnInit() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateNavbarVisibility(event.url);
      });
  }

  onNavbarToggled(isExpanded: boolean) {
    this.isNavbarExpanded = isExpanded;
    console.log('Navbar expandido:', isExpanded); // Para debug
  }

  private checkCurrentRoute() {
    const currentUrl = this.router.url;
    this.updateNavbarVisibility(currentUrl);
  }

  private updateNavbarVisibility(url: string) {
    const hiddenNavbarRoutes = ['/login', '/', '/mp-resultado', '/nueva-reserva'];
    this.showNavbar = !hiddenNavbarRoutes.some(route => 
      url === route || url.startsWith(route + '?') || url.startsWith(route + '#')
    );
  }
}
