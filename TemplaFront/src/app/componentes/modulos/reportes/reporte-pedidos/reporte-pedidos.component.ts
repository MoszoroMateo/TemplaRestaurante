import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ReporteService } from '../../../../services/reporte.service';
import { ReportePedidosPorFechaDTO } from '../../../models/ReportePedidosPorFechaDTO';
import { AlertService } from '../../../../services/alert.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

declare var google: any;

@Component({
  selector: 'app-reporte-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reporte-pedidos.component.html',
  styleUrl: './reporte-pedidos.component.css'
})
export class ReportePedidosComponent implements OnInit {
  
  fechaInicio = '';
  fechaFin = '';
  datosPedidos: ReportePedidosPorFechaDTO[] = [];
  private googleChartsLoaded = false;
  
  constructor(
    private router: Router,
    private reporteService: ReporteService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
  // Configurar fechas por defecto (último mes)
  const hoy = new Date();
  const mesAnterior = new Date();
  mesAnterior.setMonth(hoy.getMonth() - 1);
  
  this.fechaFin = hoy.toISOString().split('T')[0];
  this.fechaInicio = mesAnterior.toISOString().split('T')[0];
  
  // Cargar Google Charts
  if (typeof google !== 'undefined' && google.charts) {
    google.charts.load('current', { 'packages': ['corechart'] });
    google.charts.setOnLoadCallback(() => {
      this.googleChartsLoaded = true;
    });
  }
}

  volver() {
    this.router.navigate(['/reportes']);
  }

  generarReporte() {
    console.log('Generando reporte de pedidos');
    
    this.reporteService.getPedidosPorFecha(this.fechaInicio, this.fechaFin).subscribe({
      next: (data: ReportePedidosPorFechaDTO[]) => {
        console.log('Datos recibidos:', data);
        this.datosPedidos = data;
        this.crearGraficoBarras(data, 'Pedidos por Fecha', 'chart-pedidos');
      },
      error: (error: any) => {
        console.error('Error al obtener reportes:', error);
        this.alertService.showError('Error', 'No se pudieron cargar los datos del reporte.');
      }
    });
  }

  private crearGraficoBarras(data: ReportePedidosPorFechaDTO[], titulo: string, containerId: string) {
  // Función que dibuja el gráfico
  const dibujarGrafico = () => {
    const chartData: any[] = [['Fecha', 'Cantidad de Pedidos']];
    
    data.forEach(item => {
      chartData.push([item.fecha, item.cantidadPedidos]);
    });

    const dataTable = google.visualization.arrayToDataTable(chartData);

    const options = {
      title: titulo,
      chartArea: { width: '75%', height: '70%' },
      hAxis: {
        title: 'Fecha',
        slantedText: true,
        slantedTextAngle: 45,
        showTextEvery: 1
      },
      vAxis: {
        title: 'Cantidad de Pedidos',
        minValue: 0,
        format: '0'
      },
      legend: { position: 'none' },
      colors: ['#4CAC6B'],
      curveType: 'function',
      pointSize: 5,
      lineWidth: 3
    };

    const chart = new google.visualization.LineChart(document.getElementById(containerId));
    chart.draw(dataTable, options);
  };

  // Esperar a que el DOM esté listo antes de dibujar
  setTimeout(() => dibujarGrafico(), 100);
}

  exportarPDF() {
    try {
      const doc = new jsPDF();
      
      doc.setFillColor(244, 234, 221);
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setFontSize(18);
      doc.setTextColor(105, 104, 72);
      doc.setFont('helvetica', 'bold');
      doc.text('REPORTE DE PEDIDOS POR FECHA', 20, 25);
      
      doc.setFontSize(10);
      doc.setTextColor(117, 81, 67);
      doc.setFont('helvetica', 'normal');
      const fechaInicioFormat = new Date(this.fechaInicio).toLocaleDateString('es-ES');
      const fechaFinFormat = new Date(this.fechaFin).toLocaleDateString('es-ES');
      const fechaGeneracion = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.text(`Periodo: ${fechaInicioFormat} - ${fechaFinFormat} | Generado el: ${fechaGeneracion}`, 20, 35);
      
      const columns = [
        { header: 'Fecha', dataKey: 'fecha' },
        { header: 'Cantidad de Pedidos', dataKey: 'cantidadPedidos' }
      ];
      
      const rows = this.datosPedidos.map(item => ({
        fecha: item.fecha,
        cantidadPedidos: item.cantidadPedidos.toString()
      }));
      
      autoTable(doc, {
        columns: columns,
        body: rows,
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
        margin: { left: 20, right: 20 },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 80, halign: 'center' }
        }
      });
      
      const fechaHoy = new Date().toISOString().split('T')[0];
      doc.save(`reporte-pedidos-${fechaHoy}.pdf`);
      
      this.alertService.showSuccess('PDF Generado', 'El reporte de pedidos se ha exportado correctamente.');
      
    } catch (error) {
      console.error('Error al generar PDF:', error);
      this.alertService.showError('Error', 'Ocurrió un error al generar el PDF de pedidos.');
    }
  }

  exportarExcel() {
    try {
      const excelData = this.datosPedidos.map(item => ({
        'Fecha': item.fecha,
        'Cantidad de Pedidos': item.cantidadPedidos
      }));

      const totalPedidos = this.datosPedidos.reduce((sum, item) => sum + item.cantidadPedidos, 0);

      excelData.push({
        'Fecha': 'TOTAL',
        'Cantidad de Pedidos': totalPedidos
      });

      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(excelData);
      ws['!cols'] = [
        { wch: 20 },
        { wch: 25 }
      ];

      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Pedidos por Fecha');

      const fechaHoy = new Date().toISOString().split('T')[0];
      const nombreArchivo = `reporte-pedidos-${fechaHoy}.xlsx`;

      XLSX.writeFile(wb, nombreArchivo);

      this.alertService.showSuccess('Excel Generado', 'El reporte de pedidos se ha exportado correctamente a Excel.');

    } catch (error) {
      console.error('Error al generar Excel:', error);
      this.alertService.showError('Error', 'Ocurrió un error al generar el archivo Excel.');
    }
  }
}
