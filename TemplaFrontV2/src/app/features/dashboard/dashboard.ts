import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RolUsuario } from '../../core/models/auth.model';
import { AuthService } from '../../core/services/auth-service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  
  username: string = '';
  role: RolUsuario | null = null;
  isAdmin: boolean = false;

  ngOnInit(): void {
    //this.username = this.authService.getUsername(); // Asegurate de que tu service devuelva el 'sub' o el nombre
    this.role = this.authService.getUserRole();
    this.isAdmin = this.role === RolUsuario.ADMINISTRADOR;
  }
}
