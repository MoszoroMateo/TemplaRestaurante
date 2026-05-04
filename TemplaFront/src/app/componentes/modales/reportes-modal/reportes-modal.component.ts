import { Component, OnInit, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ReporteService } from '../../../services/reporte.service';
import { ReporteReservasDTO } from '../../models/ReporteReservasDTO';
import { ReportePedidosPorFechaDTO } from '../../models/ReportePedidosPorFechaDTO';
import { ReporteStockBajoDTO } from '../../models/ReporteStockBajoDTO';
import { ReportePlatoProductosDTO } from '../../models/ReportePlatoProductosDTO';
import { ReporteMenusMasPedidosDTO } from '../../models/ReporteMenusMasPedidosDTO';
import { AlertService } from '../../../services/alert.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

declare var google: any;

@Component({
  selector: 'app-reportes-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes-modal.component.html',
  styleUrls: ['./reportes-modal.component.css']
})
export class ReportesModalComponent implements OnInit {
  
  isVisible = false;
  fechaInicio = '';
  fechaFin = '';
  tipoReporte = 'fechas'; // 'fechas' o 'horarios'
  categoriaReporte = 'reservas'; // 'reservas', 'pedidos', 'stock', 'platos', 'menus'
  modulo?: 'reservas' | 'pedidos' | 'stock' | 'platos' | 'menus'; // Módulo desde el que se abre
  private currentChart: any = null;
  datosReporte: ReporteReservasDTO[] = [];
  datosPedidos: ReportePedidosPorFechaDTO[] = [];
  datosStock: ReporteStockBajoDTO[] = [];
  datosPlatos: ReportePlatoProductosDTO[] = [];
  datosMenus: ReporteMenusMasPedidosDTO[] = [];
  
  constructor(
    private reporteService: ReporteService,
    private alertService: AlertService,
    @Optional() public activeModal: NgbActiveModal
  ) {}

  ngOnInit() {
    // Si se recibió un módulo, establecerlo como categoría
    if (this.modulo) {
      this.categoriaReporte = this.modulo;
    }
    
    // Configurar fechas por defecto (último mes)
    const hoy = new Date();
    const mesAnterior = new Date();
    mesAnterior.setMonth(hoy.getMonth() - 1);
    
    this.fechaFin = hoy.toISOString().split('T')[0];
    this.fechaInicio = mesAnterior.toISOString().split('T')[0];
    
    this.loadGoogleCharts();
  }

  private loadGoogleCharts() {
    google.charts.load('current', { packages: ['corechart'] });
  }

  show(categoria?: 'reservas' | 'pedidos' | 'stock' | 'platos' | 'menus') {
    // Si se proporciona una categoría, actualizarla
    if (categoria) {
      this.categoriaReporte = categoria;
      this.modulo = categoria;
    }
    
    this.isVisible = true;
    // Esperar a que el modal esté visible antes de generar el gráfico
    setTimeout(() => {
      this.generarReporte();
    }, 100);
  }

  // Obtener nombre legible de la categoría
  getNombreCategoria(): string {
    const nombres: Record<string, string> = {
      'reservas': 'Reservas',
      'pedidos': 'Pedidos',
      'stock': 'Stock Bajo',
      'platos': 'Platos',
      'menus': 'Menús'
    };
    return nombres[this.categoriaReporte] || 'Reportes';
  }

  hide() {
    // Limpiar gráfico actual si existe
    if (this.currentChart) {
      this.currentChart.clearChart();
      this.currentChart = null;
    }
    // Limpiar datos
    this.datosReporte = [];
    this.datosPedidos = [];
    this.datosStock = [];
    this.datosPlatos = [];
    this.datosMenus = [];
    this.isVisible = false;
    // Cerrar modal usando NgBootstrap solo si está disponible
    if (this.activeModal) {
      this.activeModal.dismiss();
    }
  }

  getTituloModal(): string {
    switch (this.categoriaReporte) {
      case 'reservas':
        return 'Reportes Reservas';
      case 'pedidos':
        return 'Reportes Pedidos';
      case 'stock':
        return 'Reportes Stock';
      case 'platos':
        return 'Reportes Platos';
      case 'menus':
        return 'Reportes Menús';
      default:
        return 'Reportes';
    }
  }

  generarReporte() {
    if (this.categoriaReporte === 'reservas') {
      if (this.tipoReporte === 'fechas') {
        this.generarReporteFechas();
      } else {
        this.generarReporteHorarios();
      }
    } else if (this.categoriaReporte === 'pedidos') {
      this.generarReportePedidos();
    } else if (this.categoriaReporte === 'stock') {
      this.generarReporteStock();
    } else if (this.categoriaReporte === 'platos') {
      this.generarReportePlatos();
    } else if (this.categoriaReporte === 'menus') {
      this.generarReporteMenus();
    }
  }

  private generarReporteFechas() {
    this.reporteService.getFechasConcurridas(this.fechaInicio, this.fechaFin)
      .subscribe({
        next: (data: ReporteReservasDTO[]) => {
          this.datosReporte = data;
          this.crearGraficoBarras(data, 'Reservas por Fecha', 'chart-fechas');
        },
        error: (error) => {
          this.alertService.showError('Error al cargar el reporte de fechas', 'No se pudieron obtener los datos del servidor');
          console.error('Error:', error);
        }
      });
  }

  private generarReporteHorarios() {
    this.reporteService.getHorariosConcurridos(this.fechaInicio, this.fechaFin)
      .subscribe({
        next: (data: ReporteReservasDTO[]) => {
          this.datosReporte = data;
          this.crearGraficoBarras(data, 'Reservas por Horario', 'chart-horarios');
        },
        error: (error) => {
          this.alertService.showError('Error al cargar el reporte de horarios', 'No se pudieron obtener los datos del servidor');
          console.error('Error:', error);
        }
      });
  }

  private generarReportePedidos() {
    console.log('Generando reporte de pedidos desde:', this.fechaInicio, 'hasta:', this.fechaFin);
    this.reporteService.getPedidosPorFecha(this.fechaInicio, this.fechaFin)
      .subscribe({
        next: (data: ReportePedidosPorFechaDTO[]) => {
          console.log('Datos del reporte de pedidos recibidos:', data);
          this.datosPedidos = data;
          this.crearGraficoBarrasPedidos(data, 'Pedidos por Fecha', 'chart-pedidos');
        },
        error: (error) => {
          console.error('Error completo del reporte de pedidos:', error);
          let mensajeError = 'No se pudieron obtener los datos del servidor';
          if (error.error && error.error.message) {
            mensajeError = error.error.message;
          } else if (error.message) {
            mensajeError = error.message;
          }
          this.alertService.showError('Error al cargar el reporte de pedidos', mensajeError);
        }
      });
  }

  private generarReporteStock() {
    console.log('Generando reporte de stock bajo');
    this.reporteService.getProductosStockBajo()
      .subscribe({
        next: (data: ReporteStockBajoDTO[]) => {
          console.log('Datos del reporte de stock recibidos:', data);
          this.datosStock = data;
          this.crearGraficoBarrasStock(data, 'Productos con Stock Bajo', 'chart-stock');
        },
        error: (error) => {
          console.error('Error completo del reporte de stock:', error);
          let mensajeError = 'No se pudieron obtener los datos del servidor';
          if (error.error && error.error.message) {
            mensajeError = error.error.message;
          } else if (error.message) {
            mensajeError = error.message;
          }
          this.alertService.showError('Error al cargar el reporte de stock', mensajeError);
        }
      });
  }

  private generarReportePlatos() {
    this.reporteService.getPlatosPorCantidadProductos()
      .subscribe({
        next: (data: ReportePlatoProductosDTO[]) => {
          console.log('Datos del reporte de platos recibidos:', data);
          this.datosPlatos = data;
          this.crearGraficoBarrasHorizontalesPlatos(data, 'Platos por Cantidad de Productos', 'chart-platos');
        },
        error: (error) => {
          console.error('Error al cargar el reporte de platos:', error);
          let mensajeError = 'No se pudieron obtener los datos del servidor';
          if (error.status === 401) {
            mensajeError = 'No tiene permisos para ver este reporte';
          } else if (error.status === 500) {
            mensajeError = 'Error interno del servidor';
          } else if (error.message) {
            mensajeError = error.message;
          }
          this.alertService.showError('Error al cargar el reporte de platos', mensajeError);
        }
      });
  }

  private generarReporteMenus() {
    console.log('Generando reporte de menús más pedidos desde:', this.fechaInicio, 'hasta:', this.fechaFin);
    this.reporteService.getMenusMasPedidos(this.fechaInicio, this.fechaFin)
      .subscribe({
        next: (data: ReporteMenusMasPedidosDTO[]) => {
          console.log('Datos del reporte de menús recibidos:', data);
          this.datosMenus = data;
          this.crearGraficoTortaMenus(data, 'Menús Más Pedidos', 'chart-menus');
        },
        error: (error) => {
          console.error('Error completo del reporte de menús:', error);
          let mensajeError = 'No se pudieron obtener los datos del servidor';
          if (error.error && error.error.message) {
            mensajeError = error.error.message;
          } else if (error.message) {
            mensajeError = error.message;
          }
          this.alertService.showError('Error al cargar el reporte de menús', mensajeError);
        }
      });
  }

  private crearGraficoBarras(data: ReporteReservasDTO[], titulo: string, elementId: string) {
    google.charts.setOnLoadCallback(() => {
      const element = document.getElementById(elementId);
      if (!element) {
        console.error(`Elemento ${elementId} no encontrado`);
        return;
      }

      const chartData = google.visualization.arrayToDataTable([
        ['Período', 'Total Reservas', 'Total Comensales'],
        ...data.map(item => [
          item.periodo,
          Number(item.totalReservas),
          Number(item.totalComensales)
        ])
      ]);

      const options = {
        title: titulo,
        titleTextStyle: {
          fontSize: 18,
          bold: true,
          color: '#696848'
        },
        hAxis: {
          title: this.tipoReporte === 'fechas' ? 'Fechas' : 'Horarios',
          titleTextStyle: { color: '#755143', fontSize: 13, bold: true },
          textStyle: { fontSize: 11, color: '#755143' },
          slantedText: true,
          slantedTextAngle: 45
        },
        vAxis: {
          title: 'Cantidad',
          minValue: 0,
          titleTextStyle: { color: '#755143', fontSize: 13, bold: true },
          textStyle: { color: '#755143', fontSize: 11 }
        },
        legend: {
          position: 'top',
          alignment: 'center',
          textStyle: { color: '#755143', fontSize: 12, bold: true }
        },
        colors: ['#84C473', '#d2a46d'],
        backgroundColor: {
          fill: '#F4EADD',
          stroke: '#d2a46d',
          strokeWidth: 2
        },
        chartArea: {
          left: 70,
          top: 60,
          right: 30,
          bottom: 100,
          width: '85%',
          height: '60%',
          backgroundColor: '#ffffff'
        },
        bar: { groupWidth: '65%' },
        animation: {
          duration: 1000,
          easing: 'out',
          startup: true
        },
        height: 500,
        width: '100%'
      };

      // Limpiar gráfico anterior si existe
      if (this.currentChart) {
        this.currentChart.clearChart();
      }

      this.currentChart = new google.visualization.ColumnChart(element);
      this.currentChart.draw(chartData, options);
    });
  }

  private crearGraficoBarrasPedidos(data: ReportePedidosPorFechaDTO[], titulo: string, elementId: string) {
    google.charts.setOnLoadCallback(() => {
      const element = document.getElementById(elementId);
      if (!element) {
        console.error(`Elemento ${elementId} no encontrado`);
        return;
      }

      const chartData = google.visualization.arrayToDataTable([
        ['Fecha', 'Cantidad de Pedidos'],
        ...data.map(item => [
          this.formatearFecha(item.fecha),
          Number(item.cantidadPedidos)
        ])
      ]);

      const options = {
        title: titulo,
        titleTextStyle: {
          fontSize: 18,
          bold: true,
          color: '#696848'
        },
        hAxis: {
          title: 'Fechas',
          titleTextStyle: { color: '#755143', fontSize: 13, bold: true },
          textStyle: { fontSize: 11, color: '#755143' },
          slantedText: true,
          slantedTextAngle: 45
        },
        vAxis: {
          title: 'Cantidad de Pedidos',
          minValue: 0,
          titleTextStyle: { color: '#755143', fontSize: 13, bold: true },
          textStyle: { color: '#755143', fontSize: 11 }
        },
        legend: {
          position: 'none'
        },
        colors: ['#84C473'],
        backgroundColor: {
          fill: '#F4EADD',
          stroke: '#d2a46d',
          strokeWidth: 2
        },
        chartArea: {
          left: 70,
          top: 60,
          right: 30,
          bottom: 100,
          width: '85%',
          height: '60%',
          backgroundColor: '#ffffff'
        },
        bar: { groupWidth: '65%' },
        animation: {
          duration: 1000,
          easing: 'out',
          startup: true
        },
        height: 500,
        width: '100%'
      };

      // Limpiar gráfico anterior si existe
      if (this.currentChart) {
        this.currentChart.clearChart();
      }

      this.currentChart = new google.visualization.ColumnChart(element);
      this.currentChart.draw(chartData, options);
    });
  }

  private crearGraficoBarrasStock(data: ReporteStockBajoDTO[], titulo: string, elementId: string) {
    google.charts.setOnLoadCallback(() => {
      const element = document.getElementById(elementId);
      if (!element) {
        console.error(`Elemento ${elementId} no encontrado`);
        return;
      }

      const chartData = google.visualization.arrayToDataTable([
        ['Producto', 'Stock Actual', 'Stock Mínimo', 'Cantidad Faltante'],
        ...data.map(item => [
          `${item.nombreProducto} (${this.getUnidadMedidaCorta(item.unidadMedida)})`,
          Number(item.stockActual),
          Number(item.stockMinimo),
          Number(item.cantidadFaltante)
        ])
      ]);

      const options = {
        title: titulo,
        titleTextStyle: {
          fontSize: 18,
          bold: true,
          color: '#696848'
        },
        hAxis: {
          title: 'Productos',
          titleTextStyle: { color: '#755143', fontSize: 13, bold: true },
          textStyle: { fontSize: 10, color: '#755143' },
          slantedText: true,
          slantedTextAngle: 45
        },
        vAxis: {
          title: 'Cantidad',
          minValue: 0,
          titleTextStyle: { color: '#755143', fontSize: 13, bold: true },
          textStyle: { color: '#755143', fontSize: 11 }
        },
        legend: {
          position: 'top',
          maxLines: 3,
          textStyle: { color: '#755143', fontSize: 11 }
        },
        colors: ['#dc3545', '#ffc107', '#28a745'], // Rojo, amarillo, verde
        backgroundColor: {
          fill: '#F4EADD',
          stroke: '#d2a46d',
          strokeWidth: 2
        },
        chartArea: {
          left: 90,
          top: 60,
          right: 40,
          bottom: 140,
          width: '75%',
          height: '60%',
          backgroundColor: '#ffffff'
        },
        bar: { groupWidth: '70%' },
        animation: {
          duration: 1000,
          easing: 'out',
          startup: true
        },
        height: 500,
        width: '100%'
      };

      // Limpiar gráfico anterior si existe
      if (this.currentChart) {
        this.currentChart.clearChart();
      }

      this.currentChart = new google.visualization.ColumnChart(element);
      this.currentChart.draw(chartData, options);
    });
  }

  // Helper para mostrar unidad de medida
  private getUnidadMedidaCorta(unidad: string): string {
    switch (unidad) {
      case 'KILOGRAMO': return 'kg';
      case 'LITRO': return 'lt';
      case 'GRAMO': return 'g';
      case 'UNIDAD': return 'u';
      default: return unidad;
    }
  }

  private crearGraficoBarrasHorizontalesPlatos(data: ReportePlatoProductosDTO[], titulo: string, elementId: string) {
    google.charts.setOnLoadCallback(() => {
      const element = document.getElementById(elementId);
      if (!element) {
        console.error(`Elemento ${elementId} no encontrado`);
        return;
      }

      const chartData = google.visualization.arrayToDataTable([
        ['Plato', 'Cantidad de Productos'],
        ...data.map(item => [
          `${item.nombrePlato} (${item.tipoPlato})`,
          Number(item.cantidadProductos)
        ])
      ]);

      const options = {
        title: titulo,
        titleTextStyle: {
          fontSize: 18,
          bold: true,
          color: '#696848'
        },
        hAxis: {
          title: 'Cantidad de Productos',
          minValue: 0,
          titleTextStyle: { color: '#755143', fontSize: 13, bold: true },
          textStyle: { color: '#755143', fontSize: 11 }
        },
        vAxis: {
          title: 'Platos',
          titleTextStyle: { color: '#755143', fontSize: 13, bold: true },
          textStyle: { fontSize: 10, color: '#755143' }
        },
        legend: {
          position: 'none'
        },
        colors: ['#84c473'], // Verde Templa
        backgroundColor: {
          fill: '#F4EADD',
          stroke: '#d2a46d',
          strokeWidth: 2
        },
        chartArea: {
          left: 200,
          top: 80,
          right: 50,
          bottom: 80,
          width: '65%',
          height: '70%',
          backgroundColor: '#ffffff'
        },
        bar: { groupWidth: '75%' },
        animation: {
          duration: 1000,
          easing: 'out',
          startup: true
        },
        height: 500,
        width: '100%'
      };

      // Limpiar gráfico anterior si existe
      if (this.currentChart) {
        this.currentChart.clearChart();
      }

      this.currentChart = new google.visualization.BarChart(element); // BarChart para horizontal
      this.currentChart.draw(chartData, options);
    });
  }

  private crearGraficoTortaMenus(data: ReporteMenusMasPedidosDTO[], titulo: string, elementId: string) {
    google.charts.setOnLoadCallback(() => {
      const element = document.getElementById(elementId);
      if (!element) {
        console.error(`Elemento ${elementId} no encontrado`);
        return;
      }

      const chartData = google.visualization.arrayToDataTable([
        ['Menú', 'Cantidad de Pedidos'],
        ...data.map(item => [
          item.nombreMenu,
          Number(item.cantidadPedidos)
        ])
      ]);

      const options = {
        title: titulo,
        titleTextStyle: {
          fontSize: 18,
          bold: true,
          color: '#696848'
        },
        pieHole: 0.4, // Crea un donut chart (gráfico de rosquilla)
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
        backgroundColor: {
          fill: '#F4EADD',
          stroke: '#d2a46d',
          strokeWidth: 2
        },
        chartArea: {
          left: 50,
          top: 60,
          right: 250,
          bottom: 50,
          width: '70%',
          height: '75%',
          backgroundColor: '#ffffff'
        },
        animation: {
          duration: 1000,
          easing: 'out',
          startup: true
        },
        height: 500,
        width: '100%',
        tooltip: {
          text: 'both', // Muestra valor y porcentaje
          textStyle: { fontSize: 12 }
        },
        pieSliceText: 'percentage' // Muestra porcentaje en las porciones
      };

      // Limpiar gráfico anterior si existe
      if (this.currentChart) {
        this.currentChart.clearChart();
      }

      this.currentChart = new google.visualization.PieChart(element);
      this.currentChart.draw(chartData, options);
    });
  }

  private formatearFecha(fecha: string): string {
    // Convertir de YYYY-MM-DD a DD/MM/YYYY
    const [year, month, day] = fecha.split('-');
    return `${day}/${month}/${year}`;
  }

  onTipoReporteChange() {
    this.generarReporte();
  }

  onCategoriaReporteChange() {
    this.generarReporte();
  }

  exportarPDF() {
    if (this.categoriaReporte === 'reservas') {
      if (!this.datosReporte || this.datosReporte.length === 0) {
        this.alertService.showInfo('Sin datos', 'No hay datos para exportar. Genere primero un reporte.');
        return;
      }
      this.exportarPDFReservas();
    } else if (this.categoriaReporte === 'pedidos') {
      if (!this.datosPedidos || this.datosPedidos.length === 0) {
        this.alertService.showInfo('Sin datos', 'No hay datos para exportar. Genere primero un reporte.');
        return;
      }
      this.exportarPDFPedidos();
    } else if (this.categoriaReporte === 'stock') {
      if (!this.datosStock || this.datosStock.length === 0) {
        this.alertService.showInfo('Sin datos', 'No hay datos para exportar. Genere primero un reporte.');
        return;
      }
      this.exportarPDFStock();
    } else if (this.categoriaReporte === 'platos') {
      if (!this.datosPlatos || this.datosPlatos.length === 0) {
        this.alertService.showInfo('Sin datos', 'No hay datos para exportar. Genere primero un reporte.');
        return;
      }
      this.exportarPDFPlatos();
    } else if (this.categoriaReporte === 'menus') {
      if (!this.datosMenus || this.datosMenus.length === 0) {
        this.alertService.showInfo('Sin datos', 'No hay datos para exportar. Genere primero un reporte.');
        return;
      }
      this.exportarPDFMenus();
    }
  }

  private exportarPDFReservas() {

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
        periodo: item.periodo,
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
      
      // Calcular totales
      const totalReservas = this.datosReporte.reduce((sum, item) => sum + Number(item.totalReservas), 0);
      const totalComensales = this.datosReporte.reduce((sum, item) => sum + Number(item.totalComensales), 0);
      
      // Agregar resumen de totales
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.setTextColor(117, 81, 67);
      doc.text('Resumen:', 20, finalY);
      
      doc.setFontSize(10);
      doc.text(`Total de Reservas: ${totalReservas}`, 20, finalY + 10);
      doc.text(`Total de Comensales: ${totalComensales}`, 20, finalY + 20);
      
      if (totalReservas > 0) {
        const promedioComensales = (totalComensales / totalReservas).toFixed(1);
        doc.text(`Promedio de Comensales por Reserva: ${promedioComensales}`, 20, finalY + 30);
      }
      
      // Generar nombre del archivo
      const fechaHoy = new Date().toISOString().split('T')[0];
      const nombreArchivo = `reporte-reservas-${this.tipoReporte}-${fechaHoy}.pdf`;
      
      // Descargar el PDF
      doc.save(nombreArchivo);
      
      this.alertService.showSuccess('PDF Generado', 'El reporte se ha exportado correctamente.');
      
    } catch (error) {
      console.error('Error al generar PDF:', error);
      this.alertService.showError('Error', 'Ocurrió un error al generar el PDF.');
    }
  }

  private exportarPDFPedidos() {
    try {
      const doc = new jsPDF();
      
      // Configuración del documento
      const pageWidth = doc.internal.pageSize.width;
      
      // Header del documento
      doc.setFontSize(20);
      doc.setTextColor(105, 104, 72); // Color templa-brown
      doc.text('Templa Restaurante', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(16);
      doc.setTextColor(117, 81, 67); // Color templa-dark-brown
      doc.text('Reporte de Pedidos por Fecha', pageWidth / 2, 30, { align: 'center' });
      
      // Información del período
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      const fechaInicioFormat = new Date(this.fechaInicio).toLocaleDateString('es-ES');
      const fechaFinFormat = new Date(this.fechaFin).toLocaleDateString('es-ES');
      doc.text(`Período: ${fechaInicioFormat} - ${fechaFinFormat}`, pageWidth / 2, 40, { align: 'center' });
      
      // Fecha de generación
      doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}`, pageWidth / 2, 47, { align: 'center' });
      
      // Preparar datos para la tabla
      const columns = [
        { header: 'Fecha', dataKey: 'fecha' },
        { header: 'Cantidad de Pedidos', dataKey: 'cantidadPedidos' }
      ];
      
      const rows = this.datosPedidos.map(item => ({
        fecha: this.formatearFecha(item.fecha),
        cantidadPedidos: item.cantidadPedidos.toString()
      }));
      
      // Crear la tabla
      autoTable(doc, {
        columns: columns,
        body: rows,
        startY: 55,
        theme: 'grid',
        headStyles: {
          fillColor: [132, 196, 115], // Color templa-green
          textColor: [255, 255, 255],
          fontSize: 12,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 10,
          textColor: [117, 81, 67] // Color templa-dark-brown
        },
        alternateRowStyles: {
          fillColor: [244, 234, 221] // Color templa-light
        },
        margin: { left: 20, right: 20 },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 60, halign: 'center' }
        }
      });
      
      // Calcular totales
      const totalPedidos = this.datosPedidos.reduce((sum, item) => sum + item.cantidadPedidos, 0);
      const promedioPedidosPorDia = this.datosPedidos.length > 0 ? (totalPedidos / this.datosPedidos.length).toFixed(1) : '0';
      
      // Agregar resumen de totales
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.setTextColor(117, 81, 67);
      doc.text('Resumen:', 20, finalY);
      
      doc.setFontSize(10);
      doc.text(`Total de Pedidos: ${totalPedidos}`, 20, finalY + 10);
      doc.text(`Días con Pedidos: ${this.datosPedidos.length}`, 20, finalY + 20);
      doc.text(`Promedio de Pedidos por Día: ${promedioPedidosPorDia}`, 20, finalY + 30);
      
      // Generar nombre del archivo
      const fechaHoy = new Date().toISOString().split('T')[0];
      const nombreArchivo = `reporte-pedidos-por-fecha-${fechaHoy}.pdf`;
      
      // Descargar el PDF
      doc.save(nombreArchivo);
      
      this.alertService.showSuccess('PDF Generado', 'El reporte de pedidos se ha exportado correctamente.');
      
    } catch (error) {
      console.error('Error al generar PDF:', error);
      this.alertService.showError('Error', 'Ocurrió un error al generar el PDF de pedidos.');
    }
  }

  private exportarPDFStock() {
    try {
      const doc = new jsPDF();
      
      // Título del reporte con fondo degradado
      doc.setFillColor(244, 234, 221); // #F4EADD
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setFontSize(18);
      doc.setTextColor(105, 104, 72); // #696848
      doc.setFont('helvetica', 'bold');
      doc.text('REPORTE DE PRODUCTOS CON STOCK BAJO', 20, 25);
      
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
      
      // Preparar datos para la tabla
      const columns = [
        { header: 'Producto', dataKey: 'nombreProducto' },
        { header: 'Tipo', dataKey: 'tipoProducto' },
        { header: 'Unidad', dataKey: 'unidadMedida' },
        { header: 'Stock Actual', dataKey: 'stockActual' },
        { header: 'Stock Mínimo', dataKey: 'stockMinimo' },
        { header: 'Cantidad Faltante', dataKey: 'cantidadFaltante' }
      ];
      
      const rows = this.datosStock.map(item => ({
        nombreProducto: item.nombreProducto,
        tipoProducto: item.tipoProducto,
        unidadMedida: this.getUnidadMedidaCorta(item.unidadMedida),
        stockActual: item.stockActual.toString(),
        stockMinimo: item.stockMinimo.toString(),
        cantidadFaltante: item.cantidadFaltante.toString()
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
        margin: { top: 50, left: 15, right: 15 },
        tableWidth: 'auto',
        columnStyles: {
          0: { cellWidth: 35 }, // Producto
          1: { cellWidth: 25 }, // Tipo
          2: { cellWidth: 20 }, // Unidad
          3: { cellWidth: 25 }, // Stock Actual
          4: { cellWidth: 25 }, // Stock Mínimo
          5: { cellWidth: 30 }  // Cantidad Faltante
        }
      });
      
      // Información estadística
      const finalY = (doc as any).lastAutoTable.finalY || 50;
      
      if (this.datosStock.length > 0) {
        const totalProductos = this.datosStock.length;
        const totalFaltante = this.datosStock.reduce((sum, item) => sum + item.cantidadFaltante, 0);
        
        doc.setFontSize(10);
        doc.setTextColor(117, 81, 67);
        doc.text(`Total de productos con stock bajo: ${totalProductos}`, 20, finalY + 15);
        doc.text(`Total cantidad faltante: ${totalFaltante.toFixed(2)}`, 20, finalY + 25);
        
        // Alerta
        doc.setFontSize(12);
        doc.setTextColor(220, 53, 69);
        doc.setFont('helvetica', 'bold');
        doc.text('ALERTA: Estos productos necesitan reposicion urgente', 20, finalY + 40);
      }
      
      // Generar nombre del archivo
      const fechaHoy = new Date().toISOString().split('T')[0];
      const nombreArchivo = `reporte-stock-bajo-${fechaHoy}.pdf`;
      
      // Descargar el PDF
      doc.save(nombreArchivo);
      
      this.alertService.showSuccess('PDF Generado', 'El reporte de stock bajo se ha exportado correctamente.');
      
    } catch (error) {
      console.error('Error al generar PDF:', error);
      this.alertService.showError('Error', 'Ocurrió un error al generar el PDF de stock bajo.');
    }
  }

  private exportarPDFPlatos() {
    try {
      const doc = new jsPDF();
      
      // Título del reporte
      doc.setFillColor(244, 234, 221); // #F4EADD
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setFontSize(18);
      doc.setTextColor(105, 104, 72); // #696848
      doc.setFont('helvetica', 'bold');
      doc.text('REPORTE DE PLATOS POR CANTIDAD DE PRODUCTOS', 20, 25);
      
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
      
      // Encabezados de la tabla
      let yPosition = 60;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.setFillColor(105, 104, 72);
      
      // Crear encabezados
      doc.rect(20, yPosition - 8, 90, 12, 'F');
      doc.rect(110, yPosition - 8, 40, 12, 'F');
      doc.rect(150, yPosition - 8, 40, 12, 'F');
      
      doc.text('Plato', 25, yPosition);
      doc.text('Cantidad', 130, yPosition);
      doc.text('Estado', 165, yPosition);
      
      yPosition += 15;
      
      // Datos de la tabla
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(117, 81, 67);
      doc.setFontSize(9);
      
      const rows = this.datosPlatos.map(item => ({
        nombre: `${item.nombrePlato} (${item.tipoPlato})`,
        cantidad: item.cantidadProductos.toString(),
        estado: item.platoActivo ? 'Activo' : 'Inactivo'
      }));
      
      rows.forEach((row, index) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 30;
        }
        
        // Alternar color de fondo para las filas
        if (index % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(20, yPosition - 6, 170, 10, 'F');
        }
        
        // Texto del plato (truncar si es muy largo)
        const nombreTruncado = row.nombre.length > 35 ? row.nombre.substring(0, 32) + '...' : row.nombre;
        doc.text(nombreTruncado, 25, yPosition);
        doc.text(row.cantidad, 135, yPosition);
        
        // Color del estado
        if (row.estado === 'Activo') {
          doc.setTextColor(40, 167, 69); // Verde
        } else {
          doc.setTextColor(220, 53, 69); // Rojo
        }
        doc.text(row.estado, 165, yPosition);
        doc.setTextColor(117, 81, 67); // Restaurar color
        
        yPosition += 12;
      });
      
      // Resumen estadístico
      let finalY = yPosition + 10;
      
      if (this.datosPlatos.length > 0) {
        const totalPlatos = this.datosPlatos.length;
        const platosActivos = this.datosPlatos.filter(item => item.platoActivo).length;
        const promedioProductos = this.datosPlatos.reduce((sum, item) => sum + item.cantidadProductos, 0) / totalPlatos;
        const maxProductos = Math.max(...this.datosPlatos.map(item => item.cantidadProductos));
        const minProductos = Math.min(...this.datosPlatos.map(item => item.cantidadProductos));
        
        doc.setFontSize(10);
        doc.setTextColor(117, 81, 67);
        doc.text(`Total de platos: ${totalPlatos}`, 20, finalY + 15);
        doc.text(`Platos activos: ${platosActivos}`, 20, finalY + 25);
        doc.text(`Promedio de productos por plato: ${promedioProductos.toFixed(1)}`, 20, finalY + 35);
        doc.text(`Máximo productos en un plato: ${maxProductos}`, 20, finalY + 45);
        doc.text(`Mínimo productos en un plato: ${minProductos}`, 20, finalY + 55);
      }
      
      // Generar nombre del archivo
      const fechaHoy = new Date().toISOString().split('T')[0];
      const nombreArchivo = `reporte-platos-productos-${fechaHoy}.pdf`;
      
      // Descargar el PDF
      doc.save(nombreArchivo);
      
      this.alertService.showSuccess('PDF Generado', 'El reporte de platos se ha exportado correctamente.');
      
    } catch (error) {
      console.error('Error al generar PDF:', error);
      this.alertService.showError('Error', 'Ocurrió un error al generar el PDF de platos.');
    }
  }

  private exportarPDFMenus() {
    try {
      const doc = new jsPDF();
      
      // Título del reporte con fondo
      doc.setFillColor(244, 234, 221); // #F4EADD
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setFontSize(18);
      doc.setTextColor(105, 104, 72); // #696848
      doc.setFont('helvetica', 'bold');
      doc.text('REPORTE DE MENÚS MÁS PEDIDOS', 20, 25);
      
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
        { header: 'Menú', dataKey: 'nombreMenu' },
        { header: 'Cantidad de Pedidos', dataKey: 'cantidadPedidos' },
        { header: 'Porcentaje', dataKey: 'porcentaje' }
      ];
      
      // Calcular total de pedidos
      const totalPedidos = this.datosMenus.reduce((sum, item) => sum + Number(item.cantidadPedidos), 0);
      
      const rows = this.datosMenus.map(item => ({
        nombreMenu: item.nombreMenu,
        cantidadPedidos: item.cantidadPedidos.toString(),
        porcentaje: totalPedidos > 0 ? `${((item.cantidadPedidos / totalPedidos) * 100).toFixed(1)}%` : '0%'
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
          0: { cellWidth: 80 },
          1: { cellWidth: 50, halign: 'center' },
          2: { cellWidth: 40, halign: 'center' }
        }
      });
      
      // Agregar resumen
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.setTextColor(117, 81, 67);
      doc.text('Resumen:', 20, finalY);
      
      doc.setFontSize(10);
      doc.text(`Total de Pedidos: ${totalPedidos}`, 20, finalY + 10);
      doc.text(`Cantidad de Menús Diferentes: ${this.datosMenus.length}`, 20, finalY + 20);
      
      if (this.datosMenus.length > 0) {
        const promedioPedidosPorMenu = (totalPedidos / this.datosMenus.length).toFixed(1);
        doc.text(`Promedio de Pedidos por Menú: ${promedioPedidosPorMenu}`, 20, finalY + 30);
        doc.text(`Menú Más Pedido: ${this.datosMenus[0].nombreMenu} (${this.datosMenus[0].cantidadPedidos} pedidos)`, 20, finalY + 40);
      }
      
      // Generar nombre del archivo
      const fechaHoy = new Date().toISOString().split('T')[0];
      const nombreArchivo = `reporte-menus-mas-pedidos-${fechaHoy}.pdf`;
      
      // Descargar el PDF
      doc.save(nombreArchivo);
      
      this.alertService.showSuccess('PDF Generado', 'El reporte de menús se ha exportado correctamente.');
      
    } catch (error) {
      console.error('Error al generar PDF:', error);
      this.alertService.showError('Error', 'Ocurrió un error al generar el PDF de menús.');
    }
  }
}