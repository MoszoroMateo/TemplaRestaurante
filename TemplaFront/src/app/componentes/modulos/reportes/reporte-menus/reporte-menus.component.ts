import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ReporteService } from '../../../../services/reporte.service';
import { ReporteMenusMasPedidosDTO } from '../../../models/ReporteMenusMasPedidosDTO';
import { AlertService } from '../../../../services/alert.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

declare var google: any;

@Component({
  selector: 'app-reporte-menus',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reporte-menus.component.html',
  styleUrl: './reporte-menus.component.css'
})
export class ReporteMenusComponent implements OnInit {
  
  fechaInicio = '';
  fechaFin = '';
  datosMenus: ReporteMenusMasPedidosDTO[] = [];
  
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
      //google.charts.setOnLoadCallback(() => this.generarReporte());
    }
  }

  volver() {
    this.router.navigate(['/reportes']);
  }

  generarReporte() {
  console.log('Generando reporte de menús más pedidos');
  
  // Cargar Google Charts si no está cargado
  if (typeof google === 'undefined' || !google.charts) {
    console.error('Google Charts no está disponible');
    this.alertService.showError('Error', 'No se pudo cargar la librería de gráficos.');
    return;
  }
  
  this.reporteService.getMenusMasPedidos(this.fechaInicio, this.fechaFin).subscribe({
    next: (data: ReporteMenusMasPedidosDTO[]) => {
      console.log('Datos recibidos:', data);
      this.datosMenus = data;
      
      // Esperar a que Angular renderice el elemento del DOM antes de crear el gráfico
      setTimeout(() => {
        if (google.visualization) {
          this.crearGraficoTorta(data, 'Menús Más Pedidos', 'chart-menus');
        } else {
          // Si no está listo, esperar a que se cargue
          google.charts.setOnLoadCallback(() => {
            this.crearGraficoTorta(data, 'Menús Más Pedidos', 'chart-menus');
          });
        }
      }, 100); // Pequeño delay para asegurar que el DOM esté listo
    },
    error: (error: any) => {
      console.error('Error al obtener reportes:', error);
      this.alertService.showError('Error', 'No se pudieron cargar los datos del reporte.');
    }
  });
  }

  private crearGraficoTorta(data: ReporteMenusMasPedidosDTO[], titulo: string, containerId: string) {
    const chartData: any[] = [['Menú', 'Cantidad de Pedidos']];
    
    data.forEach(item => {
      chartData.push([item.nombreMenu, item.cantidadPedidos]);
    });

    const dataTable = google.visualization.arrayToDataTable(chartData);

    const options = {
      
      pieHole: 0.4, // Donut chart
      pieSliceTextStyle: {
        color: '#ffffff',
        fontSize: 12,
        bold: true
      },
      legend: {
        position: 'right',
        alignment: 'center',
        textStyle: { color: '#755143', fontSize: 12 }
      },
      colors: ['#84C473', '#d2a46d', '#696848', '#755143', '#F4EADD', '#8B7355', '#A0C49D', '#E8B86D', '#C68B59', '#DDB892'],
      chartArea: { 
        left: 50, 
        top: 50, 
        right: 250, 
        bottom: 50, 
        width: '70%', 
        height: '80%' 
      },
      tooltip: {
        text: 'both',
        textStyle: { fontSize: 12 }
      },
      pieSliceText: 'percentage',
      height: 500,
      width: '100%'
    };

    const chart = new google.visualization.PieChart(document.getElementById(containerId));
    chart.draw(dataTable, options);
  }

  exportarPDF() {
    try {
      const doc = new jsPDF();
      
      doc.setFillColor(244, 234, 221);
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setFontSize(18);
      doc.setTextColor(105, 104, 72);
      doc.setFont('helvetica', 'bold');
      doc.text('REPORTE DE MENÚS MÁS PEDIDOS', 20, 25);
      
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
      
      const totalPedidos = this.datosMenus.reduce((sum, item) => sum + item.cantidadPedidos, 0);
      
      const columns = [
        { header: 'Menú', dataKey: 'nombreMenu' },
        { header: 'Cantidad', dataKey: 'cantidadPedidos' },
        { header: 'Porcentaje', dataKey: 'porcentaje' }
      ];
      
      const rows = this.datosMenus.map(item => ({
        nombreMenu: item.nombreMenu,
        cantidadPedidos: item.cantidadPedidos.toString(),
        porcentaje: totalPedidos > 0 ? `${((item.cantidadPedidos / totalPedidos) * 100).toFixed(1)}%` : '0%'
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
          1: { cellWidth: 50, halign: 'center' },
          2: { cellWidth: 40, halign: 'center' }
        }
      });
      
      // Resumen
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.setTextColor(117, 81, 67);
      doc.text('Resumen:', 20, finalY);
      
      doc.setFontSize(10);
      doc.text(`Total de Pedidos: ${totalPedidos}`, 20, finalY + 10);
      doc.text(`Cantidad de Menús: ${this.datosMenus.length}`, 20, finalY + 20);
      
      if (this.datosMenus.length > 0) {
        const promedio = (totalPedidos / this.datosMenus.length).toFixed(1);
        doc.text(`Promedio por Menú: ${promedio}`, 20, finalY + 30);
        doc.text(`Menú Más Pedido: ${this.datosMenus[0].nombreMenu} (${this.datosMenus[0].cantidadPedidos} pedidos)`, 20, finalY + 40);
      }
      
      const fechaHoy = new Date().toISOString().split('T')[0];
      doc.save(`reporte-menus-pedidos-${fechaHoy}.pdf`);
      
      this.alertService.showSuccess('PDF Generado', 'El reporte de menús se ha exportado correctamente.');
      
    } catch (error) {
      console.error('Error al generar PDF:', error);
      this.alertService.showError('Error', 'Ocurrió un error al generar el PDF de menús.');
    }
  }

  getTotalPedidos(): number {
    return this.datosMenus.reduce((sum, item) => sum + item.cantidadPedidos, 0);
  }

  exportarExcel() {
    try {
      const totalPedidos = this.getTotalPedidos();
      
      // Preparar los datos para el Excel
      const excelData = this.datosMenus.map(item => ({
        'Menú': item.nombreMenu,
        'Cantidad de Pedidos': item.cantidadPedidos,
        'Porcentaje': totalPedidos > 0 ? `${((item.cantidadPedidos / totalPedidos) * 100).toFixed(1)}%` : '0%'
      }));

      // Agregar fila de totales
      excelData.push({
        'Menú': 'TOTAL',
        'Cantidad de Pedidos': totalPedidos,
        'Porcentaje': '100%'
      });

      // Crear el libro de Excel
      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(excelData);
      
      // Ajustar ancho de columnas
      ws['!cols'] = [
        { wch: 40 }, // Menú
        { wch: 20 }, // Cantidad
        { wch: 15 }  // Porcentaje
      ];

      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Menús Más Pedidos');

      // Generar nombre del archivo con fecha
      const fechaHoy = new Date().toISOString().split('T')[0];
      const nombreArchivo = `reporte-menus-pedidos-${fechaHoy}.xlsx`;

      // Descargar el archivo
      XLSX.writeFile(wb, nombreArchivo);

      this.alertService.showSuccess('Excel Generado', 'El reporte de menús se ha exportado correctamente a Excel.');

    } catch (error) {
      console.error('Error al generar Excel:', error);
      this.alertService.showError('Error', 'Ocurrió un error al generar el archivo Excel.');
    }
  }
}
