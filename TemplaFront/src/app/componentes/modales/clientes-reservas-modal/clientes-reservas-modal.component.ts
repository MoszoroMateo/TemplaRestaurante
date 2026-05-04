import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReporteService } from '../../../services/reporte.service';
import { ReporteClientesReservasDTO, ClienteReservaChartData } from '../../models/ReporteClientesReservasDTO';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

declare var google: any;

@Component({
  selector: 'app-clientes-reservas-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" (click)="onClose()" *ngIf="visible">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>👥 Clientes con Más Reservas</h2>
          <button class="close-btn" (click)="onClose()">×</button>
        </div>

        <div class="modal-body" *ngIf="!loading">
          <!-- Controles superiores -->
          <div class="controls-section">
            <div class="info-badge">
              <span class="info-icon">📊</span>
              <span>Total de clientes: {{datos.length}}</span>
            </div>
            
            <div class="action-buttons">
              <button class="btn btn-primary" (click)="actualizarDatos()" [disabled]="loading">
                <i class="fas fa-sync-alt me-1"></i>
                Actualizar
              </button>
              <button class="btn btn-success" (click)="exportarPDF()" [disabled]="loading || datos.length === 0">
                <i class="fas fa-file-pdf me-1"></i>
                Exportar PDF
              </button>
            </div>
          </div>

          <!-- Contenido principal -->
          <div class="content-grid" *ngIf="datos.length > 0">
            <!-- Gráfico de torta -->
            <div class="chart-container">
              <h3>📈 Distribución de Reservas por Cliente</h3>
              <div id="pieChart" class="pie-chart"></div>
            </div>

            <!-- Tabla de datos -->
            <div class="table-container">
              <h3>📋 Detalle de Clientes</h3>
              <div class="table-responsive">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Email</th>
                      <th>Teléfono</th>
                      <th>Total Reservas</th>
                      <th>Evento Favorito</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let cliente of datos; let i = index" [class.highlight]="i < 3">
                      <td class="cliente-nombre">
                        <span class="ranking" *ngIf="i < 3">🏆</span>
                        {{cliente.nombreCompleto}}
                      </td>
                      <td class="cliente-email">{{cliente.email}}</td>
                      <td class="cliente-telefono">{{cliente.telefono}}</td>
                      <td class="total-reservas">
                        <span class="badge badge-primary">{{cliente.totalReservas}}</span>
                      </td>
                      <td class="evento-favorito">{{cliente.eventoMasFrecuente}}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Estado sin datos -->
          <div class="no-data" *ngIf="datos.length === 0 && !loading">
            <div class="no-data-icon">📭</div>
            <h3>No hay datos disponibles</h3>
            <p>No se encontraron clientes con reservas en el sistema.</p>
          </div>
        </div>

        <!-- Loading state -->
        <div class="modal-body loading-state" *ngIf="loading">
          <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Cargando datos de clientes...</p>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="onClose()">
            Cerrar
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
      max-width: 1200px;
      width: 95%;
      max-height: 90vh;
      overflow-y: auto;
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from { opacity: 0; transform: translateY(-50px); }
      to { opacity: 1; transform: translateY(0); }
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
      color: white;
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
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-btn:hover {
      background-color: rgba(255, 255, 255, 0.2);
    }

    .modal-body {
      padding: 24px;
    }

    .controls-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e5e7eb;
    }

    .info-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #f3f4f6;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 500;
    }

    .info-icon {
      font-size: 1.2rem;
    }

    .action-buttons {
      display: flex;
      gap: 12px;
    }

    .btn {
      padding: 10px 16px;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-primary {
      color: var(--templa-beige);
      background: linear-gradient(135deg, var(--templa-green) 0%, var(--templa-hovergreen) 100%);
      border-color: var(--templa-green);
    }

    .btn-primary:hover:not(:disabled) {
      background: linear-gradient(135deg, var(--templa-hovergreen) 0%, var(--templa-green) 100%);
      border-color: var(--templa-hovergreen);
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(0,0,0,0.2);
    }

    .btn-outline-primary {
      background: var(--templa-beige);
      color: var(--templa-dark-green);
      border: 2px solid var(--templa-dark-green);
    }

    .btn-outline-primary:hover:not(:disabled) {
      background: var(--templa-dark-green);
      color: var(--templa-beige);
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(76, 132, 107, 0.3);
    }

    .btn-success {
      background-color: #198754;
      color: white;
      border: none;
    }

    .btn-success:hover:not(:disabled) {
      background-color: #157347;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(25, 135, 84, 0.3);
    }

    .btn-secondary {
      background: var(--templa-brown);
      color: var(--templa-beige);
      border: 2px solid var(--templa-gold);
    }

    .btn-secondary:hover {
      background: var(--templa-dark-green);
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(76, 132, 107, 0.3);
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .content-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }

    .chart-container, .table-container {
      background: rgba(255, 255, 255, 0.7);
      border: 1px solid var(--templa-gold);
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .chart-container h3, .table-container h3 {
      margin: 0 0 16px 0;
      color: #1f2937;
      font-size: 1.125rem;
    }

    .pie-chart {
      height: 400px;
      width: 100%;
    }

    .table-responsive {
      overflow-x: auto;
    }

    .table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .table th {
      background: linear-gradient(135deg, var(--templa-gold) 0%, var(--templa-brown) 100%);
      padding: 12px 8px;
      text-align: left;
      font-weight: 600;
      color: var(--templa-beige);
      border-bottom: 2px solid var(--templa-dark-green);
      text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
    }

    .table td {
      padding: 12px 8px;
      border-bottom: 1px solid #e5e7eb;
    }

    .table tr.highlight {
      background: linear-gradient(135deg, rgba(212, 165, 116, 0.2) 0%, rgba(76, 132, 107, 0.1) 100%);
      border-left: 4px solid var(--templa-gold);
    }

    .ranking {
      margin-right: 8px;
    }

    .cliente-nombre {
      font-weight: 500;
      color: #1f2937;
    }

    .badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .badge-primary {
      background: linear-gradient(135deg, var(--templa-dark-green) 0%, var(--templa-brown) 100%);
      color: var(--templa-beige);
      border: 1px solid var(--templa-gold);
      text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
    }

    .no-data {
      text-align: center;
      padding: 60px 20px;
      color: #6b7280;
    }

    .no-data-icon {
      font-size: 4rem;
      margin-bottom: 16px;
    }

    .loading-state {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
    }

    .loading-spinner {
      text-align: center;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f4f6;
      border-top: 4px solid #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .modal-footer {
      padding: 20px 24px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: flex-end;
    }

    @media (max-width: 768px) {
      .content-grid {
        grid-template-columns: 1fr;
      }
      
      .controls-section {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }
      
      .action-buttons {
        justify-content: center;
      }
    }
  `]
})
export class ClientesReservasModalComponent implements OnInit, OnDestroy {
  datos: ReporteClientesReservasDTO[] = [];
  loading = false;
  visible = false;

  constructor(private reporteService: ReporteService) {}

  ngOnInit() {
    this.loadGoogleCharts();
  }

  ngOnDestroy() {
    // Cleanup si es necesario
  }

  show() {
    this.visible = true;
    this.cargarDatos();
  }

  onClose() {
    this.visible = false;
  }

  private loadGoogleCharts() {
    if (typeof google !== 'undefined' && google.charts) {
      google.charts.load('current', { packages: ['corechart'] });
    } else {
      // Cargar Google Charts si no está disponible
      const script = document.createElement('script');
      script.src = 'https://www.gstatic.com/charts/loader.js';
      script.onload = () => {
        google.charts.load('current', { packages: ['corechart'] });
      };
      document.head.appendChild(script);
    }
  }

  cargarDatos() {
    this.loading = true;
    
    this.reporteService.getClientesConMasReservas().subscribe({
      next: (data) => {
        this.datos = data;
        this.loading = false;
        
        // Generar gráfico después de cargar datos
        setTimeout(() => this.generarGrafico(), 100);
      },
      error: (error) => {
        console.error('Error al cargar datos de clientes:', error);
        this.loading = false;
        Swal.fire({
          title: 'Error',
          text: 'No se pudieron cargar los datos de clientes con reservas',
          icon: 'error',
          confirmButtonColor: '#e74c3c'
        });
      }
    });
  }

  actualizarDatos() {
    this.cargarDatos();
  }

  private generarGrafico() {
    if (this.datos.length === 0) return;

    google.charts.setOnLoadCallback(() => {
      const chartData = this.prepararDatosGrafico();
      
      const data = new google.visualization.DataTable();
      data.addColumn('string', 'Cliente');
      data.addColumn('number', 'Reservas');
      data.addRows(chartData);

      const options = {
        title: 'Distribución de Reservas por Cliente',
        titleTextStyle: {
          fontSize: 16,
          bold: true,
          color: '#4c846b' // templa-dark-green
        },
        pieHole: 0.4, // Donut chart
        colors: [
          '#4c846b', // templa-dark-green
          '#9f763d', // templa-brown
          '#d4a574', // templa-gold
          '#f4eadd', // templa-beige (darker variant)
          '#5a9472', // green variant
          '#b8894a', // gold variant
          '#6b4e3d', // brown variant
          '#8faa9b'  // light green variant
        ],
        backgroundColor: 'transparent',
        legend: {
          position: 'right',
          alignment: 'center',
          textStyle: { 
            fontSize: 12,
            color: '#4c846b'
          }
        },
        chartArea: {
          left: 20,
          top: 50,
          width: '70%',
          height: '80%'
        },
        tooltip: {
          trigger: 'selection',
          isHtml: true,
          textStyle: {
            color: '#4c846b'
          }
        }
      };

      const chart = new google.visualization.PieChart(document.getElementById('pieChart'));
      chart.draw(data, options);
    });
  }

  private prepararDatosGrafico(): any[] {
    // Tomar solo los top 8 clientes para que el gráfico sea legible
    return this.datos.slice(0, 8).map(cliente => [
      `${cliente.nombreCompleto} (${cliente.totalReservas})`,
      cliente.totalReservas
    ]);
  }

  exportarPDF() {
    if (this.datos.length === 0) {
      Swal.fire({
        title: 'Sin datos',
        text: 'No hay datos para exportar',
        icon: 'warning',
        confirmButtonColor: '#f5d76e'
      });
      return;
    }

    try {
      const doc = new jsPDF();
      
      // Título del reporte con fondo degradado
      doc.setFillColor(244, 234, 221); // #F4EADD
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setFontSize(18);
      doc.setTextColor(105, 104, 72); // #696848
      doc.setFont('helvetica', 'bold');
      doc.text('REPORTE: CLIENTES CON MAS RESERVAS', 20, 25);
      
      // Información de la fecha de generación
      doc.setFontSize(10);
      doc.setTextColor(117, 81, 67); // #755143
      doc.setFont('helvetica', 'normal');
      const fechaGeneracion = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.text(`Generado el: ${fechaGeneracion}`, 20, 35);
      
      // Estadísticas generales
      doc.setFontSize(10);
      doc.setTextColor(117, 81, 67);
      const totalReservas = this.datos.reduce((sum, cliente) => sum + cliente.totalReservas, 0);
      doc.text(`Total de clientes: ${this.datos.length} | Total de reservas: ${totalReservas}`, 20, 50);

      // Tabla de datos
      const tableData = this.datos.map((cliente, index) => [
        (index + 1).toString(),
        cliente.nombreCompleto,
        cliente.email,
        cliente.telefono,
        cliente.totalReservas.toString(),
        cliente.eventoMasFrecuente
      ]);

      autoTable(doc, {
        head: [['#', 'Cliente', 'Email', 'Telefono', 'Reservas', 'Evento Favorito']],
        body: tableData,
        startY: 60,
        theme: 'grid',
        headStyles: {
          fillColor: [105, 104, 72], // #696848 - Color templa-brown
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [117, 81, 67] // #755143 - Color templa-dark-brown
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250]
        },
        styles: {
          cellPadding: 3
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 10 },
          1: { cellWidth: 35 },
          2: { cellWidth: 40 },
          3: { cellWidth: 25 },
          4: { halign: 'center', cellWidth: 15 },
          5: { cellWidth: 30 }
        }
      });

      // Guardar PDF
      doc.save(`reporte-clientes-reservas-${new Date().toISOString().split('T')[0]}.pdf`);
      
      Swal.fire({
        title: '¡Éxito!',
        text: 'El reporte se ha exportado correctamente',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });

    } catch (error) {
      console.error('Error al generar PDF:', error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudo generar el archivo PDF',
        icon: 'error',
        confirmButtonColor: '#e74c3c'
      });
    }
  }
}