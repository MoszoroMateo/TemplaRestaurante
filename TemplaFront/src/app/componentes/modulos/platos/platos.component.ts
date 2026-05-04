import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PlatoService } from '../../../services/plato.service';
import { Page } from '../../models/CommonModels';
import { GetPlatoDto, PostPlatoDto } from '../../models/PlatoModel';
import { ProductoDTO } from '../../models/ProductoModel';
import { ProductoService } from '../../../services/producto.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PlatoModalComponent } from '../../modales/plato-modal/plato-modal.component';
import { ReportesModalComponent } from '../../modales/reportes-modal/reportes-modal.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-platos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './platos.component.html',
  styleUrl: './platos.component.css'
})
export class PlatosComponent implements OnInit {
  // ✅ Tipado fuerte
  platos: GetPlatoDto[] = [];
  productos: ProductoDTO[] = []; // ✅ AGREGAR: Cache de productos
  productosMap = new Map<number, ProductoDTO>(); // ✅ AGREGAR: Mapa para acceso rápido



  pageInfo: Page<GetPlatoDto> | null = null;
  cargando: boolean = false;

  // Filtros
  busqueda: string = '';
  tipoSeleccionado: string = 'TODOS';
  estadoSeleccionado: string = 'TODOS';

  // Paginación
  paginaActual: number = 0;
  tamanoPagina: number = 12; // 3 filas x 4 columnas
  Math = Math;

  constructor(
    private platoService: PlatoService,
    private productoService: ProductoService,
    private modalService: NgbModal
  ) { }
  ngOnInit(): void {
    this.cargarProductos();
    this.cargarPlatos();
  }

  cargarProductos(): void {
    this.productoService.obtenerInsumos(0, 1000).subscribe({
      next: (response) => {
        this.productos = response.content;
        // Crear mapa para acceso rápido por ID
        this.productos.forEach(producto => {
          if (producto.id) {
            this.productosMap.set(producto.id, producto);
          }
        });
        console.log('Insumos cargados para platos:', this.productos.length);
      },
      error: (error) => {
        console.error('Error al cargar insumos:', error);
      }
    });
  }

  formatearIngrediente(ingrediente: any): string {
    const producto = this.productosMap.get(ingrediente.idProducto);
    if (producto) {
      const unidad = this.getUnidadCorta(producto.unidadMedida);
      return `${ingrediente.cantidad}${unidad} ${producto.nombre.toUpperCase()}`;
    }
    return `${ingrediente.cantidad}g PRODUCTO_${ingrediente.idProducto}`;
  }

  private getUnidadCorta(unidadMedida: string): string {
    switch (unidadMedida) {
      case 'KILOGRAMO': return 'kg';
      case 'GRAMO': return 'g';
      case 'LITRO': return 'l';
      default: return 'u';
    }
  }

  cargarPlatos(): void {
    this.cargando = true;

    this.platoService.getPlatosFiltrados(
      this.paginaActual,
      this.tamanoPagina,
      this.busqueda || undefined,
      this.tipoSeleccionado !== 'TODOS' ? this.tipoSeleccionado : undefined,
      this.estadoSeleccionado !== 'TODOS' ? this.estadoSeleccionado : undefined
    ).subscribe({
      next: (response: Page<GetPlatoDto>) => {
        this.pageInfo = response;
        this.platos = response.content;
        this.cargando = false;
        console.log('Platos cargados:', this.platos);
      },
      error: (error) => {
        console.error('Error al cargar platos:', error);
        this.cargando = false;
      }
    });
  }

  irAPagina(pagina: number): void {
    if (pagina >= 0 && pagina < (this.pageInfo?.totalPages || 0)) {
      this.paginaActual = pagina;
      this.cargarPlatos();
    }
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

  // ✅ Métodos con tipado correcto
  getEstadoBadgeClass(plato: GetPlatoDto): string {
    // Como GetPlatoDto no tiene fechaBaja, solo verificamos disponible
    if (plato.disponible) return 'estado-badge estado-disponible';
    return 'estado-badge estado-no-disponible';
  }

  getEstadoTexto(plato: GetPlatoDto): string {
    return plato.disponible ? 'Disponible' : 'No Disponible';
  }

  onBusquedaChange(): void {
    this.aplicarFiltros();
  }

  onTipoChange(tipo: string): void {
    this.tipoSeleccionado = tipo;
    this.aplicarFiltros();
  }

  onEstadoChange(estado: string): void {
    this.estadoSeleccionado = estado;
    this.aplicarFiltros();
  }

  // ✅ Métodos de filtrado
  aplicarFiltros(): void {
    this.paginaActual = 0; // Resetear a primera página
    this.cargarPlatos();
  }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.tipoSeleccionado = 'TODOS';
    this.estadoSeleccionado = 'TODOS';
    this.paginaActual = 0;
    this.cargarPlatos();
  }

  abrirModalNuevoPlato(): void {
    const modalRef = this.modalService.open(PlatoModalComponent, {
      size: 'lg',
      backdrop: 'static'
    });
    modalRef.componentInstance.isEditMode = false;
    modalRef.componentInstance.productos = this.productos;

    modalRef.result.then((resultado) => {
      console.log('🔍 Resultado completo del modal:', resultado);

      if (resultado) {
        if (resultado.accion && resultado.plato) {
          console.log('🔍 Creando plato desde estructura:', resultado.plato);
          this.crearPlato(resultado);
        } else {
          console.log('🔍 Creando plato directo:', resultado);
          this.crearPlato(resultado);
        }
      }
    }).catch((error) => {
      console.log('Modal cancelado' + error);
    });
  }

  abrirModalEditarPlato(plato: GetPlatoDto): void {
    const modalRef = this.modalService.open(PlatoModalComponent, {
      size: 'lg',
      backdrop: 'static'
    });
    modalRef.componentInstance.isEditMode = true;
    modalRef.componentInstance.platoData = plato;
    modalRef.componentInstance.productos = this.productos;

    modalRef.result.then((resultado) => {
      if (resultado) {
        // ✅ NUEVO: Verificar si viene con acción específica
        if (resultado.accion) {
          console.log('Acción recibida desde modal:', resultado.accion);

          switch (resultado.accion) {
            case 'guardar':
              this.actualizarPlato(resultado);
              break;
            case 'toggleDisponibilidad':
              this.ejecutarToggleDesdeModal(resultado.plato);
              break;
            case 'eliminar':
              this.ejecutarEliminacionDesdeModal(resultado.plato);
              break;
            default:
              console.log('Acción no reconocida:', resultado.accion);
          }
        } else {
          // Si no viene con acción, es actualización normal
          this.actualizarPlato(resultado);
        }
      }
    }).catch(() => {
      console.log('Modal cancelado');
    });
  }

  // ✅ NUEVO: Método específico para toggle desde modal
  private ejecutarToggleDesdeModal(plato: GetPlatoDto): void {
    console.log('Ejecutando toggle disponibilidad desde modal:', plato);
    this.cargando = true;
    this.platoService.activarDesactivarPlato(plato.idPlato).subscribe({
      next: (response) => {
        const accion = plato.disponible ? 'activado' : 'desactivado';
        console.log(`✅ Plato ${accion} exitosamente`);
        this.cargarPlatos();
        
        // ✅ Mostrar advertencia si existe
        if (response.mensaje) {
          Swal.fire({
            title: `Plato ${accion}`,
            html: `<p>${response.mensaje}</p>`,
            icon: 'warning',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#f5d76e'
          });
        } else {
          Swal.fire({
            title: '¡Éxito!',
            text: `Plato ${accion} exitosamente`,
            icon: 'success',
            confirmButtonText: 'OK',
            confirmButtonColor: '#84C473'
          });
        }
      },
      error: (error) => {
        console.error('❌ Error al cambiar disponibilidad:', error);
        this.cargando = false;
        Swal.fire({
          title: 'Error',
          text: 'Error al cambiar la disponibilidad del plato',
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#e74c3c'
        });
      }
    });
  }

  // ✅ NUEVO: Método específico para eliminación desde modal
  private ejecutarEliminacionDesdeModal(plato: GetPlatoDto): void {
    console.log('Ejecutando eliminación desde modal:', plato);
    this.cargando = true;
    this.platoService.bajaPlato(plato.idPlato).subscribe({
      next: () => {
        console.log('✅ Plato eliminado exitosamente');
        this.cargarPlatos();
        Swal.fire({
          title: '¡Eliminado!',
          text: 'Plato eliminado exitosamente',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#84C473'
        });
      },
      error: (error) => {
        console.error('❌ Error al eliminar plato:', error);
        this.cargando = false;
        Swal.fire({
          title: 'Error',
          text: 'Error al eliminar el plato',
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#e74c3c'
        });
      }
    });
  }

  private crearPlato(resultado: any): void {
    this.cargando = true;
    console.log('Creando plato:', resultado);

    const platoDto = resultado.plato || resultado;
    const imagen = resultado.imagen || null;

    console.log('🔍 Plato DTO:', platoDto);
    console.log('🔍 Imagen seleccionada:', imagen);

    if (!platoDto) {
      console.error('❌ platoDto es null o undefined');
      this.cargando = false;
      return;
    }

    // Validar ingredientes
    if (!platoDto.ingredientes || platoDto.ingredientes.length === 0) {
      console.error('❌ No hay ingredientes para crear el plato');
      this.cargando = false;
      Swal.fire({
        title: 'Error',
        text: 'El plato debe tener al menos un ingrediente',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#e74c3c'
      });
      return;
    }

    // Transformar al formato que espera el backend
    const platoParaCrear: PostPlatoDto = {
      nombre: platoDto.nombre,
      descripcion: platoDto.descripcion,
      precio: parseFloat(platoDto.precio),
      tipoPlato: platoDto.tipoPlato,
      ingredientes: (platoDto.ingredientes || []).map((ing: any) => {
        console.log('🔍 Ingrediente individual:', ing); // ✅ Debug cada ingrediente
        return {
          id: parseInt(ing.idProducto), // ✅ CAMBIAR: ing.id -> ing.idProducto
          cantidad: parseFloat(ing.cantidad)
        };
      })
    };

    console.log('🔍 JSON que se enviará:', JSON.stringify(platoParaCrear, null, 2));

    this.platoService.createPlato(platoParaCrear, imagen).subscribe({
      next: (platoCreado) => {
        console.log('✅ Plato creado exitosamente:', platoCreado);
        this.cargarPlatos();
        Swal.fire({
          title: '¡Éxito!',
          text: 'Plato creado exitosamente',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#84C473'
        });
      },
      error: (error) => {
        this.cargando = false;
        console.error('❌ Error al crear plato:', error);
        Swal.fire({
          title: 'Error',
          text: 'Error al crear el plato',
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#e74c3c'
        });
      }
    });
  }

private actualizarPlato(resultado: any): void {
  this.cargando = true;
  console.log('🔍 ACTUALIZAR PLATO - Resultado recibido:', resultado);

  // ✅ NUEVO: Extraer plato e imagen del resultado (igual que en crear)
  let platoDto: any;
  let imagen: File | undefined = undefined;

  if (resultado.accion && resultado.plato) {
    // Caso: { accion: 'guardar', plato: {...}, imagen: File }
    platoDto = resultado.plato;
    imagen = resultado.imagen || undefined;
  } else {
    // Caso: plato directo (fallback)
    platoDto = resultado;
    imagen = undefined;
  }

  console.log('🔍 Plato DTO para actualizar:', platoDto);
  console.log('🔍 Nueva imagen:', imagen?.name || 'Sin cambios de imagen');

  const platoParaActualizar = {
    ...platoDto,
    precio: parseFloat(platoDto.precio),
    ingredientes: platoDto.ingredientes?.map((ing: any) => ({
      idProducto: parseInt(ing.idProducto),
      cantidad: parseFloat(ing.cantidad)
    })) || []
  };

  console.log('🔍 Plato transformado para actualización:', platoParaActualizar);

  // ✅ CAMBIAR: Usar el método actualizado del service con imagen
  this.platoService.actualizarPlato(platoParaActualizar, imagen).subscribe({
    next: (platoActualizado) => {
      console.log('✅ Plato actualizado exitosamente:', platoActualizado);
      this.cargarPlatos();
      Swal.fire({
        title: '¡Éxito!',
        text: 'Plato actualizado exitosamente',
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#84C473'
      });
    },
    error: (error) => {
      console.error('❌ Error al actualizar plato:', error);
      this.cargando = false;
      Swal.fire({
        title: 'Error',
        text: 'Error al actualizar el plato',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#e74c3c'
      });
    }
  });
}

  onModalCerrado(): void {
    console.log('Modal cerrado');
    // Lógica adicional si es necesaria
  }

  abrirReportes(): void {
    const modalRef = this.modalService.open(ReportesModalComponent, {
      size: 'xl',
      backdrop: 'static',
      centered: true
    });
    modalRef.componentInstance.show('platos');
    
    // Manejar el cierre del modal
    modalRef.result.then(() => {
      console.log('Modal de reportes cerrado');
    }).catch(() => {
      console.log('Modal de reportes cancelado');
    });
  }

}