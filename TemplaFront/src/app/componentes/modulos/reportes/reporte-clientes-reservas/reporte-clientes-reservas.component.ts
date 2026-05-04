import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReporteService } from '../../../../services/reporte.service';
import { ReporteClientesReservasDTO } from '../../../models/ReporteClientesReservasDTO';
import { AlertService } from '../../../../services/alert.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

declare var google: any;

@Component({
  selector: 'app-reporte-clientes-reservas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reporte-clientes-reservas.component.html',
  styleUrl: './reporte-clientes-reservas.component.css'
})
export class ReporteClientesReservasComponent implements OnInit {
  datos: ReporteClientesReservasDTO[] = [];
  loading = false;

  constructor(
    private router: Router,
    private reporteService: ReporteService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    // Cargar Google Charts
    if (typeof google !== 'undefined' && google.charts) {
      google.charts.load('current', { 'packages': ['corechart'] });
      google.charts.setOnLoadCallback(() => this.cargarDatos());
    }
  }

  volver() {
    this.router.navigate(['/reportes']);
  }

  cargarDatos() {
    this.loading = true;
    
    this.reporteService.getClientesConMasReservas().subscribe({
      next: (data) => {
        console.log('Datos recibidos:', data);
        this.datos = data;
        this.loading = false;
        
        // Generar gráfico después de cargar datos
        setTimeout(() => this.generarGrafico(), 100);
      },
      error: (error) => {
        console.error('Error al cargar datos de clientes:', error);
        this.loading = false;
        this.alertService.showError('Error', 'No se pudieron cargar los datos de clientes con reservas.');
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
        pieHole: 0.4,
        colors: [
          '#4c846b', '#9f763d', '#d4a574', '#f4eadd',
          '#5a9472', '#b8894a', '#6b4e3d', '#8faa9b'
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
          top: 20,
          width: '70%',
          height: '85%'
        }
      };

      const chart = new google.visualization.PieChart(document.getElementById('pieChart'));
      chart.draw(data, options);
    });
  }

  private prepararDatosGrafico(): any[] {
    return this.datos.slice(0, 8).map(cliente => [
      `${cliente.nombreCompleto} (${cliente.totalReservas})`,
      cliente.totalReservas
    ]);
  }

  exportarPDF() {
    if (this.datos.length === 0) {
      this.alertService.showInfo('Sin datos', 'No hay datos para exportar.');
      return;
    }

    try {
      const doc = new jsPDF();
      
      doc.setFillColor(244, 234, 221);
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setFontSize(18);
      doc.setTextColor(105, 104, 72);
      doc.setFont('helvetica', 'bold');
      doc.text('REPORTE: CLIENTES CON MAS RESERVAS', 20, 25);
      
      doc.setFontSize(10);
      doc.setTextColor(117, 81, 67);
      doc.setFont('helvetica', 'normal');
      const fechaGeneracion = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.text(`Generado el: ${fechaGeneracion}`, 20, 35);
      
      const totalReservas = this.datos.reduce((sum, cliente) => sum + cliente.totalReservas, 0);
      doc.text(`Total de clientes: ${this.datos.length} | Total de reservas: ${totalReservas}`, 20, 50);

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
          fillColor: [105, 104, 72],
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [117, 81, 67]
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250]
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

      doc.save(`reporte-clientes-reservas-${new Date().toISOString().split('T')[0]}.pdf`);
      
      this.alertService.showSuccess('PDF Generado', 'El reporte se ha exportado correctamente.');

    } catch (error) {
      console.error('Error al generar PDF:', error);
      this.alertService.showError('Error', 'No se pudo generar el archivo PDF.');
    }
  }

  exportarExcel() {
    try {
      const excelData = this.datos.map(cliente => ({
        'Cliente': cliente.nombreCompleto,
        'Email': cliente.email,
        'Teléfono': cliente.telefono,
        'Total Reservas': cliente.totalReservas,
        'Evento Favorito': cliente.eventoMasFrecuente
      }));

      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(excelData);
      ws['!cols'] = [
        { wch: 35 },
        { wch: 30 },
        { wch: 15 },
        { wch: 15 },
        { wch: 25 }
      ];

      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Clientes con Más Reservas');

      const fechaHoy = new Date().toISOString().split('T')[0];
      const nombreArchivo = `reporte-clientes-reservas-${fechaHoy}.xlsx`;

      XLSX.writeFile(wb, nombreArchivo);

      this.alertService.showSuccess('Excel Generado', 'El reporte se ha exportado correctamente a Excel.');

    } catch (error) {
      console.error('Error al generar Excel:', error);
      this.alertService.showError('Error', 'No se pudo generar el archivo Excel.');
    }
  }
}
