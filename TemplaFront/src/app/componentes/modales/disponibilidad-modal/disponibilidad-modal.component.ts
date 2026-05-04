import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DisponibilidadService } from '../../../services/disponibilidad.service';
import { PostDisponibilidadModel } from '../../models/DisponibilidadModel';
import { AlertService } from '../../../services/alert.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-disponibilidad-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './disponibilidad-modal.component.html',
  styleUrl: './disponibilidad-modal.component.css'
})
export class DisponibilidadModalComponent {
  @Output() disponibilidadesCreadas = new EventEmitter<void>();

  isVisible = false;
  isLoading = false;

  // Datos del formulario
  anioSeleccionado: number = new Date().getFullYear();
  mesSeleccionado: number = new Date().getMonth() + 1; // 1-12
  cuposMaximos: number = 100;
  activo: boolean = true;

  // Exclusiones opcionales
  diasSemanaExcluidos: number[] = []; // 0=Domingo, 1=Lunes, etc.
  diasMesExcluidos: number[] = []; // Días específicos del mes

  // Opciones para los selects
  anios: number[] = [];
  mesesTodos = [
    { valor: 1, nombre: 'Enero' },
    { valor: 2, nombre: 'Febrero' },
    { valor: 3, nombre: 'Marzo' },
    { valor: 4, nombre: 'Abril' },
    { valor: 5, nombre: 'Mayo' },
    { valor: 6, nombre: 'Junio' },
    { valor: 7, nombre: 'Julio' },
    { valor: 8, nombre: 'Agosto' },
    { valor: 9, nombre: 'Septiembre' },
    { valor: 10, nombre: 'Octubre' },
    { valor: 11, nombre: 'Noviembre' },
    { valor: 12, nombre: 'Diciembre' }
  ];

  diasSemana = [
    { valor: 0, nombre: 'Domingo' },
    { valor: 1, nombre: 'Lunes' },
    { valor: 2, nombre: 'Martes' },
    { valor: 3, nombre: 'Miércoles' },
    { valor: 4, nombre: 'Jueves' },
    { valor: 5, nombre: 'Viernes' },
    { valor: 6, nombre: 'Sábado' }
  ];

  constructor(
    private disponibilidadService: DisponibilidadService,
    private alertService: AlertService
  ) {
    this.inicializarAnios();
  }

  private inicializarAnios() {
    const anioActual = new Date().getFullYear();
    // Generar años desde el actual hasta 2 años adelante
    for (let i = 0; i < 3; i++) {
      this.anios.push(anioActual + i);
    }
  }

  show() {
    this.isVisible = true;
    this.resetForm();
  }

  hide() {
    this.isVisible = false;
  }

  private resetForm() {
    this.anioSeleccionado = new Date().getFullYear();
    this.mesSeleccionado = new Date().getMonth() + 1;
    this.cuposMaximos = 100;
    this.activo = true;
    this.diasSemanaExcluidos = [];
    this.diasMesExcluidos = [];
  }

  obtenerMesesDisponibles() {
    const fechaActual = new Date();
    const anioActual = fechaActual.getFullYear();
    const mesActual = fechaActual.getMonth() + 1; // 1-12

    // Si el año seleccionado es el actual, filtrar meses pasados
    if (this.anioSeleccionado === anioActual) {
      return this.mesesTodos.filter(m => m.valor >= mesActual);
    }
    
    // Si es un año futuro, mostrar todos los meses
    return this.mesesTodos;
  }

  obtenerNombreMes(): string {
    const mes = this.mesesTodos.find(m => m.valor === this.mesSeleccionado);
    return mes ? mes.nombre : '';
  }

  obtenerDiasDelMes(): number {
    return new Date(this.anioSeleccionado, this.mesSeleccionado, 0).getDate();
  }

  toggleDiaSemana(dia: number) {
    const index = this.diasSemanaExcluidos.indexOf(dia);
    if (index > -1) {
      this.diasSemanaExcluidos.splice(index, 1);
    } else {
      this.diasSemanaExcluidos.push(dia);
    }
  }

  isDiaSemanaExcluido(dia: number): boolean {
    return this.diasSemanaExcluidos.includes(dia);
  }

  toggleDiaMes(dia: number) {
    const index = this.diasMesExcluidos.indexOf(dia);
    if (index > -1) {
      this.diasMesExcluidos.splice(index, 1);
    } else {
      this.diasMesExcluidos.push(dia);
    }
  }

  isDiaMesExcluido(dia: number): boolean {
    return this.diasMesExcluidos.includes(dia);
  }

  obtenerArrayDiasMes(): number[] {
    const dias: number[] = [];
    const totalDias = this.obtenerDiasDelMes();
    for (let i = 1; i <= totalDias; i++) {
      dias.push(i);
    }
    return dias;
  }

  calcularDiasACrear(): number {
    const totalDias = this.obtenerDiasDelMes();
    let diasExcluidosPorSemana = 0;
    
    // Calcular cuántos días se excluyen por día de semana
    for (let dia = 1; dia <= totalDias; dia++) {
      const fecha = new Date(this.anioSeleccionado, this.mesSeleccionado - 1, dia);
      const diaSemana = fecha.getDay();
      if (this.diasSemanaExcluidos.includes(diaSemana)) {
        diasExcluidosPorSemana++;
      }
    }
    
    return totalDias - diasExcluidosPorSemana - this.diasMesExcluidos.length;
  }

  async crearDisponibilidades() {
    // Validaciones
    if (this.cuposMaximos <= 0) {
      this.alertService.showError('Error', 'Los cupos máximos deben ser mayor a 0');
      return;
    }

    const diasDelMes = this.obtenerDiasDelMes();
    const nombreMes = this.obtenerNombreMes();

    // Confirmación
    const confirmacion = await Swal.fire({
      title: '¿Crear disponibilidades?',
      text: 'Se crearán disponibilidades para todos los días del mes seleccionado.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, crear',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#84C473',
      cancelButtonColor: '#e74c3c'
    });

    if (!confirmacion.isConfirmed) {
      return;
    }

    this.isLoading = true;

    try {
      let creadas = 0;
      let omitidas = 0;
      const errores: string[] = [];

      // Crear disponibilidad para cada día del mes
      for (let dia = 1; dia <= diasDelMes; dia++) {
        // Verificar si el día está excluido
        if (this.diasMesExcluidos.includes(dia)) {
          console.log(`Día ${dia} excluido (específico)`);
          omitidas++;
          continue;
        }

        // Verificar si el día de la semana está excluido
        const fecha = new Date(this.anioSeleccionado, this.mesSeleccionado - 1, dia);
        const diaSemana = fecha.getDay(); // 0=Domingo, 1=Lunes, etc.
        
        if (this.diasSemanaExcluidos.includes(diaSemana)) {
          console.log(`Día ${dia} excluido (día de semana: ${diaSemana})`);
          omitidas++;
          continue;
        }

        const fechaStr = `${this.anioSeleccionado}-${String(this.mesSeleccionado).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
        
        const disponibilidad: PostDisponibilidadModel = {
          fecha: fechaStr,
          cuposOcupados: 0,
          cuposMaximos: this.cuposMaximos,
          activo: this.activo
        };

        try {
          await this.disponibilidadService.crearDisponibilidad(disponibilidad).toPromise();
          creadas++;
        } catch (error: any) {
          console.log(`Fecha ${fechaStr} omitida o con error:`, error);
          
          // Si el error es porque ya existe, contamos como omitida
          if (error.status === 409 || error.error?.message?.includes('existe')) {
            omitidas++;
          } else {
            errores.push(`${fecha}: ${error.error?.message || 'Error desconocido'}`);
          }
        }
      }

      this.isLoading = false;

      // Mostrar resultado
      let mensaje = `Disponibilidades creadas: ${creadas}`;
      if (omitidas > 0) {
        mensaje += `<br>Fechas omitidas: ${omitidas}`;
      }
      if (errores.length > 0) {
        mensaje += `<br><br>❌ Errores: ${errores.length}`;
      }

      await Swal.fire({
        title: creadas > 0 ? '¡Proceso completado!' : 'Proceso finalizado',
        html: mensaje,
        icon: creadas > 0 ? 'success' : 'warning',
        confirmButtonText: 'Entendido',
        confirmButtonColor: creadas > 0 ? '#84C473' : '#f5d76e'
      });

      if (creadas > 0) {
        this.disponibilidadesCreadas.emit();
        this.hide();
      }

    } catch (error: any) {
      this.isLoading = false;
      console.error('Error al crear disponibilidades:', error);
      this.alertService.showError('Error', 'Ocurrió un error al crear las disponibilidades');
    }
  }

  cancelar() {
    this.hide();
  }
}
