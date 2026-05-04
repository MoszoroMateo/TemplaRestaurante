import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ReservaService } from '../../../services/reserva.service';
import { DisponibilidadService } from '../../../services/disponibilidad.service';
import { PersonaService } from '../../../services/persona.service';
import { MesaService } from '../../../services/mesa.service';
import { NotificationService } from '../../../services/notification.service';
import { AuthService } from '../../../services/auth.service';
import { EventoReserva } from '../../models/EventoReserva';
import { DisponibilidadModel } from '../../models/DisponibilidadModel';
import { Persona, PostPersonaDto, TipoPersona } from '../../models/PersonaModel';
import { GetMesaDto } from '../../models/MesasModel';
import { PostReservaModel, ReservaModel } from '../../models/ReservaModel';
import { ReportesModalComponent } from '../../modales/reportes-modal/reportes-modal.component';
import { SelectorReportesModalComponent, TipoReporte } from '../../modales/selector-reportes-modal/selector-reportes-modal.component';
import { ClientesReservasModalComponent } from '../../modales/clientes-reservas-modal/clientes-reservas-modal.component';
import { DisponibilidadModalComponent } from '../../modales/disponibilidad-modal/disponibilidad-modal.component';
import { environment } from '../../../../environments/environment';
import Swal from 'sweetalert2';

interface ReservaData {
  cantidadComensales: number;
  fechaReserva: string;
  evento: EventoReserva | null;
  horario: string;
  idPersona: number;
  idMesa?: number; // Opcional ya que la mesa se asigna automáticamente
  //idDisponibilidad: number;
  nroReserva?: number;
  // Datos del cliente
  nombre?: string;
  apellido?: string;
  dni?: string;
  telefono?: string;
  email?: string;
}

@Component({
  selector: 'app-reservas',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ReportesModalComponent, SelectorReportesModalComponent, ClientesReservasModalComponent, DisponibilidadModalComponent],
  templateUrl: './reservas.component.html',
  styleUrls: ['./reservas.component.css']
})
export class ReservasComponent implements OnInit {
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
  personas: Persona[] = [];
  mesas: GetMesaDto[] = [];
  
  // Referencia al modal de reportes
  @ViewChild('reportesModal') reportesModal!: ReportesModalComponent;

  // ✅ NUEVO: Referencia al modal de clientes con reservas
  @ViewChild('clientesReservasModal') clientesReservasModal!: ClientesReservasModalComponent;

  // ✅ NUEVO: Referencia al modal de disponibilidad
  @ViewChild('disponibilidadModal') disponibilidadModal!: DisponibilidadModalComponent;

  // ✅ NUEVO: Control para el selector de reportes
  mostrarSelectorReportes = false;
  
  // Enums y opciones
  EventoReserva = EventoReserva;
  eventosReserva = Object.values(EventoReserva);
  
  // Horarios disponibles (dinámicos según evento)
  horariosDisponibles: string[] = [];
  
  // Horarios por evento
  private horariosPorEvento = {
    [EventoReserva.ALMUERZO]: ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30'],
    [EventoReserva.CENA]: ['20:00', '20:30', '21:00', '21:30', '22:00'],
    // Otros eventos pueden elegir cualquier horario
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

  // Propiedades para la lista de reservas
  currentView: 'nueva' | 'lista' = 'lista';
  reservas: ReservaModel[] = [];
  reservasOriginales: ReservaModel[] = []; // Para filtrado del lado cliente
  pageInfo: any = null;
  loading = false;
  
  // Modo edición
  isEditMode = false;
  editingReservaId: number | null = null;
  
  // ✅ Filtros - siguiendo el patrón estándar
  busqueda: string = '';
  eventoSeleccionado: string = 'TODOS';
  fechaDesde: string = '';
  fechaHasta: string = '';
  
  // ✅ Paginación - siguiendo el patrón estándar
  paginaActual: number = 0;
  tamanoPagina: number = 10;

  // Getter para usar Math en el template
  get Math() {
    return Math;
  }

  constructor(
    private fb: FormBuilder,
    private reservaService: ReservaService,
    private disponibilidadService: DisponibilidadService,
    private personaService: PersonaService,
    private mesaService: MesaService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private modalService: NgbModal
  ) {
    this.initializeForms();
  }

  async ngOnInit() {
    // Verificar si venimos de un callback de Mercado Pago
    this.verificarCallbackPago();
    
    // Inicializar fechas por defecto (primer y último día del mes actual)
    this.inicializarFechasPorDefecto();
    
    await this.cargarDatos();
    this.generarCalendario();
    this.aplicarFiltros(); // Usar filtros desde el inicio como mesas
    
    // Inicializar filtros por defecto
    this.eventoSeleccionado = 'TODOS';
    this.busqueda = '';
    
    // Inicializar horarios con todos los horarios disponibles
    this.horariosDisponibles = ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'];
    
    console.log('🚀 Componente inicializado, filtros:', {
      evento: this.eventoSeleccionado,
      busqueda: this.busqueda,
      fechaDesde: this.fechaDesde,
      fechaHasta: this.fechaHasta
    });
  }

  /**
   * Inicializa las fechas de filtro por defecto con el primer y último día del mes actual
   */
  private inicializarFechasPorDefecto(): void {
    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

    // Formato YYYY-MM-DD para los inputs de tipo date
    this.fechaDesde = this.formatearFechaParaInput(primerDia);
    this.fechaHasta = this.formatearFechaParaInput(ultimoDia);

    console.log('📅 Fechas por defecto inicializadas:', {
      desde: this.fechaDesde,
      hasta: this.fechaHasta
    });
  }

  /**
   * Formatea una fecha al formato YYYY-MM-DD requerido por el input type="date"
   */
  private formatearFechaParaInput(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
        // No mostrar notificación de error, solo usar datos de ejemplo silenciosamente
      }
    });

    // Cargar personas
    this.cargarPersonas();

    // Cargar mesas
    this.mesaService.getMesas(0, 100).subscribe({
      next: (data: any) => {
        this.mesas = data.content || data;
      },
      error: (error: any) => {
        console.error('Error al cargar mesas:', error);
        // Solo log del error, sin notificación
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

  cargarPersonas(): Promise<void> {
    console.log('🔄 Iniciando carga de personas...');
    return new Promise((resolve, reject) => {
      this.personaService.obtenerPersonas(0, 1000).subscribe({
        next: (data: any) => {
          this.personas = data.content || data;
          console.log('✅ Personas cargadas exitosamente:', this.personas.length);
          console.log('📋 Personas:', this.personas.map(p => ({ id: p.id, nombre: p.nombre, apellido: p.apellido })));
          resolve();
        },
        error: (error: any) => {
          console.error('❌ Error al cargar personas:', error);
          reject(error);
        }
      });
    });
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
    switch (this.currentStep) {
      case 1:
        this.reservaData.cantidadComensales = this.comensalesForm.get('cantidadComensales')?.value;
        // Actualizar fechas disponibles cuando cambien los comensales
        this.actualizarFechasConDisponibilidad();
        this.generarCalendario();
        break;
      case 2:
        this.reservaData.fechaReserva = this.fechaForm.get('fechaReserva')?.value;
        //this.buscarDisponibilidad();
        break;
      case 3:
        this.reservaData.evento = this.eventoForm.get('evento')?.value;
        break;
      case 4:
        this.reservaData.horario = this.horarioForm.get('horario')?.value;
        break;
      case 5:
        // Guardar datos del cliente
        this.reservaData.nombre = this.personaMesaForm.get('nombre')?.value;
        this.reservaData.apellido = this.personaMesaForm.get('apellido')?.value;
        this.reservaData.dni = this.personaMesaForm.get('dni')?.value;
        this.reservaData.telefono = this.personaMesaForm.get('telefono')?.value;
        this.reservaData.email = this.personaMesaForm.get('email')?.value;
        console.log('Datos actualizados - Cliente:', this.reservaData.nombre, this.reservaData.apellido);
        break;
    }
  }

  /*
  buscarDisponibilidad() {
    const fechaSeleccionada = this.reservaData.fechaReserva;
    console.log('🔍 Buscando disponibilidad para fecha:', fechaSeleccionada);
    console.log('📋 Disponibilidades disponibles:', this.disponibilidades);
    console.log('🎯 Evento seleccionado:', this.reservaData.evento);
    console.log('👥 Comensales:', this.reservaData.cantidadComensales);
    
    const disponibilidad = this.disponibilidades.find(d => d.fecha === fechaSeleccionada);
    console.log('💡 Disponibilidad encontrada para la fecha:', disponibilidad);
    
    if (disponibilidad && disponibilidad.id) {
      this.reservaData.idDisponibilidad = disponibilidad.id;
      console.log('✅ ID de disponibilidad asignado:', disponibilidad.id);
    } else {
      console.error('❌ No se encontró disponibilidad para la fecha:', fechaSeleccionada);
      console.log('📅 Fechas disponibles:', this.disponibilidades.map(d => d.fecha));
      this.reservaData.idDisponibilidad = 0;
    }
  }
  */

  getStepTitle(): string {
    switch (this.currentStep) {
      case 1: return 'Cantidad de Comensales';
      case 2: return 'Seleccionar Fecha';
      case 3: return 'Tipo de Evento';
      case 4: return 'Horario';
      case 5: return 'Datos del Cliente';
      default: return '';
    }
  }

  confirmarReserva() {
    if (!this.validateCurrentStep()) {
      Swal.fire({
        title: 'Campos incompletos',
        text: 'Por favor complete todos los campos requeridos',
        icon: 'warning',
        confirmButtonText: 'OK',
        confirmButtonColor: '#f5d76e'
      });
      return;
    }

    this.updateReservaData();

    // Validaciones adicionales
    if (!this.reservaData.nombre || !this.reservaData.apellido || !this.reservaData.dni || !this.reservaData.telefono || !this.reservaData.email) {
      Swal.fire({
        title: 'Datos del cliente incompletos',
        text: 'Debe completar todos los datos requeridos del cliente, incluyendo el email para la confirmación',
        icon: 'warning',
        confirmButtonText: 'OK'
      });
      return;
    }

    /*
    if (!this.reservaData.idDisponibilidad || this.reservaData.idDisponibilidad === 0) {
      console.error('❌ Validación de disponibilidad falló:');
      console.error('📊 Estado actual de reservaData:', this.reservaData);
      console.error('📅 Fecha seleccionada:', this.reservaData.fechaReserva);
      console.error('🆔 ID disponibilidad:', this.reservaData.idDisponibilidad);
      console.error('📋 Todas las disponibilidades:', this.disponibilidades);
      
      Swal.fire({
        title: 'Error de disponibilidad',
        text: `No se pudo obtener la disponibilidad para la fecha ${this.reservaData.fechaReserva}. Evento: ${this.reservaData.evento}`,
        icon: 'error',
        confirmButtonText: 'OK'
      });
      return;
    }
      */

    // Verificar si es evento VIP para mostrar modal de pago
    if (this.reservaData.evento === EventoReserva.VIP && !this.isEditMode) {
      this.mostrarModalPagoVIP();
      return;
    }

    if (this.isEditMode && this.editingReservaId) {
      // Modo edición
      this.actualizarReservaExistente();
    } else {
      // Modo creación
      this.crearNuevaReserva();
    }
  }

  private crearNuevaReserva() {
    const nroReserva = this.generarNumeroReserva();
    
    const nuevaPersona: PostPersonaDto = {
      nombre: this.reservaData.nombre!,
      apellido: this.reservaData.apellido!,
      dni: Number(this.reservaData.dni!),
      telefono: this.reservaData.telefono!,
      email: this.reservaData.email!,
      tipoPersona: TipoPersona.CLIENTE,
      userAlta: 1
    };

    console.log('Creando/obteniendo persona por DNI:', nuevaPersona.dni);

    // Crear persona (el backend devuelve existente si ya existe)
    this.personaService.crearPersona(nuevaPersona).subscribe({
      next: (personaCreada) => {
        console.log('✅ Persona obtenida/creada exitosamente:', personaCreada);
        // Solo agregar si no existe en el array local
        if (!this.personas.find(p => p.id === personaCreada.id)) {
          this.personas.push(personaCreada);
        }
        this.crearReservaConPersona(personaCreada, nroReserva);
      },
      error: (error: any) => {
        console.error('❌ Error al obtener/crear persona:', error);
        Swal.fire({
          title: 'Error',
          text: 'No se pudo obtener o crear el cliente. Por favor intente nuevamente.',
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#e74c3c'
        });
      }
    });
  }

  private crearReservaConPersona(persona: Persona, nroReserva: number) {
    const nuevaReserva: PostReservaModel = {
      idPersona: persona.id!,
      //idDisponibilidad: Number(this.reservaData.idDisponibilidad),
      nroReserva: nroReserva,
      cantidadComensales: Number(this.reservaData.cantidadComensales),
      fechaReserva: this.reservaData.fechaReserva,
      evento: this.reservaData.evento!,
      horario: this.reservaData.horario
    };

    console.log('Datos de la nueva reserva a enviar:', nuevaReserva);
    console.log('URL del endpoint:', `${environment.apiUrl}/reserva/crear`);
    console.log('Token presente:', this.authService.getToken() ? 'Sí' : 'No');

    this.reservaService.crearReserva(nuevaReserva).subscribe({
      next: (response) => {
        console.log('Respuesta exitosa:', response);
        Swal.fire({
          title: '¡Reserva Confirmada!',
          html: `
            <div class="confirmation-message">
              <p><strong>Su reserva #${nroReserva} ha sido creada exitosamente</strong></p>
              <p>Cliente: ${persona.nombre} ${persona.apellido}</p>
              <div class="email-confirmation">
                <hr style="margin: 15px 0;">
                <p style="color: #27ae60;">
                  <i class="fas fa-envelope"></i> 
                  Se ha enviado un email de confirmación a:<br>
                  <strong>${persona.email}</strong>
                </p>
                <p style="font-size: 0.9em; color: #7f8c8d;">
                  Revise su bandeja de entrada y spam
                </p>
              </div>
            </div>
          `,
          icon: 'success',
          confirmButtonText: 'Continuar',
          confirmButtonColor: '#84C473',
          width: '500px'
        }).then(async () => {
          this.resetForm();
          await this.cambiarVista('lista');
        });
      },
      error: (error: any) => {
        console.error('Error al crear reserva:', error);
        Swal.fire({
          title: 'Error al crear reserva',
          text: 'No se pudo crear la reserva. Por favor intente nuevamente.',
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#e74c3c'
        });
      }
    });
  }

  private actualizarReservaExistente() {
    const reservaActualizada: PostReservaModel = {
      idPersona: Number(this.reservaData.idPersona),
      //idDisponibilidad: Number(this.reservaData.idDisponibilidad),
      nroReserva: Number(this.reservaData.nroReserva || this.generarNumeroReserva()),
      cantidadComensales: Number(this.reservaData.cantidadComensales),
      fechaReserva: this.reservaData.fechaReserva,
      evento: this.reservaData.evento!,
      horario: this.reservaData.horario
    };

    console.log('Datos de la reserva a actualizar:', reservaActualizada);

    this.reservaService.actualizarReserva(this.editingReservaId!, reservaActualizada).subscribe({
      next: (response) => {
        Swal.fire({
          title: '¡Reserva Actualizada!',
          text: 'La reserva ha sido actualizada exitosamente',
          icon: 'success',
          confirmButtonText: 'Continuar',
          confirmButtonColor: '#84C473'
        }).then(() => {
          this.resetForm();
          this.cambiarVista('lista');
        });
      },
      error: (error: any) => {
        console.error('Error al actualizar reserva:', error);
        const errorMsg = (error.error?.message || 'Ha ocurrido un error inesperado').replace('Error interno del servidor: ', '');
        Swal.fire({
          title: 'Error al actualizar reserva',
          text: errorMsg,
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#e74c3c'
        });
      }
    });
  }

  generarNumeroReserva(): number {
    return Math.floor(Math.random() * 900000) + 100000; // Genera un número de 6 dígitos
  }

  private mostrarModalPagoVIP() {
    const precioVIP = 5000; // Precio configurado en el backend
    
    Swal.fire({
      title: '👑 Reserva VIP',
      html: `
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 1.2em; margin-bottom: 20px; color: #2c3e50;">
            Para confirmar su <strong>reserva VIP</strong>, debe abonar:
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
      customClass: {
        popup: 'vip-payment-modal',
        confirmButton: 'btn-pago-vip',
        cancelButton: 'btn-cancelar-vip'
      },
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

      // 1. Generar número de reserva
      const nroReserva = this.generarNumeroReserva();

      // 2. Crear persona primero
      const nuevaPersona: PostPersonaDto = {
        nombre: this.reservaData.nombre!,
        apellido: this.reservaData.apellido!,
        dni: Number(this.reservaData.dni!),
        telefono: this.reservaData.telefono!,
        email: this.reservaData.email!, // Email obligatorio para VIP
        tipoPersona: TipoPersona.CLIENTE,
        userAlta: 1
      };

      console.log('📝 Creando persona:', nuevaPersona);
      const personaCreada = await this.personaService.crearPersona(nuevaPersona).toPromise();
      
      if (!personaCreada || !personaCreada.id) {
        throw new Error('Error al crear la persona');
      }

      console.log('✅ Persona creada:', personaCreada);

      // 3. Preparar request para reserva VIP con Mercado Pago
      const reservaVipRequest = {
        reservaData: {
          idPersona: personaCreada.id,
          //idDisponibilidad: Number(this.reservaData.idDisponibilidad),
          nroReserva: nroReserva,
          cantidadComensales: Number(this.reservaData.cantidadComensales),
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

      console.log('💰 Creando reserva VIP con pago:', reservaVipRequest);

      // 4. Llamar al backend para crear la reserva VIP
      const response = await this.reservaService.crearReservaVip(reservaVipRequest).toPromise();
      
      if (!response) {
        throw new Error('No se recibió respuesta del servidor');
      }

      console.log('✅ Respuesta de Mercado Pago:', response);

      // 5. Abrir el checkout de Mercado Pago con el SDK y la public key correcta
      if (!response.preferenceId || !response.publicKey) {
        throw new Error('No se recibió preference ID o public key del servidor');
      }

      // Mostrar mensaje informativo antes de abrir el checkout
      await Swal.fire({
        title: '🎉 ¡Reserva Iniciada!',
        html: `
          <p>Tu reserva <strong>#${nroReserva}</strong> ha sido iniciada.</p>
          <p>Serás redirigido a <strong>Mercado Pago</strong> para completar el pago.</p>
          <p class="text-muted mt-2">
            <small>Una vez completado el pago, recibirás la confirmación de tu reserva VIP.</small>
          </p>
        `,
        icon: 'success',
        confirmButtonText: 'Ir a pagar',
        confirmButtonColor: '#27ae60',
        timer: 3000,
        timerProgressBar: true
      });

      // Abrir Mercado Pago con SDK usando preference ID y public key
      this.reservaService.abrirCheckoutMercadoPago(
        response.preferenceId,
        response.publicKey,
        response.reservaId
      );

      // No hacer nada más - el callback se encargará de mostrar el resultado
      
    } catch (error: any) {
      console.error('❌ Error al procesar pago VIP:', error);
      
      let errorMessage = 'No se pudo procesar la reserva VIP. Por favor, intente nuevamente.';
      
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Limpiar el prefijo "Error interno del servidor: "
      errorMessage = errorMessage.replace('Error interno del servidor: ', '');
      
      Swal.fire({
        title: 'Error al procesar pago',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#e74c3c'
      });
      
      throw error; // Re-lanzar para que SweetAlert lo maneje
    }
  }

  resetForm() {
    this.prepararNuevaReserva();
  }

  getDisponibilidadesFiltradas(): DisponibilidadModel[] {
    const hoy = new Date().toISOString().split('T')[0];
    return this.disponibilidades.filter(d => 
      d.fecha >= hoy && 
      d.activo && 
      (d.cuposMaximos - d.cuposOcupados) >= this.reservaData.cantidadComensales
    );
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
    console.log('Actualizando fechas con disponibilidad...');
    console.log('Disponibilidades totales:', this.disponibilidades.length);
    console.log('Cantidad comensales requeridos:', this.reservaData.cantidadComensales);
    
    this.fechasConDisponibilidad = this.disponibilidades
      .filter(d => {
        const cumpleCondiciones = d.fecha >= hoy && 
          d.activo && 
          (d.cuposMaximos - d.cuposOcupados) >= this.reservaData.cantidadComensales;
        
        if (cumpleCondiciones) {
          console.log(`Fecha disponible: ${d.fecha}, Cupos libres: ${d.cuposMaximos - d.cuposOcupados}`);
        }
        
        return cumpleCondiciones;
      })
      .map(d => d.fecha);
    
    console.log('Fechas con disponibilidad filtradas:', this.fechasConDisponibilidad);
  }

  generarCalendario() {
    this.diasCalendario = [];
    const year = this.mesActual.getFullYear();
    const month = this.mesActual.getMonth();
    
    console.log('Generando calendario para:', year, month + 1);
    console.log('Fechas con disponibilidad:', this.fechasConDisponibilidad);
    
    // Primer día del mes
    const primerDia = new Date(year, month, 1);
    const ultimoDia = new Date(year, month + 1, 0);
    
    // Días del mes anterior para completar la primera semana
    const diasMesAnterior = primerDia.getDay();
    for (let i = diasMesAnterior - 1; i >= 0; i--) {
      const fecha = new Date(year, month, -i);
      this.diasCalendario.push({
        dia: fecha.getDate(),
        fecha: this.formatearFecha(fecha),
        esDelMesActual: false,
        tieneDisponibilidad: false,
        esHoy: false
      });
    }
    
    // Días del mes actual
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      const fecha = new Date(year, month, dia);
      const fechaString = this.formatearFecha(fecha);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      fecha.setHours(0, 0, 0, 0);
      
      const tieneDisponibilidad = this.fechasConDisponibilidad.includes(fechaString);
      
      if (tieneDisponibilidad) {
        console.log(`Día ${dia} marcado como disponible:`, fechaString);
      }
      
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
        fecha: this.formatearFecha(fecha),
        esDelMesActual: false,
        tieneDisponibilidad: false,
        esHoy: false
      });
    }
  }

  formatearFecha(fecha: Date): string {
    return fecha.toISOString().split('T')[0];
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
    if (dia.esDelMesActual && dia.tieneDisponibilidad && !dia.esPasado) {
      this.reservaData.fechaReserva = dia.fecha;
      this.fechaForm.patchValue({ fechaReserva: dia.fecha });
      //this.buscarDisponibilidad();
    }
  }

  esFechaSeleccionada(dia: any): boolean {
    return dia.fecha === this.reservaData.fechaReserva;
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

  decrementarComensales() {
    const currentValue = this.comensalesForm.get('cantidadComensales')?.value || 1;
    const newValue = Math.max(1, currentValue - 1);
    this.comensalesForm.patchValue({ cantidadComensales: newValue });
  }

  incrementarComensales() {
    const currentValue = this.comensalesForm.get('cantidadComensales')?.value || 1;
    const newValue = Math.min(20, currentValue + 1);
    this.comensalesForm.patchValue({ cantidadComensales: newValue });
  }

  // Métodos para la navegación entre vistas
  async cambiarVista(vista: 'nueva' | 'lista') {
    this.currentView = vista;
    if (vista === 'lista') {
      // Cargar personas primero, luego reservas
      try {
        await this.cargarPersonas();
        this.cargarReservasIniciales();
      } catch (error) {
        console.error('Error al cargar personas:', error);
        this.cargarReservasIniciales(); // Cargar reservas aunque falle personas
      }
    } else if (vista === 'nueva') {
      // Si no estamos en modo edición, resetear el formulario
      if (!this.isEditMode) {
        this.prepararNuevaReserva();
      }
    }
  }

  // Método para preparar una nueva reserva (formulario limpio)
  prepararNuevaReserva() {
    this.isEditMode = false;
    this.editingReservaId = null;
    this.currentStep = 1;
    
    // Limpiar datos del formulario
    this.reservaData = {
      cantidadComensales: 1,
      fechaReserva: '',
      evento: null,
      horario: '',
      idPersona: 0,
      idMesa: 0,
      //idDisponibilidad: 0
    };
    
    // Resetear formularios
    this.initializeForms();
    this.actualizarFechasConDisponibilidad();
    this.generarCalendario();
  }

  // ✅ Carga inicial - siguiendo el patrón estándar
  cargarReservasIniciales() {
    this.loading = true;
    console.log('🚀 Iniciando carga de reservas...');

    this.reservaService.obtenerReservas(0, 10).subscribe({
      next: (page) => {
        console.log('✅ Respuesta del backend:', page);
        this.pageInfo = page;
        // Filtrar reservas pendientes de pago (solo mostrar confirmadas)
        const reservasConfirmadas = page.content.filter((r: ReservaModel) => r.estadoReserva !== 'PENDIENTE_PAGO');
        this.reservas = reservasConfirmadas;
        this.reservasOriginales = [...reservasConfirmadas]; // Guardar copia para filtrado
        this.paginaActual = page.number;
        this.loading = false;
        console.log('✅ Reservas confirmadas cargadas:', this.reservas.length);
      },
      error: (error) => {
        console.error('❌ Error al cargar reservas:', error);
        this.loading = false;
        Swal.fire({
          title: 'Error',
          text: `No se pudieron cargar las reservas. Error ${error.status}: ${error.statusText}`,
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    });
  }

  // Método para limpiar filtros y recargar
  limpiarFiltrosYRecargar() {
    console.log('🧹 Limpiando filtros y recargando...');
    this.eventoSeleccionado = 'TODOS';
    this.busqueda = '';
    this.inicializarFechasPorDefecto(); // Restablecer a fechas del mes actual
    this.cargarReservasIniciales();
  }

  private construirFiltros(pagina: number = 0): any {
    const filtros: any = {
      page: pagina,
      size: this.tamanoPagina,
      evento: this.eventoSeleccionado
      // Nota: El backend actual no soporta búsqueda por texto
    };
    
    // Agregar filtros de fecha si están definidos
    if (this.fechaDesde && this.fechaDesde.trim() !== '') {
      filtros.fechaDesde = this.fechaDesde;
    }
    
    if (this.fechaHasta && this.fechaHasta.trim() !== '') {
      filtros.fechaHasta = this.fechaHasta;
    }
    
    console.log('🔧 Filtros construidos:', filtros);
    console.log('🔧 Estado de variables de filtros:', {
      eventoSeleccionado: this.eventoSeleccionado,
      busqueda: this.busqueda,
      fechaDesde: this.fechaDesde,
      fechaHasta: this.fechaHasta
    });
    console.log('🔧 ¿Filtrando por evento?', this.eventoSeleccionado === 'TODOS' ? 'No - mostrará todos los eventos' : `Sí: ${this.eventoSeleccionado}`);
    return filtros;
  }

  // ✅ Aplicar filtros - siguiendo el patrón estándar de mesas
  aplicarFiltros() {
    this.loading = true;
    this.paginaActual = 0;
    const filtros = this.construirFiltros(0); // Siempre empezar en página 0
    
    console.log('🚀 Aplicando filtros con URL:', `${environment.apiUrl}/reserva/filtrar`);
    console.log('📋 Filtros enviados:', filtros);

    this.reservaService.obtenerReservasConFiltros(filtros).subscribe({
      next: (page) => {
        console.log('✅ Respuesta del servidor:', page);
        this.pageInfo = page;
        // Filtrar reservas pendientes de pago
        const reservasConfirmadas = page.content.filter((r: ReservaModel) => r.estadoReserva !== 'PENDIENTE_PAGO');
        this.reservasOriginales = [...reservasConfirmadas]; // Guardar copia original
        this.paginaActual = page.number;
        
        // Aplicar filtrado del lado cliente para búsqueda
        this.aplicarFiltradoCliente();
        this.loading = false;
        console.log('✅ Filtros aplicados, reservas cargadas:', this.reservas.length);
      },
      error: (error) => {
        console.error('❌ Error al filtrar reservas:', error);
        console.error('❌ URL llamada:', error.url);
        console.error('❌ Status:', error.status);
        console.error('❌ Error completo:', error);
        this.loading = false;
        
        let mensaje = 'Error al filtrar reservas';
        if (error.status === 500) {
          mensaje = 'Error en el servidor. Verifique los filtros aplicados.';
        }
        
        Swal.fire({
          title: 'Error',
          text: mensaje,
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    });
  }

  // Nuevo método para filtrado del lado cliente (especialmente para búsqueda)
  aplicarFiltradoCliente() {
    let reservasFiltradas = [...this.reservasOriginales];
    
    // Filtrar por búsqueda si hay texto
    if (this.busqueda && this.busqueda.trim()) {
      const termino = this.busqueda.toLowerCase().trim();
      reservasFiltradas = reservasFiltradas.filter(reserva => {
        const nombreCliente = this.getNombreCliente(reserva.idPersona, reserva).toLowerCase();
        const nroReserva = reserva.nroReserva?.toString() || '';
        const evento = this.getEventoDisplayName(reserva.evento).toLowerCase();
        
        return nombreCliente.includes(termino) ||
               nroReserva.includes(termino) ||
               evento.includes(termino);
      });
    }
    
    this.reservas = reservasFiltradas;
    console.log('🔍 Filtrado del lado cliente aplicado. Reservas mostradas:', this.reservas.length);
  }

  // ✅ Métodos de filtros - siguiendo el patrón estándar
  onBusquedaChange() {
    // Para búsqueda, solo aplicar filtrado del lado cliente
    console.log('🔍 Búsqueda cambiada a:', this.busqueda);
    this.aplicarFiltradoCliente();
  }

  onEventoChange(evento: string) {
    console.log('🔍 Evento seleccionado:', evento);
    this.eventoSeleccionado = evento;
    this.aplicarFiltros();
  }

  onFechaChange() {
    console.log('🔍 Filtro de fecha cambiado:', { desde: this.fechaDesde, hasta: this.fechaHasta });
    this.aplicarFiltros();
  }

  getNombreCliente(idPersona: number, reserva?: ReservaModel): string {
    // Si la reserva incluye el nombre del backend, usarlo directamente
    if (reserva?.nombrePersona) {
      return reserva.nombrePersona;
    }
    
    // Si tenemos datos de cliente recién creado, usarlos
    if (reserva?.nombreCliente && reserva?.apellidoCliente) {
      return `${reserva.nombreCliente} ${reserva.apellidoCliente}`;
    }
    
    // Fallback: buscar en la cache local de personas
    const persona = this.personas.find(p => p.id === idPersona);
    if (persona) {
      return `${persona.nombre} ${persona.apellido}`;
    }
    
    return 'Cliente no encontrado';
  }

  editarReserva(reserva: ReservaModel) {
    // Activar modo edición
    this.isEditMode = true;
    this.editingReservaId = reserva.id!;
    
    // Llenar el formulario con los datos de la reserva
    this.reservaData = {
      cantidadComensales: reserva.cantidadComensales,
      fechaReserva: reserva.fechaReserva,
      evento: reserva.evento,
      horario: reserva.horario,
      idPersona: reserva.idPersona,
      //idDisponibilidad: reserva.idDisponibilidad,
      nroReserva: reserva.nroReserva
    };

    // Actualizar todos los formularios
    this.comensalesForm.patchValue({ cantidadComensales: reserva.cantidadComensales });
    this.fechaForm.patchValue({ fechaReserva: reserva.fechaReserva });
    this.eventoForm.patchValue({ evento: reserva.evento });
    this.horarioForm.patchValue({ horario: reserva.horario });
    this.personaMesaForm.patchValue({ 
      idPersona: reserva.idPersona
    });

    // Ir al paso 1 y cambiar a vista nueva
    this.currentStep = 1;
    this.currentView = 'nueva';
    this.actualizarFechasConDisponibilidad();
    this.generarCalendario();
  }

  eliminarReserva(id: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      cancelButtonColor: '#95a5a6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.reservaService.eliminarReserva(id).subscribe({
          next: () => {
            Swal.fire({
              title: 'Eliminado',
              text: 'La reserva ha sido eliminada exitosamente',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
            this.cargarReservasIniciales(); // Recargar la lista
          },
          error: (error) => {
            console.error('Error al eliminar reserva:', error);
            Swal.fire({
              title: 'Error',
              text: 'No se pudo eliminar la reserva',
              icon: 'error',
              confirmButtonText: 'OK'
            });
          }
        });
      }
    });
  }

  // ✅ Paginación mejorada con puntos suspensivos
  obtenerPaginasVisibles(): (number | null)[] {
    if (!this.pageInfo) {
      return [];
    }

    const totalPages = this.pageInfo.totalPages;
    const pages: (number | null)[] = [];

    if (totalPages <= 7) {
      // Si hay 7 páginas o menos, mostrar todas
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Mostrar: 1, 2, 3, 4, ..., última
      pages.push(0, 1, 2, 3);
      pages.push(null); // Puntos suspensivos
      pages.push(totalPages - 1);
    }

    return pages;
  }

  irAPagina(pagina: number) {
    if (pagina >= 0 && this.pageInfo && pagina < this.pageInfo.totalPages) {
      this.paginaActual = pagina;
      const filtros = this.construirFiltros(pagina); // Mantener filtros actuales

      this.loading = true;
      this.reservaService.obtenerReservasConFiltros(filtros).subscribe({
        next: (page) => {
          this.pageInfo = page;
          // Filtrar reservas pendientes de pago
          const reservasConfirmadas = page.content.filter((r: ReservaModel) => r.estadoReserva !== 'PENDIENTE_PAGO');
          this.reservasOriginales = [...reservasConfirmadas]; // Actualizar originales
          this.paginaActual = page.number;
          this.aplicarFiltradoCliente(); // Aplicar filtrado del lado cliente
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al cambiar página:', error);
          this.loading = false;
        }
      });
    }
  }

  // ✅ ACTUALIZADO: Método para abrir el selector de reportes
  abrirReportes() {
    this.mostrarSelectorReportes = true;
  }

  // ✅ NUEVO: Manejar selección de reporte
  onReporteSeleccionado(tipoReporte: TipoReporte) {
    this.mostrarSelectorReportes = false;
    
    switch (tipoReporte.id) {
      case 'pedidos-fecha':
        // Abrir el modal de reportes usando NgbModal
        const modalRef = this.modalService.open(ReportesModalComponent, {
          size: 'xl',
          backdrop: 'static',
          centered: true
        });
        modalRef.componentInstance.modulo = 'reservas';
        break;
        
      case 'clientes-reservas':
        // Abrir el nuevo modal de clientes con reservas
        this.abrirReporteClientesReservas();
        break;
        
      default:
        console.warn('Tipo de reporte no implementado:', tipoReporte.id);
    }
  }

  // ✅ NUEVO: Cerrar selector de reportes
  onCancelarSelector() {
    this.mostrarSelectorReportes = false;
  }

  // ✅ NUEVO: Abrir reporte específico de clientes con reservas
  private abrirReporteClientesReservas() {
    this.clientesReservasModal.show();
  }

  // ==================== MÉTODOS DE MERCADO PAGO ====================

  /**
   * Verifica si venimos de un callback de Mercado Pago y muestra el resultado
   */
  verificarCallbackPago(): void {
    this.route.queryParams.subscribe(params => {
      const payment = params['payment'];
      const reservaId = params['reservaId'];

      if (payment && reservaId) {
        console.log('💳 Callback de Mercado Pago detectado:', { payment, reservaId });

        // Cambiar a vista de lista ANTES de limpiar query params
        this.currentView = 'lista';

        // Limpiar los query params de la URL
        this.router.navigate([], {
          queryParams: {},
          replaceUrl: true
        });

        // Verificar el estado de la reserva en el backend
        this.reservaService.verificarPagoReserva(Number(reservaId)).subscribe({
          next: (reserva) => {
            console.log('✅ Estado de la reserva:', reserva);
            this.mostrarResultadoPago(payment, reserva);
          },
          error: (error) => {
            console.error('❌ Error al verificar reserva:', error);
            this.mostrarResultadoPago(payment, null);
          }
        });
      }
    });
  }

  /**
   * Muestra el resultado del pago según el estado
   */
  private mostrarResultadoPago(estadoPago: string, reserva: ReservaModel | null): void {
    switch (estadoPago) {
      case 'success':
        Swal.fire({
          title: '¡Pago Exitoso!',
          html: `
            <div class="vip-confirmation">
              <p><strong>👑 Tu reserva VIP ha sido confirmada</strong></p>
              ${reserva ? `
                <div class="reservation-details">
                  <p><strong>Reserva #${reserva.nroReserva}</strong></p>
                  <p>Fecha: ${reserva.fechaReserva}</p>
                  <p>Horario: ${reserva.horario}</p>
                  <p>Comensales: ${reserva.cantidadComensales}</p>
                </div>
              ` : ''}
              <div class="email-notification" style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p style="color: #27ae60; margin: 0;">
                  <i class="fas fa-envelope"></i> 
                  Email de confirmación enviado
                </p>
                <p style="font-size: 0.9em; color: #2e7d32; margin: 5px 0 0 0;">
                  Revise su bandeja de entrada con todos los detalles de su reserva VIP
                </p>
              </div>
              <p class="text-success mt-3">¡Te esperamos para una experiencia única!</p>
            </div>
          `,
          icon: 'success',
          confirmButtonText: 'Ver mis reservas',
          confirmButtonColor: '#84C473',
          width: '500px'
        }).then(() => {
          this.cambiarVista('lista');
        });
        break;

      case 'pending':
        Swal.fire({
          title: 'Pago Pendiente',
          html: `
            <p>Tu pago está siendo procesado</p>
            ${reserva ? `<p><strong>Reserva #${reserva.nroReserva}</strong></p>` : ''}
            <p class="text-warning mt-3">Te notificaremos cuando se confirme el pago</p>
          `,
          icon: 'info',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#f5d76e'
        }).then(() => {
          this.cambiarVista('lista');
        });
        break;

      case 'failure':
        Swal.fire({
          title: 'Pago Rechazado',
          html: `
            <p>No se pudo procesar tu pago</p>
            <p class="text-danger mt-3">Por favor, intenta nuevamente con otro método de pago</p>
          `,
          icon: 'error',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#e74c3c'
        }).then(() => {
          this.cambiarVista('lista');
        });
        break;
    }
  }

  // ==================== MÉTODOS DE DISPONIBILIDAD ====================

  /**
   * Abre el modal para crear disponibilidades mensuales
   */
  abrirModalDisponibilidad() {
    console.log('🔵 Botón de disponibilidad clickeado');
    console.log('Modal:', this.disponibilidadModal);
    if (this.disponibilidadModal) {
      this.disponibilidadModal.show();
    } else {
      console.error('❌ El modal de disponibilidad no está disponible');
    }
  }

  /**
   * Callback cuando se crean disponibilidades exitosamente
   */
  onDisponibilidadesCreadas() {
    console.log('✅ Disponibilidades creadas, recargando...');
    // Recargar disponibilidades
    this.cargarDatos();
    // Regenerar calendario
    this.actualizarFechasConDisponibilidad();
    this.generarCalendario();
  }
}
    