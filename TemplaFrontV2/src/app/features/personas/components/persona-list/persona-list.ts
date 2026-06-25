import { Component, computed, inject, model, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PersonaService } from '../../services/persona.service';
import { AuthService } from '../../../../core/services/auth-service';
import { Persona, TipoPersona } from '../../models/persona.model';
import { PersonaModalComponent } from '../persona-modal/persona-modal';
import { DataTableComponent, ColumnDef, BadgeEntry } from '../../../../shared/components/data-table/data-table';
import { FilterGroupComponent } from '../../../../shared/components/filter-group/filter-group';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-persona-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PersonaModalComponent, DataTableComponent, FilterGroupComponent],
  templateUrl: './persona-list.html',
})
export class PersonaListComponent implements OnInit {
  private personaService = inject(PersonaService);
  private authService = inject(AuthService);

  // ── Service signals exposed ──
  protected readonly personas = this.personaService.personas;
  protected readonly pageInfo = this.personaService.pageInfo;
  protected readonly isLoading = this.personaService.isLoading;

  // ── Search (NgModel allowed for search boxes per skill rules) ──
  protected busqueda = '';

  // ── Filters (model for two-way binding with FilterGroupComponent) ──
  protected tipoSeleccionado = model<TipoPersona | ''>(TipoPersona.PERSONAL);
  protected estadoSeleccionado = model<'ACTIVOS' | 'BAJA' | 'TODOS'>('ACTIVOS');

  // ── Modal state ──
  protected modalOpen = signal(false);
  protected editPersona = signal<Persona | undefined>(undefined);

  // ── Data-table column definitions ──
  protected readonly columns: ColumnDef[] = [
    { key: '_index', label: '#', type: 'index', class: 'w-12 text-center' },
    { key: 'nombre', label: 'Name' },
    { key: 'dni', label: 'Document', class: 'font-nav text-xs text-muted' },
    { key: 'email', label: 'Email', class: 'text-muted' },
    { key: 'telefono', label: 'Phone', class: 'text-muted' },
    { key: 'tipoPersona', label: 'Type', type: 'badge' },
    { key: 'fechaBaja', label: 'Status', type: 'badge' },
    { key: '_actions', label: 'Actions', type: 'actions', class: 'text-center' },
  ];

  // ── Badge maps for type and status columns ──
  protected readonly badgeMaps: Record<string, Record<string, BadgeEntry>> = {
    tipoPersona: {
      PERSONAL: { label: 'Staff', class: 'bg-primary text-white' },
      CLIENTE: { label: 'Client', class: 'bg-info text-white' },
    },
    fechaBaja: {
      ACTIVE: { label: 'Active', class: 'bg-accent text-white' },
      INACTIVE: { label: 'Inactive', class: 'bg-error text-white' },
    },
  };

  /** Resolve display values for conditional badges (e.g. status from fechaBaja) */
  protected readonly customValues: Record<string, (row: Persona) => string> = {
    fechaBaja: (row) => row.fechaBaja ? 'INACTIVE' : 'ACTIVE',
  };

  // ── Stats cards — computed from current data ──
  protected readonly stats = computed(() => {
    const all = this.personas();
    const staff = all.filter(p => p.tipoPersona === TipoPersona.PERSONAL);
    const clients = all.filter(p => p.tipoPersona === TipoPersona.CLIENTE);
    const inactive = all.filter(p => p.fechaBaja);
    return {
      total: all.length,
      staffActive: staff.filter(p => !p.fechaBaja).length,
      clientsActive: clients.filter(p => !p.fechaBaja).length,
      inactive: inactive.length,
    };
  });

  // ── Cell prefixes (initials avatar) ──
  protected readonly cellPrefixes: Record<string, (row: Persona) => string> = {
    nombre: (row) => this.getInitials(row.nombre, row.apellido),
  };

  // ── Cell renderers (override default text) ──
  protected readonly cellRenderers: Record<string, (row: Persona) => string> = {
    nombre: (row) => `${row.nombre} ${row.apellido}`,
  };

  /** Extract first letter of name and surname */
  private getInitials(nombre: string, apellido: string): string {
    const first = nombre?.charAt(0) ?? '';
    const last = apellido?.charAt(0) ?? '';
    return (first + last).toUpperCase();
  }

  // ── Filter options ──
  protected tipoFilterOptions = [
    { value: TipoPersona.PERSONAL, label: 'Staff' },
    { value: '', label: 'All' },
    { value: TipoPersona.CLIENTE, label: 'Clients' },
  ];

  protected estadoFilterOptions = [
    { value: 'ACTIVOS', label: 'Active' },
    { value: 'TODOS', label: 'All' },
    { value: 'BAJA', label: 'Inactive' },
  ];

  ngOnInit(): void {
    this.personaService.loadPersonas();
  }

  // ── Search handler ──
  onBusquedaChange(): void {
    this.aplicarFiltros();
  }

  // ── Filter change ──
  onFilterChange(): void {
    this.aplicarFiltros();
  }

  private aplicarFiltros(): void {
    const activo = this.estadoSeleccionado() === 'ACTIVOS' ? true
      : this.estadoSeleccionado() === 'BAJA' ? false
      : undefined;

    this.personaService.filtrar({
      busqueda: this.busqueda,
      tipo: this.tipoSeleccionado() || undefined,
      activo,
      page: 0,
      size: 10,
    });
  }

  // ── Pagination ──
  irAPagina(pagina: number): void {
    this.personaService.irAPagina(pagina);
  }

  // ── Modal ──
  openNewPersonModal(persona?: Persona): void {
    this.editPersona.set(persona);
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.editPersona.set(undefined);
  }

  onModalSave(persona: Persona): void {
    this.modalOpen.set(false);

    if (this.editPersona()) {
      this.personaService.actualizar(persona).subscribe({
        next: () => {
          this.personaService.filtrar({ page: this.pageInfo()?.number ?? 0 });
          Swal.fire({ icon: 'success', title: 'Updated', text: 'Person updated successfully', timer: 1500, showConfirmButton: false });
        },
        error: () => {
          Swal.fire({ icon: 'error', title: 'Error', text: 'Could not update person' });
        },
      });
    } else {
      const userAlta = this.authService.getUserId();
      this.personaService.crear({
        nombre: persona.nombre,
        apellido: persona.apellido,
        email: persona.email,
        telefono: persona.telefono,
        dni: persona.dni,
        tipoPersona: persona.tipoPersona,
        userAlta,
      }).subscribe({
        next: () => {
          this.personaService.loadPersonas();
          Swal.fire({ icon: 'success', title: 'Created', text: 'Person created successfully', timer: 1500, showConfirmButton: false });
        },
        error: () => {
          Swal.fire({ icon: 'error', title: 'Error', text: 'Could not create person' });
        },
      });
    }

    this.editPersona.set(undefined);
  }

  confirmDelete(persona: Persona): void {
    Swal.fire({
      title: 'Are you sure?',
      text: `Delete ${persona.nombre} ${persona.apellido}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#D93838',
      cancelButtonColor: '#828C85',
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    }).then(result => {
      if (result.isConfirmed && persona.id) {
        this.personaService.eliminar(persona.id).subscribe({
          next: () => {
            this.personaService.filtrar({ page: 0 });
            Swal.fire({ icon: 'success', title: 'Deleted', text: 'Person deleted', timer: 1500, showConfirmButton: false });
          },
          error: () => {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Could not delete person' });
          },
        });
      }
    });
  }
}
