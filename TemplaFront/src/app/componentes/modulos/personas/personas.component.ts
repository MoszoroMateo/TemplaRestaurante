import { CommonModule,  } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PersonaModalComponent } from '../../modales/persona-modal/persona-modal.component';
import { PersonaService } from '../../../services/persona.service';
import { Page } from '../../models/CommonModels';
import { Persona, TipoPersona, FiltroPersona, PostPersonaDto } from '../../models/PersonaModel';
import { AuthService } from '../../../services/auth.service';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-personas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './personas.component.html',
  styleUrl: './personas.component.css'
})
export class PersonasComponent implements OnInit {
  
  // ✅ Datos
  personas: Persona[] = [];
  pageInfo: Page<Persona> | null = null;
  
  // ✅ Filtros
  busqueda: string = '';
  tipoSeleccionado: TipoPersona | '' = TipoPersona.PERSONAL;
  estadoSeleccionado: string = 'ACTIVOS';
  
  // ✅ Paginación
  paginaActual: number = 0;
  tamanoPagina: number = 10;

  // ✅ Loading
  cargando: boolean = false;

  TipoPersona = TipoPersona;

  get Math() {
    return Math;
  }

  constructor(
    private modalService: NgbModal,
    private personaService: PersonaService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.cargarEmpleadosIniciales();
  }

  // ✅ Carga inicial - solo empleados
  cargarEmpleadosIniciales() {
    this.cargando = true;
    this.personaService.obtenerPersonas(0, 10).subscribe({
      next: (page) => {
        this.pageInfo = page;
        this.personas = page.content;
        this.paginaActual = page.number;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar empleados:', error);
        this.cargando = false;
      }
    });
  }

  private construirFiltros(pagina: number = 0): FiltroPersona {
    let activoFiltro: boolean | undefined;
    
    if (this.estadoSeleccionado === 'ACTIVOS') {
      activoFiltro = true;
    } else if (this.estadoSeleccionado === 'BAJA') {
      activoFiltro = false;
    } else {
      activoFiltro = undefined; // TODOS
    }
    
    return {
      busqueda: this.busqueda,
      tipo: this.tipoSeleccionado === '' ? undefined : this.tipoSeleccionado,
      activo: activoFiltro,
      page: pagina,
      size: this.tamanoPagina
    };
  }

  // ✅ Aplicar filtros
  aplicarFiltros() {
    this.cargando = true;
    const filtros = this.construirFiltros(0); // Siempre empezar en página 0

    this.personaService.obtenerPersonasConFiltros(filtros).subscribe({
      next: (page) => {
        this.pageInfo = page;
        this.personas = page.content;
        this.paginaActual = page.number;
        this.cargando = false;
        console.log('✅ Filtros aplicados, personas cargadas:', page.content.length);
      },
      error: (error) => {
        console.error('Error al filtrar personas:', error);
        this.cargando = false;
      }
    });
  }

  // ✅ Métodos de filtros
  onBusquedaChange() {
    this.aplicarFiltros();
  }

  onTipoChange(tipo: TipoPersona | '') {
    this.tipoSeleccionado = tipo;
    this.aplicarFiltros();
  }

  onEstadoChange(estado: string) {
    console.log('🔍 Estado seleccionado:', estado);
    this.estadoSeleccionado = estado;
    this.aplicarFiltros();
  } 

  obtenerPaginasVisibles(): (number | null)[] {
    if (!this.pageInfo) return [];
    
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

 openNewPersonModal(persona?: Persona) {
  const modalRef = this.modalService.open(PersonaModalComponent, {
    size: 'lg',
    backdrop: 'static'
  });

  if (persona) {
    modalRef.componentInstance.isEditMode = true;
    modalRef.componentInstance.personaData = persona; // ✅ Copia del objeto
  } else {
    modalRef.componentInstance.isEditMode = false;
  }

  modalRef.result.then((result: Persona) => {
    console.log('Persona guardada:', result);
    
    // ✅ IMPLEMENTAR LAS LLAMADAS REALES
    if (persona) {
      // Es edición
      this.actualizarPersona(result);
    } else {
      // Es creación
      this.crearPersona(result);
    }
  }).catch((error) => {
    console.log('Modal cerrado sin guardar');
  });
}

// ✅ MÉTODO para convertir Persona a PostPersonaDto
private convertirAPostDto(persona: Persona): PostPersonaDto {
  // Obtener ID del usuario actual
  //const usuario = this.authService.getUser();
  const userAlta = 1 //usuario?.id || 1;

  return {
    nombre: persona.nombre,
    apellido: persona.apellido,
    email: persona.email,
    telefono: persona.telefono,
    dni: parseInt(persona.dni) || 0, // ✅ Convertir string a number
    tipoPersona: persona.tipoPersona!, // ✅ El enum ya es correcto
    userAlta: userAlta // ✅ ID del usuario que crea
  };
}

// ✅ ACTUALIZAR crearPersona
crearPersona(persona: Persona) {
  this.cargando = true;
  
  // ✅ Convertir a DTO antes de enviar
  const personaDto = this.convertirAPostDto(persona);
  
  this.personaService.crearPersona(personaDto).subscribe({
    next: (personaCreada) => {
      console.log('✅ Persona creada exitosamente:', personaCreada);
      this.cargarEmpleadosIniciales();
      Swal.fire({
        title: '¡Éxito!',
        text: 'Persona creada exitosamente',
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#84C473'
      });
    },
    error: (error) => {
      console.error('❌ Error al crear persona:', error);
      this.cargando = false;
      Swal.fire({
        title: 'Error',
        text: 'Error al crear la persona',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#e74c3c'
      });
    }
  });
}

  actualizarPersona(persona: Persona) {
    this.cargando = true;
    this.personaService.actualizarPersona(persona).subscribe({
      next: (personaActualizada) => {
        console.log('✅ Persona actualizada exitosamente:', personaActualizada);
        this.aplicarFiltros(); // Recargar con filtros actuales
        Swal.fire({
          title: '¡Éxito!',
          text: 'Persona actualizada exitosamente',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#84C473'
        });
      },
      error: (error) => {
        console.error('❌ Error al actualizar persona:', error);
        this.cargando = false;
        Swal.fire({
          title: 'Error',
          text: 'Error al actualizar la persona',
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#e74c3c'
        });
      }
    });
  }

  // ✅ COMPLETAR EL MÉTODO DE ELIMINAR
  eliminarPersona(persona: Persona) {
    Swal.fire({
      title: '¿Está seguro?',
      text: `¿Desea eliminar a ${persona.nombre} ${persona.apellido}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.cargando = true;
        this.personaService.eliminarPersona(persona.id!).subscribe({
          next: () => {
            console.log('✅ Persona eliminada exitosamente');
            this.aplicarFiltros(); // Recargar lista
            Swal.fire({
              title: '¡Eliminada!',
              text: 'Persona eliminada exitosamente',
              icon: 'success',
              confirmButtonText: 'OK',
              confirmButtonColor: '#84C473'
            });
          },
          error: (error) => {
            console.error('❌ Error al eliminar persona:', error);
            this.cargando = false;
            Swal.fire({
              title: 'Error',
              text: 'Error al eliminar la persona',
              icon: 'error',
              confirmButtonText: 'OK',
              confirmButtonColor: '#e74c3c'
            });
          }
        });
      }
    });
  }

  // ✅ COMPLETAR EL MÉTODO DE PAGINACIÓN
  irAPagina(pagina: number) {
    if (pagina >= 0 && this.pageInfo && pagina < this.pageInfo.totalPages) {
      this.paginaActual = pagina;
      const filtros = this.construirFiltros(pagina); // Mantener filtros actuales

      this.cargando = true;
      this.personaService.obtenerPersonasConFiltros(filtros).subscribe({
        next: (page) => {
          this.pageInfo = page;
          this.personas = page.content;
          this.paginaActual = page.number;
          this.cargando = false;
        },
        error: (error) => {
          console.error('Error al cambiar página:', error);
          this.cargando = false;
        }
      });
    }
  }
}
