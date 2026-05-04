import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReporteService } from '../../../../services/reporte.service';
import { ReportePlatoProductosDTO } from '../../../models/ReportePlatoProductosDTO';
import { AlertService } from '../../../../services/alert.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

declare var google: any;

@Component({
  selector: 'app-reporte-platos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reporte-platos.component.html',
  styleUrl: './reporte-platos.component.css'
})
export class ReportePlatosComponent implements OnInit {
  
  datosPlatos: ReportePlatoProductosDTO[] = [];
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
    
    this.reporteService.getPlatosPorCantidadProductos().subscribe({
      next: (data: ReportePlatoProductosDTO[]) => {
        console.log('Datos recibidos:', data);
        this.datosPlatos = data;
        this.loading = false;
        
        setTimeout(() => this.crearGrafico(), 100);
      },
      error: (error: any) => {
        console.error('Error al cargar datos de platos:', error);
        this.loading = false;
        this.alertService.showError('Error', 'No se pudieron cargar los datos de platos.');
      }
    });
  }

  private crearGrafico() {
    if (this.datosPlatos.length === 0) return;

    google.charts.setOnLoadCallback(() => {
      const chartData: any[] = [['Plato', 'Cantidad de Productos']];
      
      this.datosPlatos.forEach(item => {
        chartData.push([item.nombrePlato, item.cantidadProductos]);
      });

      const dataTable = google.visualization.arrayToDataTable(chartData);

      const options = {
       
      chartArea: { width: '65%', height: '70%' },
       hAxis: {
      title: 'Cantidad de Productos',
      minValue: 0,
      textStyle: { color: '#755143', fontSize: 12 },
      titleTextStyle: { color: '#696848', fontSize: 13, bold: true }
     },
     vAxis: {
     title: 'Plato',
     textStyle: { color: '#755143', fontSize: 12 },
    titleTextStyle: { color: '#696848', fontSize: 13, bold: true }
},
        legend: { position: 'none' },
        colors: ['#4CAC6B']
      };

      const chart = new google.visualization.BarChart(document.getElementById('chart-platos'));
      chart.draw(dataTable, options);
    });
  }

  exportarPDF() {
    if (this.datosPlatos.length === 0) {
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
      doc.text('REPORTE DE PLATOS Y PRODUCTOS', 20, 25);
      
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
      
      const tableData = this.datosPlatos.map((item, index) => [
        (index + 1).toString(),
        item.nombrePlato,
        item.cantidadProductos.toString(),
        item.tipoPlato,
        item.platoActivo ? 'Activo' : 'Inactivo'
      ]);

      autoTable(doc, {
        head: [['#', 'Plato', 'Cant. Productos', 'Tipo', 'Estado']],
        body: tableData,
        startY: 50,
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
          1: { cellWidth: 60 },
          2: { halign: 'center', cellWidth: 30 },
          3: { cellWidth: 40 },
          4: { halign: 'center', cellWidth: 25 }
        }
      });

      const fechaHoy = new Date().toISOString().split('T')[0];
      doc.save(`reporte-platos-productos-${fechaHoy}.pdf`);
      
      this.alertService.showSuccess('PDF Generado', 'El reporte se ha exportado correctamente.');

    } catch (error) {
      console.error('Error al generar PDF:', error);
      this.alertService.showError('Error', 'No se pudo generar el archivo PDF.');
    }
  }

  exportarExcel() {
    try {
      const excelData = this.datosPlatos.map(item => ({
        'Plato': item.nombrePlato,
        'Tipo': item.tipoPlato,
        'Cantidad de Productos': item.cantidadProductos,
        'Estado': item.platoActivo ? 'Activo' : 'Inactivo'
      }));

      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(excelData);
      ws['!cols'] = [
        { wch: 35 },
        { wch: 20 },
        { wch: 25 },
        { wch: 15 }
      ];

      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Platos y Productos');

      const fechaHoy = new Date().toISOString().split('T')[0];
      const nombreArchivo = `reporte-platos-productos-${fechaHoy}.xlsx`;

      XLSX.writeFile(wb, nombreArchivo);

      this.alertService.showSuccess('Excel Generado', 'El reporte se ha exportado correctamente a Excel.');

    } catch (error) {
      console.error('Error al generar Excel:', error);
      this.alertService.showError('Error', 'No se pudo generar el archivo Excel.');
    }
  }
}
