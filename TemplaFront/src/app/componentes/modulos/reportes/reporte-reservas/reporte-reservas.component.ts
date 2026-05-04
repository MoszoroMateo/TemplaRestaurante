import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ReporteService } from '../../../../services/reporte.service';
import { ReporteReservasDTO } from '../../../models/ReporteReservasDTO';
import { AlertService } from '../../../../services/alert.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { right } from '@popperjs/core';

declare var google: any;

@Component({
  selector: 'app-reporte-reservas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reporte-reservas.component.html',
  styleUrl: './reporte-reservas.component.css'
})
export class ReporteReservasComponent implements OnInit {
  
  fechaInicio = '';
  fechaFin = '';
  tipoReporte = 'fechas'; // 'fechas' o 'horarios'
  private currentChart: any = null;
  datosReporte: ReporteReservasDTO[] = [];
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
    // NO llamar a generarReporte() automáticamente
  });
}
  }

  volver() {
    this.router.navigate(['/reportes']);
  }

  generarReporte() {
    console.log('Generando reporte de reservas');
    
    this.reporteService.getDatosReporte(this.tipoReporte as 'fechas' | 'horarios', this.fechaInicio, this.fechaFin).subscribe({
      next: (data: ReporteReservasDTO[]) => {
        console.log('Datos recibidos:', data);
        this.datosReporte = data;
        if (this.tipoReporte === 'fechas') {
          this.crearGraficoBarras(data, 'Reservas por Fecha', 'chart-fechas');
        } else {
          this.crearGraficoBarras(data, 'Reservas por Horario', 'chart-horarios');
        }
      },
      error: (error: any) => {
        console.error('Error al obtener reportes:', error);
        this.alertService.showError('Error', 'No se pudieron cargar los datos del reporte.');
      }
    });
  }

  onTipoReporteChange() {
    this.generarReporte();
  }
  

  private crearGraficoBarras(data: ReporteReservasDTO[], titulo: string, containerId: string) {
  // Función que dibuja el gráfico
  const dibujarGrafico = () => {
    const chartData: any[] = [['Periodo', 'Total Reservas', 'Total Comensales']];
    
    data.forEach(item => {
      // Formatear el periodo si es tipo horarios
      const periodoFormateado = this.tipoReporte === 'horarios' 
        ? this.formatearHorario(item.periodo) 
        : item.periodo;
      chartData.push([periodoFormateado, item.totalReservas, item.totalComensales]);
    });

    const dataTable = google.visualization.arrayToDataTable(chartData);

    const options = {
      // ELIMINAR: title: titulo,
      chartArea: { 
        width: '80%', 
        height: '75%',
        top: 50,
        left: 100,
        right: 50
      },
      hAxis: {
        title: this.tipoReporte === 'fechas' ? 'Fecha' : 'Horario',
        minValue: 0,
        textStyle: { color: '#755143', fontSize: 12 },
        titleTextStyle: { color: '#696848', fontSize: 13, bold: true }
      },
      vAxis: {
        title: 'Cantidad',
        textStyle: { color: '#755143', fontSize: 12 },
        titleTextStyle: { color: '#696848', fontSize: 13, bold: true }
      },
      legend: { 
        position: 'top',
        textStyle: { color: '#755143', fontSize: 12 }
      },
      colors: ['#84C473', '#d2a46d'],
      backgroundColor: '#ffffff',
      bar: { groupWidth: '75%' }
    };

    const chart = new google.visualization.ColumnChart(document.getElementById(containerId));
    this.currentChart = chart;
    chart.draw(dataTable, options);
  };

  // Si Google Charts ya está cargado, dibujar inmediatamente
  if (this.googleChartsLoaded) {
    // Usar setTimeout para asegurar que el contenedor del DOM esté listo
    setTimeout(() => dibujarGrafico(), 100);
  } else {
    // Si no está cargado, esperar a que se cargue
    google.charts.setOnLoadCallback(() => {
      this.googleChartsLoaded = true;
      setTimeout(() => dibujarGrafico(), 100);
    });
  }
}

  exportarPDF() {
    try {
      const doc = new jsPDF();
      
      // Título del reporte con fondo degradado
      doc.setFillColor(244, 234, 221); // #F4EADD
      doc.rect(0, 0, 210, 40, 'F');
      
      const titulo = this.tipoReporte === 'fechas' ? 'REPORTE DE RESERVAS POR FECHA' : 'REPORTE DE RESERVAS POR HORARIO';
      doc.setFontSize(18);
      doc.setTextColor(105, 104, 72); // #696848
      doc.setFont('helvetica', 'bold');
      doc.text(titulo, 20, 25);
      
      // Información del período y fecha de generación
      doc.setFontSize(10);
      doc.setTextColor(117, 81, 67); // #755143
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
      
      // Preparar datos para la tabla
      const columns = [
        { header: this.tipoReporte === 'fechas' ? 'Fecha' : 'Horario', dataKey: 'periodo' },
        { header: 'Total Reservas', dataKey: 'totalReservas' },
        { header: 'Total Comensales', dataKey: 'totalComensales' }
      ];
      
      const rows = this.datosReporte.map(item => ({
        periodo: this.tipoReporte === 'horarios' ? this.formatearHorario(item.periodo) : item.periodo,
        totalReservas: item.totalReservas.toString(),
        totalComensales: item.totalComensales.toString()
      }));
      
      // Crear la tabla
      autoTable(doc, {
        columns: columns,
        body: rows,
        startY: 50,
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
        margin: { left: 20, right: 20 },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 50, halign: 'center' },
          2: { cellWidth: 50, halign: 'center' }
        }
      });
      
      // Generar nombre del archivo
      const fechaHoy = new Date().toISOString().split('T')[0];
      const tipoArchivo = this.tipoReporte === 'fechas' ? 'fechas' : 'horarios';
      const nombreArchivo = `reporte-reservas-${tipoArchivo}-${fechaHoy}.pdf`;
      
      // Descargar el PDF
      doc.save(nombreArchivo);
      
      this.alertService.showSuccess('PDF Generado', 'El reporte de reservas se ha exportado correctamente.');
      
    } catch (error) {
      console.error('Error al generar PDF:', error);
      this.alertService.showError('Error', 'Ocurrió un error al generar el PDF de reservas.');
    }
  }

  exportarExcel() {
    try {
      const excelData = this.datosReporte.map(item => ({
        [this.tipoReporte === 'fechas' ? 'Fecha' : 'Horario']: item.periodo,
        'Total Reservas': item.totalReservas,
        'Total Comensales': item.totalComensales
      }));

      const totalReservas = this.datosReporte.reduce((sum, item) => sum + item.totalReservas, 0);
      const totalComensales = this.datosReporte.reduce((sum, item) => sum + item.totalComensales, 0);

      excelData.push({
        [this.tipoReporte === 'fechas' ? 'Fecha' : 'Horario']: 'TOTAL',
        'Total Reservas': totalReservas,
        'Total Comensales': totalComensales
      });

      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(excelData);
      ws['!cols'] = [
        { wch: 25 },
        { wch: 20 },
        { wch: 20 }
      ];

      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Reservas');

      const fechaHoy = new Date().toISOString().split('T')[0];
      const tipoArchivo = this.tipoReporte === 'fechas' ? 'fechas' : 'horarios';
      const nombreArchivo = `reporte-reservas-${tipoArchivo}-${fechaHoy}.xlsx`;

      XLSX.writeFile(wb, nombreArchivo);

      this.alertService.showSuccess('Excel Generado', 'El reporte de reservas se ha exportado correctamente a Excel.');

    } catch (error) {
      console.error('Error al generar Excel:', error);
      this.alertService.showError('Error', 'Ocurrió un error al generar el archivo Excel.');
    }
  }

  formatearHorario(horario: string): string {
  // Si es formato HH:MM:SS, quitar los segundos
  if (horario && horario.includes(':')) {
    const partes = horario.split(':');
    return `${partes[0]}:${partes[1]}`;
  }
  return horario;
}
}
