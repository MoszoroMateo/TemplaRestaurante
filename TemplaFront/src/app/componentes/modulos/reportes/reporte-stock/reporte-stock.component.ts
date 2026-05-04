import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReporteService } from '../../../../services/reporte.service';
import { ReporteStockBajoDTO } from '../../../models/ReporteStockBajoDTO';
import { AlertService } from '../../../../services/alert.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

declare var google: any;

@Component({
  selector: 'app-reporte-stock',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reporte-stock.component.html',
  styleUrl: './reporte-stock.component.css'
})
export class ReporteStockComponent implements OnInit {
  
  datosStock: ReporteStockBajoDTO[] = [];
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
    
    this.reporteService.getProductosStockBajo().subscribe({
      next: (data: ReporteStockBajoDTO[]) => {
        console.log('Datos recibidos:', data);
        this.datosStock = data;
        this.loading = false;
        
        setTimeout(() => this.crearGrafico(), 100);
      },
      error: (error: any) => {
        console.error('Error al cargar datos de stock:', error);
        this.loading = false;
        this.alertService.showError('Error', 'No se pudieron cargar los datos de stock bajo.');
      }
    });
  }

  private crearGrafico() {
    if (this.datosStock.length === 0) return;

    google.charts.setOnLoadCallback(() => {
      const chartData: any[] = [['Producto', 'Stock Actual', 'Stock Mínimo']];
      
      this.datosStock.forEach(item => {
        chartData.push([item.nombreProducto, item.stockActual, item.stockMinimo]);
      });

      const dataTable = google.visualization.arrayToDataTable(chartData);

      const options = {

        chartArea: { width: '75%', height: '75%', top: 50,},
        hAxis: {
          title: 'Producto',
          slantedText: true,
          slantedTextAngle: 45,
          textStyle: { color: '#755143', fontSize: 12 },
          titleTextStyle: { color: '#696848', fontSize: 13, bold: true }
        },
        vAxis: {
          title: 'Cantidad',
          minValue: 0,
          textStyle: { color: '#755143', fontSize: 12 },
          titleTextStyle: { color: '#696848', fontSize: 13, bold: true }
        },
        legend: { position: 'top' },
        colors: ['#dc3545', '#ffc107'],
        bar: { groupWidth: '70%' }
      };

      const chart = new google.visualization.ColumnChart(document.getElementById('chart-stock'));
      chart.draw(dataTable, options);
    });
  }

  exportarPDF() {
  if (this.datosStock.length === 0) {
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
    doc.text('REPORTE DE STOCK BAJO', 20, 25);
    
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
    
    const tableData = this.datosStock.map((item, index) => [
      (index + 1).toString(),
      item.nombreProducto,
      item.stockActual.toFixed(3),
      item.stockMinimo.toFixed(3),
      item.activo ? 'Activo' : 'Inactivo',  // ← NUEVO
      item.tipoProducto
    ]);

    autoTable(doc, {
      head: [['#', 'Producto', 'Stock Actual', 'Stock Mínimo', 'Estado', 'Tipo']],  // ← ACTUALIZADO
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
        1: { cellWidth: 50 },
        2: { halign: 'center', cellWidth: 25 },
        3: { halign: 'center', cellWidth: 25 },
        4: { halign: 'center', cellWidth: 25 },  // ← NUEVO
        5: { cellWidth: 25 }
      },
      // ✅ Colorear filas de productos inactivos
      didParseCell: function(data: any) {
        if (data.section === 'body' && data.column.index === 4) {
          if (data.cell.raw === 'Inactivo') {
            data.cell.styles.textColor = [220, 53, 69]; // rojo
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });

    const fechaHoy = new Date().toISOString().split('T')[0];
    doc.save(`reporte-stock-bajo-${fechaHoy}.pdf`);
    
    this.alertService.showSuccess('PDF Generado', 'El reporte se ha exportado correctamente.');

  } catch (error) {
    console.error('Error al generar PDF:', error);
    this.alertService.showError('Error', 'No se pudo generar el archivo PDF.');
  }
}

  exportarExcel() {
  try {
    const excelData = this.datosStock.map(item => ({
      'Producto': item.nombreProducto,
      'Unidad de Medida': item.unidadMedida,
      'Stock Actual': Number(item.stockActual.toFixed(3)),
      'Stock Mínimo': Number(item.stockMinimo.toFixed(3)),
      'Cantidad Faltante': Number(item.cantidadFaltante.toFixed(3)),
      'Estado': item.activo ? 'Activo' : 'Inactivo'  // ← NUEVO
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(excelData);
    ws['!cols'] = [
      { wch: 30 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
      { wch: 15 }  // ← NUEVO
    ];

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stock Bajo');

    const fechaHoy = new Date().toISOString().split('T')[0];
    const nombreArchivo = `reporte-stock-bajo-${fechaHoy}.xlsx`;

    XLSX.writeFile(wb, nombreArchivo);

    this.alertService.showSuccess('Excel Generado', 'El reporte se ha exportado correctamente a Excel.');

  } catch (error) {
    console.error('Error al generar Excel:', error);
    this.alertService.showError('Error', 'No se pudo generar el archivo Excel.');
  }
}
}
