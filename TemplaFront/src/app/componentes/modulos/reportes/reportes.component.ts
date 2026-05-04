import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { RoleAccessService } from '../../../services/role-access.service';

interface TipoReporte {
  id: string;
  titulo: string;
  descripcion: string;
  icono: string;
  categoria: 'reservas' | 'pedidos' | 'stock' | 'platos' | 'menus';
  ruta: string;
  requierePermiso?: string;
}

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.css'
})
export class ReportesComponent implements OnInit {
  
  reportesDisponibles: TipoReporte[] = [
    {
      id: 'reservas-fecha',
      titulo: 'Reservas por Fecha/Horario',
      descripcion: 'Visualiza estadísticas de reservas agrupadas por fecha u horario',
      icono: '📅',
      categoria: 'reservas',
      ruta: '/reportes/reservas-fecha',
      requierePermiso: 'reservas'
    },
    {
      id: 'clientes-reservas',
      titulo: 'Clientes con Más Reservas',
      descripcion: 'Identifica los clientes más frecuentes con gráfico de torta',
      icono: '👥',
      categoria: 'reservas',
      ruta: '/reportes/clientes-reservas',
      requierePermiso: 'reservas'
    },
    {
      id: 'pedidos-fecha',
      titulo: 'Pedidos por Fecha',
      descripcion: 'Analiza el volumen de pedidos en un período específico',
      icono: '📊',
      categoria: 'pedidos',
      ruta: '/reportes/pedidos-fecha',
      requierePermiso: 'pedidos'
    },
    {
      id: 'stock-bajo',
      titulo: 'Productos con Stock Bajo',
      descripcion: 'Alerta sobre productos que necesitan reposición urgente',
      icono: '⚠️',
      categoria: 'stock',
      ruta: '/reportes/stock-bajo',
      requierePermiso: 'productos'
    },
    {
      id: 'platos-productos',
      titulo: 'Platos por Cantidad de Productos',
      descripcion: 'Muestra la complejidad de cada plato según sus ingredientes',
      icono: '🍽️',
      categoria: 'platos',
      ruta: '/reportes/platos-productos',
      requierePermiso: 'platos'
    },
    {
      id: 'menus-pedidos',
      titulo: 'Menús Más Pedidos',
      descripcion: 'Gráfico de torta con los menús más solicitados y su distribución',
      icono: '📋',
      categoria: 'menus',
      ruta: '/reportes/menus-pedidos',
      requierePermiso: 'menus'
    }
  ];

  reportesFiltrados: TipoReporte[] = [];

  constructor(
    private router: Router,
    private authService: AuthService,
    private roleAccessService: RoleAccessService
  ) {}

  ngOnInit() {
    this.filtrarReportesPorPermisos();
  }

  filtrarReportesPorPermisos() {
    this.reportesFiltrados = this.reportesDisponibles.filter(reporte => {
      if (!reporte.requierePermiso) return true;
      
      // Mapear el permiso requerido al método correspondiente
      switch(reporte.requierePermiso) {
        case 'reservas':
          return this.roleAccessService.canAccessReservas();
        case 'pedidos':
          return this.roleAccessService.canAccessPedidos();
        case 'productos':
          return this.roleAccessService.canAccessProductos();
        case 'platos':
          return this.roleAccessService.canAccessPlatos();
        case 'menus':
          return this.roleAccessService.canAccessMenu();
        default:
          return false;
      }
    });
  }

  abrirReporte(reporte: TipoReporte) {
    this.router.navigate([reporte.ruta]);
  }

  getReportesPorCategoria(categoria: string): TipoReporte[] {
    return this.reportesFiltrados.filter(r => r.categoria === categoria);
  }
}
