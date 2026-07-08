import { Component, computed, inject, model, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { UsuarioDTO, UsuarioCreateDTO, UsuarioUpdateDTO, RolUsuario } from '../../models/usuario.model';
import { PersonaService } from '../../../personas/services/persona.service';
import { UsuarioModalComponent } from '../usuario-modal/usuario-modal';
import { DataTableComponent, ColumnDef, BadgeEntry } from '../../../../shared/components/data-table/data-table';
import { FilterGroupComponent, FilterOption } from '../../../../shared/components/filter-group/filter-group';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-usuario-list',
  standalone: true,
  imports: [CommonModule, FormsModule, UsuarioModalComponent, DataTableComponent, FilterGroupComponent],
  templateUrl: './usuario-list.html',
})
export class UsuarioListComponent implements OnInit {
  private userService = inject(UserService);
  private personaService = inject(PersonaService);

  // ── Service signals exposed ──
  protected readonly usuarios = this.userService.filteredUsers;
  protected readonly totalElements = this.userService.totalElements;
  protected readonly totalPages = this.userService.totalPages;
  protected readonly currentPage = this.userService.currentPage;
  protected readonly pageSize = this.userService.pageSize;
  protected readonly isLoading = this.userService.isLoading;

  // ── Search (instant, like Personas) ──
  protected busqueda = '';

  // ── Filters (model for two-way binding with FilterGroupComponent) ──
  protected tipoSeleccionado = model<RolUsuario | ''>('');
  protected estadoSeleccionado = model<'activos' | 'baja' | 'todos'>('activos');

  // ── Modal state ──
  protected modalOpen = signal(false);
  protected editUser = signal<UsuarioDTO | undefined>(undefined);
  protected saving = signal(false);
  protected apiError = signal<string | null>(null);

  // ── Personas for modal dropdown (loaded lazy on modal open) ──
  protected personasSinUsuario = signal<{ dni: number; nombre: string }[]>([]);

  // ── Data-table column definitions ──
  protected readonly columns: ColumnDef[] = [
    { key: '_index', label: '#', type: 'index', class: 'w-12 text-center' },
    { key: 'username', label: 'User' },
    { key: 'personaNombre', label: 'Person' },
    { key: 'rolUsuario', label: 'Role', type: 'badge' },
    { key: 'activo', label: 'Status', type: 'badge' },
    { key: '_actions', label: 'Actions', type: 'actions', class: 'text-center' },
  ];

  // ── Badge maps ──
  protected readonly badgeMaps: Record<string, Record<string, BadgeEntry>> = {
    rolUsuario: {
      ADMINISTRADOR: { label: 'Admin', class: 'bg-primary text-white' },
      MOZO: { label: 'Waiter', class: 'bg-info text-white' },
      COCINA: { label: 'Kitchen', class: 'bg-signal text-white' },
      ENCARGADO: { label: 'Manager', class: 'bg-warning text-white' },
    },
    activo: {
      activo_true: { label: 'Active', class: 'bg-accent text-white' },
      activo_false: { label: 'Inactive', class: 'bg-error text-white' },
    },
  };

  /** Resolve display values for conditional badges */
  protected readonly customValues: Record<string, (row: UsuarioDTO) => string> = {
    activo: (row) => row.activo ? 'activo_true' : 'activo_false',
  };

  // ── Cell prefixes (avatar initials for username) ──
  protected readonly cellPrefixes: Record<string, (row: UsuarioDTO) => string> = {
    username: (row) => this.getInitials(row),
  };

  // ── Cell renderers — personaNombre column shows name or "—" ──
  protected readonly cellRenderers: Record<string, (row: UsuarioDTO) => string> = {
    personaNombre: (row) => row.personaNombre ?? '—',
  };

  // ── Stats bar — computed from current data ──
  protected readonly stats = computed(() => {
    const all = this.usuarios();
    return {
      total: all.length,
      administradores: all.filter(u => u.rolUsuario === RolUsuario.ADMINISTRADOR).length,
      mozo: all.filter(u => u.rolUsuario === RolUsuario.MOZO).length,
      cocina: all.filter(u => u.rolUsuario === RolUsuario.COCINA).length,
      encargado: all.filter(u => u.rolUsuario === RolUsuario.ENCARGADO).length,
      activos: all.filter(u => u.activo).length,
      inactivos: all.filter(u => !u.activo).length,
    };
  });

  // ── Filter options ──
  protected readonly rolFilterOptions: FilterOption[] = [
    { value: '', label: 'All' },
    { value: RolUsuario.ADMINISTRADOR, label: 'Admin' },
    { value: RolUsuario.MOZO, label: 'Waiter' },
    { value: RolUsuario.COCINA, label: 'Kitchen' },
    { value: RolUsuario.ENCARGADO, label: 'Manager' },
  ];

  protected readonly estadoFilterOptions: FilterOption[] = [
    { value: 'activos', label: 'Active' },
    { value: 'todos', label: 'All' },
    { value: 'baja', label: 'Inactive' },
  ];

  ngOnInit(): void {
    this.userService.loadUsuarios();
  }

  /** Extract initial letter from username or personaNombre */
  getInitials(row: UsuarioDTO): string {
    return (row.personaNombre ?? row.username).charAt(0).toUpperCase();
  }

  // ── Search handler (instant, like Personas) ──
  onBusquedaChange(): void {
    this.userService.filtrar({ busqueda: this.busqueda });
  }

  // ── Filter changes ──
  onTipoFilterChange(rol: string): void {
    this.userService.filtrar({ rol: rol as RolUsuario || undefined });
  }

  onEstadoFilterChange(estado: string): void {
    const activo = estado === 'activos' ? true
      : estado === 'baja' ? false
      : undefined;
    this.userService.filtrar({ activo });
  }

  // ── Pagination ──
  irAPagina(pagina: number): void {
    this.userService.irAPagina(pagina);
  }

  // ── Modal ──
  openNewUserModal(): void {
    this.editUser.set(undefined);
    this.loadPersonasForModal();
    this.modalOpen.set(true);
  }

  openEditUserModal(user: UsuarioDTO): void {
    this.editUser.set(user);
    this.loadPersonasForModal();
    this.modalOpen.set(true);
  }

  /** Load personas without user for modal dropdown (lazy — only when modal opens) */
  private loadPersonasForModal(): void {
    this.personaService.obtenerPersonasSinUsuario().subscribe({
      next: (personas) => {
        this.personasSinUsuario.set(
          personas.map(p => ({ dni: p.dni, nombre: `${p.nombre} ${p.apellido}` }))
        );
      },
      error: () => {
        this.personasSinUsuario.set([]);
      },
    });
  }

  closeModal(): void {
    if (this.saving()) return;
    this.modalOpen.set(false);
    this.editUser.set(undefined);
    this.apiError.set(null);
  }

  onModalSave(user: UsuarioCreateDTO | UsuarioUpdateDTO): void {
    this.saving.set(true);
    this.apiError.set(null);
    const editId = this.editUser()?.id;

    const handleError = (err: any) => {
      this.saving.set(false);
      const msg = err?.error?.mensaje || err?.error?.message || err?.statusText || 'An unexpected error occurred. Please try again.';
      this.apiError.set(msg);
    };

    if (editId) {
      this.userService.actualizar(editId, user as UsuarioUpdateDTO).subscribe({
        next: () => {
          this.saving.set(false);
          this.modalOpen.set(false);
          this.editUser.set(undefined);
          this.apiError.set(null);
          this.userService.loadUsuarios();
          Swal.fire({ icon: 'success', title: 'Updated', text: 'User updated successfully', timer: 1500, showConfirmButton: false });
        },
        error: handleError,
      });
    } else {
      this.userService.crear(user as any).subscribe({
        next: () => {
          this.saving.set(false);
          this.modalOpen.set(false);
          this.editUser.set(undefined);
          this.apiError.set(null);
          this.userService.loadUsuarios();
          Swal.fire({ icon: 'success', title: 'Created', text: 'User created successfully', timer: 1500, showConfirmButton: false });
        },
        error: handleError,
      });
    }
  }

  // ── Quick toggle ──
  confirmToggleActivo(user: UsuarioDTO): void {
    const action = user.activo ? 'deactivate' : 'activate';
    Swal.fire({
      title: `${action === 'activate' ? 'Activate' : 'Deactivate'} user?`,
      text: `${user.personaNombre ?? user.username} will be ${action === 'activate' ? 'activated' : 'deactivated'}.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2E5C40',
      cancelButtonColor: '#D93838',
      cancelButtonText: 'Cancel',
      confirmButtonText: `Yes, ${action}`,
      reverseButtons: true,
    }).then(result => {
      if (result.isConfirmed) {
        this.userService.toggleActivo(user.id).subscribe({
          next: () => {
            this.userService.loadUsuarios();
            Swal.fire({ icon: 'success', title: `${action === 'activate' ? 'Activated' : 'Deactivated'}`, text: `User ${action}d successfully`, timer: 1500, showConfirmButton: false });
          },
          error: () => {
            Swal.fire({ icon: 'error', title: 'Error', text: `Could not ${action} user`, confirmButtonColor: '#D93838' });
          },
        });
      }
    });
  }

  // ── Delete ──
  confirmDelete(user: UsuarioDTO): void {
    Swal.fire({
      title: 'Delete user?',
      text: `This will permanently delete ${user.personaNombre ?? user.username}. This cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#D93838',
      cancelButtonColor: '#828C85',
      cancelButtonText: 'Cancel',
      confirmButtonText: 'Yes, delete',
      reverseButtons: true,
    }).then(result => {
      if (result.isConfirmed) {
        this.userService.eliminar(user.id).subscribe({
          next: () => {
            this.userService.loadUsuarios();
            Swal.fire({ icon: 'success', title: 'Deleted', text: 'User permanently deleted', timer: 1500, showConfirmButton: false });
          },
          error: () => {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Could not delete user', confirmButtonColor: '#D93838' });
          },
        });
      }
    });
  }
}
