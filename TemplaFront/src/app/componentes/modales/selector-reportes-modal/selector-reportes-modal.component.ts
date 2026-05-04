import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// ✅ Tipos de reportes disponibles
export interface TipoReporte {
  id: string;
  titulo: string;
  descripcion: string;
  icono: string;
  tipoChart?: 'bar' | 'pie' | 'line';
}

@Component({
  selector: 'app-selector-reportes-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" (click)="onCancel()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>📊 Seleccionar Reporte</h2>
          <button class="close-btn" (click)="onCancel()">×</button>
        </div>

        <div class="modal-body">
          <p class="modal-subtitle">Elige el tipo de reporte que deseas generar:</p>
          
          <div class="reportes-grid">
            <div 
              *ngFor="let reporte of tiposReportes" 
              class="reporte-card"
              (click)="seleccionarReporte(reporte)"
              [class.selected]="reporteSeleccionado?.id === reporte.id"
            >
              <div class="reporte-icon">{{reporte.icono}}</div>
              <div class="reporte-info">
                <h3>{{reporte.titulo}}</h3>
                <p>{{reporte.descripcion}}</p>
                <div class="reporte-chart-type" *ngIf="reporte.tipoChart">
                  <span class="chart-badge">
                    {{reporte.tipoChart === 'pie' ? '🥧 Gráfico de Torta' : 
                      reporte.tipoChart === 'bar' ? '📊 Gráfico de Barras' : 
                      '📈 Gráfico de Líneas'}}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="onCancel()">
            Cancelar
          </button>
          <button 
            class="btn btn-primary" 
            (click)="onConfirm()" 
            [disabled]="!reporteSeleccionado"
          >
            Generar Reporte
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .modal-container {
      background: var(--templa-beige);
      border: 2px solid var(--templa-gold);
      border-radius: 12px;
      box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.3);
      max-width: 700px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-50px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .modal-header {
      padding: 1.5rem 2rem;
      background: linear-gradient(135deg, var(--templa-brown) 0%, var(--templa-dark-green) 100%);
      border-bottom: 3px solid var(--templa-gold);
      border-top-left-radius: 10px;
      border-top-right-radius: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      min-height: 75px;
    }

    .modal-header h2 {
      margin: 0;
      color: #ffffff;
      font-size: 1.4rem;
      font-weight: 700;
      font-family: var(--templa-font-title);
      text-shadow: 2px 2px 6px rgba(0,0,0,0.5);
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #ffffff;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    }

    .close-btn:hover {
      background-color: rgba(255, 255, 255, 0.2);
      color: var(--templa-gold);
      transform: scale(1.1);
    }

    .modal-body {
      padding: 24px;
    }

    .modal-subtitle {
      margin: 0 0 20px 0;
      color: #6b7280;
      font-size: 1rem;
    }

    .reportes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
    }

    .reporte-card {
      border: 2px solid var(--templa-gold);
      border-radius: 8px;
      padding: 20px;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: flex-start;
      gap: 16px;
      background: rgba(255, 255, 255, 0.7);
    }

    .reporte-card:hover {
      border-color: var(--templa-dark-green);
      box-shadow: 0 4px 12px rgba(76, 132, 107, 0.3);
      transform: translateY(-2px);
    }

    .reporte-card.selected {
      border-color: var(--templa-dark-green);
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(76, 132, 107, 0.1) 100%);
      box-shadow: 0 6px 15px rgba(76, 132, 107, 0.25);
    }

    .reporte-icon {
      font-size: 2.5rem;
      flex-shrink: 0;
    }

    .reporte-info {
      flex: 1;
    }

    .reporte-info h3 {
      margin: 0 0 8px 0;
      color: #1f2937;
      font-size: 1.125rem;
      font-weight: 600;
    }

    .reporte-info p {
      margin: 0 0 12px 0;
      color: #6b7280;
      font-size: 0.875rem;
      line-height: 1.4;
    }

    .chart-badge {
      background: linear-gradient(135deg, var(--templa-dark-green) 0%, var(--templa-brown) 100%);
      color: var(--templa-beige);
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
      border: 1px solid var(--templa-gold);
      text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
    }

    .modal-footer {
      padding: 20px 24px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .btn {
      padding: 10px 20px;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
    }

    .btn-secondary {
      background-color: #f3f4f6;
      color: #374151;
    }

    .btn-secondary:hover {
      background-color: #e5e7eb;
    }

    .btn-primary {
      background-color: #3b82f6;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #2563eb;
    }

    .btn-primary:disabled {
      background-color: #9ca3af;
      cursor: not-allowed;
    }
  `]
})
export class SelectorReportesModalComponent implements OnInit {
  reporteSeleccionado: TipoReporte | null = null;
  
  tiposReportes: TipoReporte[] = [
    {
      id: 'pedidos-fecha',
      titulo: 'Reporte de Pedidos por Fecha',
      descripcion: 'Visualiza la cantidad de pedidos realizados en un rango de fechas específico',
      icono: '📅',
      tipoChart: 'bar'
    },
    {
      id: 'clientes-reservas',
      titulo: 'Clientes con Más Reservas',
      descripcion: 'Analiza qué clientes realizan más reservas y sus eventos favoritos',
      icono: '👥',
      tipoChart: 'pie'
    },
    {
      id: 'menus-pedidos',
      titulo: 'Menús Más Pedidos',
      descripcion: 'Muestra los menús más solicitados y su distribución porcentual',
      icono: '🍽️',
      tipoChart: 'pie'
    }
    // ✅ Puedes agregar más reportes aquí en el futuro
    // {
    //   id: 'productos-stock',
    //   titulo: 'Stock de Productos',
    //   descripcion: 'Estado actual del inventario de productos',
    //   icono: '📦',
    //   tipoChart: 'bar'
    // }
  ];

  ngOnInit() {
    // Auto-seleccionar el primer reporte por defecto
    // this.reporteSeleccionado = this.tiposReportes[0];
  }

  seleccionarReporte(reporte: TipoReporte) {
    this.reporteSeleccionado = reporte;
  }

  onConfirm() {
    if (this.reporteSeleccionado) {
      // Emitir evento al componente padre
      this.confirmar.emit(this.reporteSeleccionado);
    }
  }

  onCancel() {
    this.cancelar.emit();
  }

  // ✅ Outputs para comunicarse con el componente padre
  @Output() confirmar = new EventEmitter<TipoReporte>();
  @Output() cancelar = new EventEmitter<void>();
}