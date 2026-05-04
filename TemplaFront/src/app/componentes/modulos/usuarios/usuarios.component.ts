// usuarios.component.ts - VERSIÓN CORREGIDA
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UsuarioModalComponent } from '../../modales/usuario-modal/usuario-modal.component';
import { UserService } from '../../../services/user.service';
import { PersonaService } from '../../../services/persona.service';
import { UsuarioDTO, UsuarioCreateDTO, UsuarioUpdateDTO, RolUsuario } from '../../models/UsuarioModel';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.css'
})
export class UsuariosComponent implements OnInit {
  
  // ✅ Datos
  usuarios: UsuarioDTO[] = [];
  usuariosFiltrados: UsuarioDTO[] = [];
  personas: any[] = []; // Lista de personas para el dropdown
  
  // ✅ Filtros
  busqueda: string = '';
  rolSeleccionado: string = '';
  activoSeleccionado: boolean = true;
  
  // ✅ Paginación
  paginaActual: number = 1;
  itemsPorPagina: number = 10;
  totalItems: number = 0;

  // ✅ Loading
  cargando: boolean = false;
  error: string = '';

  RolUsuario = RolUsuario;

  constructor(
    private modalService: NgbModal,
    private userService: UserService,
    private personaService: PersonaService
  ) {}

  ngOnInit() {
    this.cargarUsuarios();
    this.cargarPersonas();
  }

  // ✅ Carga inicial
  cargarUsuarios(): void {
    this.cargando = true;
    this.error = '';

    this.userService.listarUsuarios().subscribe({
      next: (usuarios: UsuarioDTO[]) => {
        console.log('Usuarios recibidos:', usuarios);
        this.usuarios = usuarios || [];
        this.totalItems = this.usuarios.length;
        this.aplicarFiltros();
        this.cargando = false;
      },
      error: (error) => {
        this.error = 'Error al cargar los usuarios';
        this.cargando = false;
        console.error('Error:', error);
      }
    });
  }

  // ✅ Cargar lista de personas PERSONAL sin usuario para el dropdown
  cargarPersonas(): void {
    this.personaService.obtenerPersonalSinUsuario(0, 1000).subscribe({
      next: (response) => {
        this.personas = response.content || [];
        console.log('✅ Personas sin usuario cargadas:', this.personas.length);
      },
      error: (error) => {
        console.error('❌ Error al cargar personas sin usuario:', error);
        this.personas = [];
      }
    });
  }

  // ✅ Aplicar filtros en el frontend
  aplicarFiltros(): void {
    let usuariosFiltrados = [...this.usuarios];

    // Filtro por texto
    if (this.busqueda.trim()) {
      const filtroLower = this.busqueda.toLowerCase();
      usuariosFiltrados = usuariosFiltrados.filter(usuario =>
        usuario.username.toLowerCase().includes(filtroLower) ||
        usuario.rolUsuario.toLowerCase().includes(filtroLower)
      );
    }

    // Filtro por rol
    if (this.rolSeleccionado && this.rolSeleccionado !== '') {
      usuariosFiltrados = usuariosFiltrados.filter(usuario =>
        usuario.rolUsuario === this.rolSeleccionado
      );
    }

    // Filtro por estado
    usuariosFiltrados = usuariosFiltrados.filter(usuario =>
      usuario.activo === this.activoSeleccionado
    );

    this.usuariosFiltrados = usuariosFiltrados;
    this.totalItems = usuariosFiltrados.length;
    this.paginaActual = 1;
  }

  // ✅ Métodos de filtros
  onBusquedaChange() {
    this.aplicarFiltros();
  }

  onRolChange(rol: string) {
    this.rolSeleccionado = rol;
    this.aplicarFiltros();
  }

  onEstadoChange(estado: string) {
    if (estado === 'TODOS') {
      this.activoSeleccionado = true;
      this.cargarUsuarios();
    } else {
      this.activoSeleccionado = estado === 'ACTIVOS';
      this.aplicarFiltros();
    }
  }

  onActivoChange(activo: boolean) {
    this.activoSeleccionado = activo;
    this.aplicarFiltros();
  }

  // ✅ Paginación en frontend
  get usuariosPaginados(): UsuarioDTO[] {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    return this.usuariosFiltrados.slice(inicio, fin);
  }

  get totalPaginas(): number {
    return Math.ceil(this.totalItems / this.itemsPorPagina);
  }

  get paginas(): number[] {
    const total = this.totalPaginas;
    const actual = this.paginaActual;
    const paginas: number[] = [];
    
    let inicio = Math.max(1, actual - 2);
    let fin = Math.min(total, inicio + 4);
    
    if (fin - inicio < 4) {
      inicio = Math.max(1, fin - 4);
    }
    
    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }
    
    return paginas;
  }

  irAPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  // ✅ Método para calcular el rango mostrado (reemplaza el uso de Math en el template)
  get rangoMostrado(): string {
    const inicio = ((this.paginaActual - 1) * this.itemsPorPagina) + 1;
    const fin = Math.min(this.paginaActual * this.itemsPorPagina, this.totalItems);
    return `Mostrando ${inicio}-${fin} de ${this.totalItems} registros`;
  }

  // ✅ Modal para crear/editar
  openNewUserModal(usuario?: UsuarioDTO) {
    const modalRef = this.modalService.open(UsuarioModalComponent, {
      size: 'lg',
      backdrop: 'static'
    });

    // ✅ Pasar la lista de personas al modal
    modalRef.componentInstance.personas = this.personas;

    if (usuario) {
      modalRef.componentInstance.isEditMode = true;
      modalRef.componentInstance.usuarioData = { ...usuario };
    } else {
      modalRef.componentInstance.isEditMode = false;
    }

    modalRef.result.then((result: any) => {
      console.log('Usuario guardado:', result);
      
      if (usuario && usuario.id) {
        this.actualizarUsuario(usuario.id, result);
      } else {
        this.crearUsuario(result);
      }
    }).catch((error) => {
      console.log('Modal cerrado sin guardar');
    });
  }

  // ✅ Crear usuario
  crearUsuario(usuarioData: any) {
    this.cargando = true;
    
    const usuarioDto: UsuarioCreateDTO = {
      username: usuarioData.username,
      password: usuarioData.password,
      rolUsuario: usuarioData.rolUsuario as RolUsuario
    };
    
    // Solo agregar personaDni si tiene un valor válido
    if (usuarioData.personaDni && usuarioData.personaDni !== '') {
      usuarioDto.personaDni = Number(usuarioData.personaDni);
    }
    
    this.userService.crearUsuario(usuarioDto).subscribe({
      next: (usuarioCreado) => {
        console.log('✅ Usuario creado exitosamente:', usuarioCreado);
        this.cargarUsuarios();
        this.cargarPersonas(); // ✅ Recargar lista de personas sin usuario
        Swal.fire({
          title: '¡Éxito!',
          text: 'Usuario creado exitosamente',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#84C473'
        });
      },
      error: (error) => {
        console.error('❌ Error al crear usuario:', error);
        this.cargando = false;
        Swal.fire({
          title: 'Error',
          text: 'Error al crear el usuario',
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#e74c3c'
        });
      }
    });
  }

  // ✅ Actualizar usuario
  actualizarUsuario(id: number, usuarioData: any) {
    this.cargando = true;
    
    // ✅ Usar UsuarioUpdateDTO que coincide con el backend
    const usuarioUpdateDto: UsuarioUpdateDTO = {
      username: usuarioData.username,
      password: usuarioData.password || undefined, // Solo se incluye si hay valor
      rolUsuario: usuarioData.rolUsuario as RolUsuario,
      activo: usuarioData.activo,
      //personaDni: usuarioData.personaDni
    };
    
    this.userService.actualizarUsuario(id, usuarioUpdateDto).subscribe({
      next: (usuarioActualizado) => {
        console.log('✅ Usuario actualizado exitosamente:', usuarioActualizado);
        this.cargarUsuarios();
        Swal.fire({
          title: '¡Éxito!',
          text: 'Usuario actualizado exitosamente',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#84C473'
        });
      },
      error: (error) => {
        console.error('❌ Error al actualizar usuario:', error);
        this.cargando = false;
        Swal.fire({
          title: 'Error',
          text: 'Error al actualizar el usuario',
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#e74c3c'
        });
      }
    });
  }

  // ✅ Eliminar usuario
  eliminarUsuario(usuario: UsuarioDTO) {
    Swal.fire({
      title: '¿Está seguro?',
      text: `¿Desea eliminar al usuario ${usuario.username}?`,
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
        
        if (usuario.id) {
          this.userService.eliminarUsuario(usuario.id).subscribe({
            next: () => {
              console.log('✅ Usuario eliminado exitosamente');
              this.cargarUsuarios();
              Swal.fire({
                title: '¡Eliminado!',
                text: 'Usuario eliminado exitosamente',
                icon: 'success',
                confirmButtonText: 'OK',
                confirmButtonColor: '#84C473'
              });
            },
            error: (error) => {
              console.error('❌ Error al eliminar usuario:', error);
              this.cargando = false;
              Swal.fire({
                title: 'Error',
                text: 'Error al eliminar el usuario',
                icon: 'error',
                confirmButtonText: 'OK',
                confirmButtonColor: '#e74c3c'
              });
            }
          });
        } else {
          console.error('❌ No se puede eliminar: usuario sin ID');
          this.cargando = false;
          Swal.fire({
            title: 'Error',
            text: 'Error: usuario sin ID',
            icon: 'error',
            confirmButtonText: 'OK',
            confirmButtonColor: '#e74c3c'
          });
        }
      }
    });
  }

  // ✅ Clases para badges
  getBadgeClassRol(rol: string): string {
    switch (rol) {
      case 'ADMINISTRADOR': return 'badge badge-administrador'; 
      case 'MOZO': return 'badge badge-mozo'; 
      case 'COCINA': return 'badge badge-cocina'; 
      case 'ENCARGADO': return 'badge badge-encargado';
      default: return 'badge badge-baja';
    }
  }

  getBadgeClassEstado(activo: boolean): string {
    return activo ? 'badge badge-activo' : 'badge badge-baja';
  }
}