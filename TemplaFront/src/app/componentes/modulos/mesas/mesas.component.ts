import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MesaService } from '../../../services/mesa.service';
import { AlertService } from '../../../services/alert.service'; // ✅ AGREGAR
import { Page } from '../../models/CommonModels';
import { GetMesaDto, PostMesaDto, EstadoMesa } from '../../models/MesasModel';
import { AuthService } from '../../../services/auth.service';
import { MesaModalComponent } from '../../modales/mesa-modal/mesa-modal.component';

@Component({
  selector: 'app-mesas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mesas.component.html',
  styleUrl: './mesas.component.css'
})
export class MesasComponent implements OnInit {
  
  // ✅ Datos
  mesas: GetMesaDto[] = [];
  pageInfo: Page<GetMesaDto> | null = null;
  
  // ✅ Filtros
  busqueda: string = '';
  estadoSeleccionado: string = 'TODOS';
  
  // ✅ Paginación
  paginaActual: number = 0;
  tamanoPagina: number = 10;

  // ✅ Loading
  cargando: boolean = false;

  // ✅ Enum para el template
  EstadoMesa = EstadoMesa;

  get Math() {
    return Math;
  }

  constructor(
    private modalService: NgbModal,
    private mesaService: MesaService,
    private authService: AuthService,
    private alertService: AlertService // ✅ AGREGAR
  ) {}

  ngOnInit() {
    this.cargarMesasIniciales();
  }

  // ✅ Carga inicial - todas las mesas
  cargarMesasIniciales() {
    this.cargando = true;
    this.mesaService.getMesas(0, 10).subscribe({
      next: (page) => {
        this.pageInfo = page;
        this.mesas = page.content;
        this.paginaActual = page.number;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar mesas:', error);
        this.cargando = false;
        this.alertService.mesa.loadError(); // ✅ USAR AlertService
      }
    });
  }

  // ✅ Aplicar filtros
  aplicarFiltros() {
    this.cargando = true;
    this.paginaActual = 0;

    this.mesaService.getMesasFiltradas(
      this.paginaActual,
      this.tamanoPagina,
      this.busqueda,
      this.estadoSeleccionado
    ).subscribe({
      next: (page) => {
        this.pageInfo = page;
        this.mesas = page.content;
        this.paginaActual = page.number;
        this.cargando = false;
        console.log('✅ Filtros aplicados, mesas cargadas:', page.content.length);
      },
      error: (error) => {
        console.error('Error al filtrar mesas:', error);
        this.cargando = false;
        this.alertService.mesa.loadError(); // ✅ USAR AlertService
      }
    });
  }

  // ✅ Métodos de filtros
  onBusquedaChange() {
    this.aplicarFiltros();
  }

  onEstadoChange(estado: string) {
    console.log('🔍 Estado seleccionado:', estado);
    this.estadoSeleccionado = estado;
    this.aplicarFiltros();
  }

  // ✅ Método para obtener páginas visibles
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

  // ✅ Modal para nueva mesa
  openNewMesaModal(mesa?: GetMesaDto) {
    const modalRef = this.modalService.open(MesaModalComponent, {
      size: 'md',
      backdrop: 'static'
    });

    if (mesa) {
      modalRef.componentInstance.isEditMode = true;
      modalRef.componentInstance.mesaData = mesa;
    } else {
      modalRef.componentInstance.isEditMode = false;
    }

    modalRef.result.then((resultado) => {
      console.log('🔍 Resultado del modal:', resultado);

      if (resultado && resultado.accion) {
        switch (resultado.accion) {
          case 'crear':
            this.crearMesa(resultado.mesa);
            break;
          case 'actualizar':
            this.actualizarMesa(resultado.mesa);
            break;
          case 'cambiarEstado':
            this.cambiarEstadoMesa(resultado.mesa);
            break;
        }
      }
    }).catch(() => {
      console.log('Modal cancelado');
    });
  }

  // ✅ AGREGAR: Crear mesa
  crearMesa(mesa: PostMesaDto) {
    this.cargando = true;
    
    this.mesaService.createMesa(mesa).subscribe({
      next: (mesaCreada) => {
        console.log('✅ Mesa creada exitosamente:', mesaCreada);
        this.cargarMesasIniciales(); // Recargar todas las mesas
        this.alertService.mesa.created(); // ✅ USAR AlertService
      },
      error: (error) => {
        console.error('❌ Error al crear mesa:', error);
        this.cargando = false;
        this.alertService.mesa.createError(); // ✅ USAR AlertService
      }
    });
  }

  // ✅ Actualizar mesa
  actualizarMesa(mesa: GetMesaDto) {
    this.cargando = true;
    this.mesaService.updateMesa(mesa).subscribe({
      next: (mesaActualizada) => {
        console.log('✅ Mesa actualizada exitosamente:', mesaActualizada);
        this.aplicarFiltros();
        this.alertService.mesa.updated(); // ✅ USAR AlertService
      },
      error: (error) => {
        console.error('❌ Error al actualizar mesa:', error);
        this.cargando = false;
        this.alertService.mesa.updateError(); // ✅ USAR AlertService
      }
    });
  }

  // ✅ Cambiar estado de mesa
  cambiarEstadoMesa(mesa: GetMesaDto) {
    this.cargando = true;
    this.mesaService.cambiarEstadoMesa(mesa).subscribe({
      next: () => {
        console.log('✅ Estado cambiado exitosamente');
        this.aplicarFiltros();
        this.alertService.mesa.statusChanged(this.getEstadoTexto(mesa.estadoMesa)); // ✅ USAR AlertService
      },
      error: (error) => {
        console.error('❌ Error al cambiar estado:', error);
        this.cargando = false;
        this.alertService.mesa.statusChangeError(); // ✅ USAR AlertService
      }
    });
  }

  // ✅ Paginación
  irAPagina(pagina: number) {
    if (pagina >= 0 && this.pageInfo && pagina < this.pageInfo.totalPages) {
      this.paginaActual = pagina;

      this.cargando = true;
      this.mesaService.getMesasFiltradas(
        pagina,
        this.tamanoPagina,
        this.busqueda,
        this.estadoSeleccionado
      ).subscribe({
        next: (page) => {
          this.pageInfo = page;
          this.mesas = page.content;
          this.paginaActual = page.number;
          this.cargando = false;
        },
        error: (error) => {
          console.error('Error al cambiar página:', error);
          this.cargando = false;
          this.alertService.mesa.loadError(); // ✅ USAR AlertService
        }
      });
    }
  }

  // ✅ Obtener texto del estado
  getEstadoTexto(estado: EstadoMesa): string {
    switch (estado) {
      case EstadoMesa.DISPONIBLE:
        return 'Disponible';
      case EstadoMesa.OCUPADA:
        return 'Ocupada';
      case EstadoMesa.RESERVADA:
        return 'Reservada';
      case EstadoMesa.FUERA_SERVICIO:
        return 'Fuera de Servicio';
      default:
        return estado;
    }
  }

  // ✅ Obtener clase CSS del estado
  getEstadoBadgeClass(estado: EstadoMesa): string {
    switch (estado) {
      case EstadoMesa.DISPONIBLE:
        return 'badge-disponible';
      case EstadoMesa.OCUPADA:
        return 'badge-ocupada';
      case EstadoMesa.RESERVADA:
        return 'badge-reservada';
      case EstadoMesa.FUERA_SERVICIO:
        return 'badge-fuera-servicio';
      default:
        return 'badge-disponible';
    }
  }
}