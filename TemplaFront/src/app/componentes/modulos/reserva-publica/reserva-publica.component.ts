import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ReservaService } from '../../../services/reserva.service';
import { DisponibilidadService } from '../../../services/disponibilidad.service';
import { PersonaService } from '../../../services/persona.service';
import { AuthService } from '../../../services/auth.service';
import { EventoReserva } from '../../models/EventoReserva';
import { DisponibilidadModel } from '../../models/DisponibilidadModel';
import { PostPersonaDto, TipoPersona, Persona } from '../../models/PersonaModel';
import { PostReservaModel } from '../../models/ReservaModel';
import Swal from 'sweetalert2';

interface ReservaData {
  cantidadComensales: number;
  fechaReserva: string;
  evento: EventoReserva | null;
  horario: string;
  idPersona: number;
  //idDisponibilidad: number;
}

@Component({
  selector: 'app-reserva-publica',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './reserva-publica.component.html',
  styleUrls: ['./reserva-publica.component.css']
})
export class ReservaPublicaComponent implements OnInit {
  currentStep = 1;
  totalSteps = 5;
  
  reservaData: ReservaData = {
    cantidadComensales: 1,
    fechaReserva: '',
    evento: null,
    horario: '',
    idPersona: 0,
    //idDisponibilidad: 0
  };

  // Datos para los formularios
  disponibilidades: DisponibilidadModel[] = [];
  
  // Enums y opciones
  EventoReserva = EventoReserva;
  eventosReserva = Object.values(EventoReserva);
  
  // Horarios disponibles (dinámicos según evento)
  horariosDisponibles: string[] = [];
  
  // Horarios por evento
  private horariosPorEvento = {
    [EventoReserva.ALMUERZO]: ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30'],
    [EventoReserva.CENA]: ['20:00', '20:30', '21:00', '21:30', '22:00'],
    [EventoReserva.CUMPLEAÑOS]: ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'],
    [EventoReserva.VIP]: ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00']
  };

  // Calendario
  mesActual = new Date();
  diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  diasCalendario: any[] = [];
  fechasConDisponibilidad: string[] = [];

  // Forms para cada paso
  comensalesForm!: FormGroup;
  fechaForm!: FormGroup;
  eventoForm!: FormGroup;
  horarioForm!: FormGroup;
  personaMesaForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private reservaService: ReservaService,
    private disponibilidadService: DisponibilidadService,
    private personaService: PersonaService,
    private authService: AuthService,
    private router: Router
  ) {
    this.initializeForms();
  }

  ngOnInit() {
    this.cargarDatos();
    this.generarCalendario();
    
    // Inicializar horarios con todos los horarios disponibles
    this.horariosDisponibles = ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'];
  }

  initializeForms() {
    this.comensalesForm = this.fb.group({
      cantidadComensales: [1, [Validators.required, Validators.min(1), Validators.max(20)]]
    });

    this.fechaForm = this.fb.group({
      fechaReserva: ['', Validators.required]
    });

    this.eventoForm = this.fb.group({
      evento: [null, Validators.required]
    });

    this.horarioForm = this.fb.group({
      horario: ['', Validators.required]
    });

    this.personaMesaForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      telefono: ['', [Validators.required, Validators.minLength(8)]],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  cargarDatos() {
    // Cargar disponibilidades
    this.disponibilidadService.obtenerTodasLasDisponibilidades().subscribe({
      next: (data) => {
        this.disponibilidades = data.filter(d => d.activo);
        
        // Si no hay disponibilidades, crear algunas de ejemplo para los próximos 30 días
        if (this.disponibilidades.length === 0) {
          this.crearDisponibilidadesEjemplo();
        } else {
          this.actualizarFechasConDisponibilidad();
          this.generarCalendario();
        }
      },
      error: (error: any) => {
        console.error('Error al cargar disponibilidades:', error);
        // Crear disponibilidades de ejemplo si hay error
        this.crearDisponibilidadesEjemplo();
      }
    });
  }

  nextStep() {
    if (this.validateCurrentStep()) {
      this.updateReservaData();
      if (this.currentStep < this.totalSteps) {
        this.currentStep++;
        
        // Si llegamos al paso 4 (horarios), actualizar horarios disponibles
        if (this.currentStep === 4) {
          this.actualizarHorariosDisponibles();
        }
      }
    }
  }
  
  private actualizarHorariosDisponibles() {
    const eventoSeleccionado = this.eventoForm.get('evento')?.value as EventoReserva;
    if (eventoSeleccionado && this.horariosPorEvento[eventoSeleccionado]) {
      this.horariosDisponibles = this.horariosPorEvento[eventoSeleccionado];
    } else {
      // Fallback: todos los horarios disponibles
      this.horariosDisponibles = ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'];
    }
    
    // Limpiar selección de horario si el horario actual no está disponible
    const horarioActual = this.horarioForm.get('horario')?.value;
    if (horarioActual && !this.horariosDisponibles.includes(horarioActual)) {
      this.horarioForm.patchValue({ horario: '' });
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  validateCurrentStep(): boolean {
    switch (this.currentStep) {
      case 1:
        return this.comensalesForm.valid;
      case 2:
        return this.fechaForm.valid;
      case 3:
        return this.eventoForm.valid;
      case 4:
        return this.horarioForm.valid;
      case 5:
        return this.personaMesaForm.valid;
      default:
        return false;
    }
  }

  updateReservaData() {
    if (this.currentStep === 1) {
      this.reservaData.cantidadComensales = this.comensalesForm.get('cantidadComensales')?.value;
      this.actualizarFechasConDisponibilidad();
      this.generarCalendario();
    } else if (this.currentStep === 2) {
      this.reservaData.fechaReserva = this.fechaForm.get('fechaReserva')?.value;
    } else if (this.currentStep === 3) {
      this.reservaData.evento = this.eventoForm.get('evento')?.value;
    } else if (this.currentStep === 4) {
      this.reservaData.horario = this.horarioForm.get('horario')?.value;
    }
  }

  async confirmarReserva() {
  if (!this.personaMesaForm.valid || !this.reservaData.horario || !this.reservaData.evento) {
    Swal.fire('Error', 'Por favor complete todos los datos', 'error');
    return;
  }

  if (this.reservaData.evento === EventoReserva.VIP) {
    this.mostrarModalPagoVIP();
    return;
  }

  const datosCliente = this.personaMesaForm.value;

  try {
    // 1. Crear o buscar cliente
    const userId = this.authService.getUserId() || 1;
    
    const clienteData: PostPersonaDto = {
      nombre: datosCliente.nombre,
      apellido: datosCliente.apellido,
      dni: parseInt(datosCliente.dni),
      telefono: datosCliente.telefono,
      email: datosCliente.email,
      tipoPersona: TipoPersona.CLIENTE,
      userAlta: userId
    };

    const cliente = await this.personaService.crearPersona(clienteData).toPromise() || null;

    if (!cliente || !cliente.id) {
      throw new Error('No se pudo obtener o crear el cliente');
    }

    // 2. Generar número de reserva
    const nroReserva = Math.floor(100000 + Math.random() * 900000);

    // 3. Crear la reserva (el backend se encarga de la disponibilidad)
    const reservaData: PostReservaModel = {
      cantidadComensales: this.reservaData.cantidadComensales,
      fechaReserva: this.reservaData.fechaReserva,
      evento: this.reservaData.evento,
      horario: this.reservaData.horario,
      idPersona: cliente.id,
      // ❌ Ya no enviamos idDisponibilidad
      nroReserva: nroReserva,
      nombreCliente: `${datosCliente.nombre} ${datosCliente.apellido}`,
      telefonoCliente: datosCliente.telefono
    };

    const reserva = await this.reservaService.crearReserva(reservaData).toPromise();

    Swal.fire({
      icon: 'success',
      title: '¡Reserva Confirmada!',
      html: `Su reserva se realizo con éxito.<br>Número de reserva: <strong>#${nroReserva}</strong><br>Fecha: <strong>${this.formatearFecha(this.reservaData.fechaReserva)}</strong><br>Horario: <strong>${this.reservaData.horario}</strong>`,
      confirmButtonText: 'Volver al inicio',
      confirmButtonColor: '#84C473'
    }).then(() => {
      this.router.navigate(['/']);
    });

  } catch (error: any) {
    console.error('Error al crear reserva:', error);
    const errorMsg = (error.error?.message || 'No se pudo crear la reserva').replace('Error interno del servidor: ', '');
    Swal.fire('Error', errorMsg, 'error');
  }
}



  // Métodos del calendario
  crearDisponibilidadesEjemplo() {
    console.log('Creando disponibilidades de ejemplo...');
    this.disponibilidades = [];
    
    // Crear disponibilidades para los próximos 30 días
    const hoy = new Date();
    for (let i = 1; i <= 30; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + i);
      
      const disponibilidad: DisponibilidadModel = {
        id: i,
        fecha: fecha.toISOString().split('T')[0],
        cuposOcupados: Math.floor(Math.random() * 5), // Entre 0 y 4 ocupados
        cuposMaximos: 20, // 20 cupos máximos por día
        activo: true
      };
      
      this.disponibilidades.push(disponibilidad);
    }
    
    console.log('Disponibilidades de ejemplo creadas:', this.disponibilidades);
    this.actualizarFechasConDisponibilidad();
    this.generarCalendario();
  }

  actualizarFechasConDisponibilidad() {
    const hoy = new Date().toISOString().split('T')[0];
    this.fechasConDisponibilidad = this.disponibilidades
      .filter(d => {
        return d.fecha >= hoy && 
          d.activo && 
          (d.cuposMaximos - d.cuposOcupados) >= this.reservaData.cantidadComensales;
      })
      .map(d => d.fecha);
  }

  generarCalendario() {
    this.diasCalendario = [];
    const year = this.mesActual.getFullYear();
    const month = this.mesActual.getMonth();
    
    // Primer día del mes
    const primerDia = new Date(year, month, 1);
    const ultimoDia = new Date(year, month + 1, 0);
    
    // Días del mes anterior para completar la primera semana
    const diasMesAnterior = primerDia.getDay();
    for (let i = diasMesAnterior - 1; i >= 0; i--) {
      const fecha = new Date(year, month, -i);
      this.diasCalendario.push({
        dia: fecha.getDate(),
        fecha: this.formatearFecha2(fecha),
        esDelMesActual: false,
        tieneDisponibilidad: false,
        esHoy: false
      });
    }
    
    // Días del mes actual
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      const fecha = new Date(year, month, dia);
      const fechaString = this.formatearFecha2(fecha);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      fecha.setHours(0, 0, 0, 0);
      
      const tieneDisponibilidad = this.fechasConDisponibilidad.includes(fechaString);
      
      this.diasCalendario.push({
        dia: dia,
        fecha: fechaString,
        esDelMesActual: true,
        tieneDisponibilidad: tieneDisponibilidad,
        esHoy: fecha.getTime() === hoy.getTime(),
        esPasado: fecha < hoy
      });
    }
    
    // Días del siguiente mes para completar la última semana
    const diasRestantes = 42 - this.diasCalendario.length; // 6 semanas * 7 días
    for (let dia = 1; dia <= diasRestantes; dia++) {
      const fecha = new Date(year, month + 1, dia);
      this.diasCalendario.push({
        dia: dia,
        fecha: this.formatearFecha2(fecha),
        esDelMesActual: false,
        tieneDisponibilidad: false,
        esHoy: false
      });
    }
  }

  mesAnterior() {
    this.mesActual = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() - 1, 1);
    this.generarCalendario();
  }

  mesSiguiente() {
    this.mesActual = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() + 1, 1);
    this.generarCalendario();
  }

  seleccionarFecha(dia: any) {
    if (dia.tieneDisponibilidad && dia.esDelMesActual && !dia.esPasado) {
      this.reservaData.fechaReserva = dia.fecha;
      this.fechaForm.patchValue({ fechaReserva: dia.fecha });
      
    }
  }

  esFechaSeleccionada(dia: any): boolean {
    return dia.fecha === this.reservaData.fechaReserva;
  }

  formatearFecha2(fecha: Date): string {
    return fecha.toISOString().split('T')[0];
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha + 'T00:00:00');
    return date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  incrementarComensales() {
    const valor = this.comensalesForm.get('cantidadComensales')?.value;
    if (valor < 20) {
      this.comensalesForm.patchValue({ cantidadComensales: valor + 1 });
    }
  }

  decrementarComensales() {
    const valor = this.comensalesForm.get('cantidadComensales')?.value;
    if (valor > 1) {
      this.comensalesForm.patchValue({ cantidadComensales: valor - 1 });
    }
  }

  getEventoIcon(evento: EventoReserva): string {
    switch (evento) {
      case EventoReserva.ALMUERZO:
        return 'fas fa-utensils';
      case EventoReserva.CENA:
        return 'fas fa-moon';
      case EventoReserva.CUMPLEAÑOS:
        return 'fas fa-birthday-cake';
      case EventoReserva.VIP:
        return 'fas fa-crown';
      default:
        return 'fas fa-calendar';
    }
  }

  getEventoDisplayName(evento: EventoReserva | null): string {
    if (!evento) return '';
    switch (evento) {
      case EventoReserva.ALMUERZO:
        return 'Almuerzo';
      case EventoReserva.CENA:
        return 'Cena';
      case EventoReserva.CUMPLEAÑOS:
        return 'Cumpleaños';
      case EventoReserva.VIP:
        return 'VIP';
      default:
        return evento;
    }
  }

  volverAlInicio() {
    this.router.navigate(['/']);
  }

  getStepTitle(): string {
    switch (this.currentStep) {
      case 1: return '¿Para cuántas personas?';
      case 2: return '¿Qué día querés reservar?';
      case 3: return '¿Cuál es el motivo de tu reserva?';
      case 4: return 'Seleccioná tu horario';
      case 5: return 'Completá tus datos';
      default: return '';
    }
  }

  // Modal de pago VIP
  private mostrarModalPagoVIP() {
    const precioVIP = 5000; // Precio configurado en el backend
    
    Swal.fire({
      title: '👑 Reserva VIP',
      html: `
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 1.2em; margin-bottom: 20px; color: #2c3e50;">
            Para confirmar su <strong>reserva VIP</strong>, debe abonar una seña de:
          </div>
          <div style="font-size: 2.5em; font-weight: bold; color: #f39c12; margin: 20px 0;">
            $${precioVIP.toLocaleString('es-AR')}
          </div>
          <div style="font-size: 1em; color: #7f8c8d; margin-bottom: 20px;">
            Serás redirigido a <strong>Mercado Pago</strong> para completar el pago de forma segura.
          </div>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <i class="fas fa-crown" style="color: #f39c12; margin-right: 8px;"></i>
            <strong>Beneficios VIP incluidos</strong>
            <ul style="text-align: left; margin-top: 10px; color: #555;">
              <li>Mesa preferencial</li>
              <li>Atención prioritaria</li>
              <li>Cortesía de bienvenida</li>
            </ul>
          </div>
          <div style="background: #e8f5e9; padding: 12px; border-radius: 8px; margin-top: 15px;">
            <small style="color: #2e7d32;">
              <i class="fas fa-shield-alt"></i> Pago 100% seguro con Mercado Pago
            </small>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: '<i class="fas fa-credit-card"></i> Continuar al Pago',
      cancelButtonText: '<i class="fas fa-times"></i> Cancelar',
      confirmButtonColor: '#84C473',
      cancelButtonColor: '#e74c3c',
      showLoaderOnConfirm: true,
      allowOutsideClick: false,
      preConfirm: () => {
        return this.procesarPagoVIP();
      }
    }).then((result) => {
      if (result.isDismissed) {
        // Usuario canceló - no hacer nada, mantener en el formulario
        Swal.fire({
          title: 'Reserva cancelada',
          text: 'Puedes modificar los datos o elegir otro tipo de evento',
          icon: 'info',
          confirmButtonText: 'OK'
        });
      }
    });
  }

 private async procesarPagoVIP(): Promise<void> {
  try {
    console.log('💳 Iniciando proceso de pago VIP...');

    const datosCliente = this.personaMesaForm.value;

    // 1. Generar número de reserva
    const nroReserva = Math.floor(100000 + Math.random() * 900000);

    // 2. Crear o buscar persona
    const userId = this.authService.getUserId() || 1;
    
    const clienteData: PostPersonaDto = {
      nombre: datosCliente.nombre,
      apellido: datosCliente.apellido,
      dni: parseInt(datosCliente.dni),
      telefono: datosCliente.telefono,
      email: datosCliente.email,
      tipoPersona: TipoPersona.CLIENTE,
      userAlta: userId
    };

    const personaCreada = await this.personaService.crearPersona(clienteData).toPromise() || null;
    
    if (!personaCreada || !personaCreada.id) {
      throw new Error('Error al obtener o crear la persona');
    }

    // 3. Preparar request para reserva VIP (SIN idDisponibilidad)
    const reservaVipRequest = {
      reservaData: {
        idPersona: personaCreada.id,
        nroReserva: nroReserva,
        cantidadComensales: this.reservaData.cantidadComensales,
        fechaReserva: this.reservaData.fechaReserva,
        evento: EventoReserva.VIP as EventoReserva.VIP,
        horario: this.reservaData.horario,
        nombreCliente: `${personaCreada.nombre} ${personaCreada.apellido}`,
        telefonoCliente: personaCreada.telefono,
        ocasionEspecial: 'Reserva VIP'
      },
      emailCliente: personaCreada.email,
      nombreCliente: `${personaCreada.nombre} ${personaCreada.apellido}`
    };

    const response = await this.reservaService.crearReservaVip(reservaVipRequest).toPromise();
    
    if (!response || !response.preferenceId || !response.publicKey) {
      throw new Error('No se recibió preference ID o public key del servidor');
    }

    await Swal.fire({
      title: '🎉 ¡Reserva Iniciada!',
      html: `
        <p>Tu reserva <strong>#${nroReserva}</strong> ha sido iniciada.</p>
        <p>Serás redirigido a <strong>Mercado Pago</strong> para completar el pago.</p>
      `,
      icon: 'success',
      confirmButtonText: 'Ir a pagar',
      confirmButtonColor: '#84C473',
      timer: 3000,
      timerProgressBar: true
    });

    this.reservaService.abrirCheckoutMercadoPago(
      response.preferenceId,
      response.publicKey,
      response.reservaId
    );
    
  } catch (error: any) {
    console.error('❌ Error al procesar pago VIP:', error);
    const errorMsg = (error.error?.message || error.message || 'No se pudo procesar la reserva VIP').replace('Error interno del servidor: ', '');
    Swal.fire({
      title: 'Error al procesar pago',
      text: errorMsg,
      icon: 'error',
      confirmButtonText: 'OK',
      confirmButtonColor: '#e74c3c'
    });
    throw error;
  }
}

  // Getters para el template
  get eventoSeleccionado(): string {
    const evento = this.eventoForm.get('evento')?.value;
    return evento ? this.getEventoLabel(evento) : '';
  }

  get horarioSeleccionado(): string {
    return this.horarioForm.get('horario')?.value || '';
  }

  get formularioPaso2(): FormGroup {
    return this.fechaForm;
  }

  get formularioPaso4(): FormGroup {
    return this.personaMesaForm;
  }

  private getEventoLabel(evento: EventoReserva): string {
    const labels: Record<EventoReserva, string> = {
      [EventoReserva.ALMUERZO]: 'Almuerzo',
      [EventoReserva.CENA]: 'Cena',
      [EventoReserva.CUMPLEAÑOS]: 'Cumpleaños',
      [EventoReserva.VIP]: 'VIP'
    };
    return labels[evento] || evento;
  }
}
