import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { UsuarioDTO, UsuarioCreateDTO, UsuarioUpdateDTO, FiltroUsuario, RolUsuario } from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/usuario`;

  // ── State ──
  private readonly usuariosState = signal<UsuarioDTO[]>([]);
  private readonly loadingState = signal(false);
  private readonly filtrosState = signal<FiltroUsuario>({ page: 0, size: 10 });

  // ── Public slices ──
  readonly usuarios = computed(() => this.usuariosState());
  readonly isLoading = computed(() => this.loadingState());

  /** Client-side filtered + paginated users */
  readonly filteredUsers = computed(() => {
    const data = this.usuariosState();
    const f = this.filtrosState();

    let filtered = data;

    // Apply search filter (case-insensitive, match username/personaNombre)
    if (f.busqueda?.trim()) {
      const q = f.busqueda.trim().toLowerCase();
      filtered = filtered.filter(u =>
        u.username.toLowerCase().includes(q) ||
        (u.personaNombre ?? '').toLowerCase().includes(q)
      );
    }

    // Apply rol filter
    if (f.rol) {
      filtered = filtered.filter(u => u.rolUsuario === f.rol);
    }

    // Apply active status filter
    if (f.activo !== undefined) {
      filtered = filtered.filter(u => u.activo === f.activo);
    }

    // Client-side pagination
    const start = f.page * f.size;
    const end = start + f.size;
    return filtered.slice(start, end);
  });

  /** Total matching elements (before pagination) */
  readonly totalElements = computed(() => {
    const data = this.usuariosState();
    const f = this.filtrosState();
    let filtered = data;

    if (f.busqueda?.trim()) {
      const q = f.busqueda.trim().toLowerCase();
      filtered = filtered.filter(u =>
        u.username.toLowerCase().includes(q) ||
        (u.personaNombre ?? '').toLowerCase().includes(q)
      );
    }
    if (f.rol) {
      filtered = filtered.filter(u => u.rolUsuario === f.rol);
    }
    if (f.activo !== undefined) {
      filtered = filtered.filter(u => u.activo === f.activo);
    }
    return filtered.length;
  });

  /** Total pages based on filtered count */
  readonly totalPages = computed(() => {
    const count = this.totalElements();
    const size = this.filtrosState().size;
    return Math.ceil(count / size) || 1;
  });

  /** Current page number */
  readonly currentPage = computed(() => this.filtrosState().page);

  /** Page size */
  readonly pageSize = computed(() => this.filtrosState().size);

  // ── Load (initial) ──
  loadUsuarios(): void {
    this.loadingState.set(true);
    this.http.get<UsuarioDTO[]>(`${this.API_URL}/listar`)
      .pipe(tap({ finalize: () => this.loadingState.set(false) }))
      .subscribe({
        next: (list) => {
          this.usuariosState.set(list);
          this.filtrosState.set({ page: 0, size: 10 });
        },
      });
  }

  // ── Filter (client-side — no HTTP) ──
  filtrar(filtros: Partial<FiltroUsuario>): void {
    const merged = { ...this.filtrosState(), ...filtros };
    // Reset to page 0 on filter change (unless page is explicitly provided)
    if (filtros.busqueda !== undefined || filtros.rol !== undefined || filtros.activo !== undefined) {
      merged.page = 0;
    }
    this.filtrosState.set(merged);
  }

  /** Navigate to a specific page */
  irAPagina(pagina: number): void {
    this.filtrar({ page: pagina });
  }

  // ── CRUD (return Observable for chaining / toasts) ──

  crear(dto: UsuarioCreateDTO): Observable<UsuarioDTO> {
    this.loadingState.set(true);
    return this.http.post<UsuarioDTO>(`${this.API_URL}/crear`, dto)
      .pipe(tap({ finalize: () => this.loadingState.set(false) }));
  }

  actualizar(id: number, dto: UsuarioUpdateDTO): Observable<UsuarioDTO> {
    this.loadingState.set(true);
    return this.http.put<UsuarioDTO>(`${this.API_URL}/editar/${id}`, dto)
      .pipe(tap({ finalize: () => this.loadingState.set(false) }));
  }

  eliminar(id: number): Observable<void> {
    this.loadingState.set(true);
    return this.http.delete<void>(`${this.API_URL}/eliminar/${id}`)
      .pipe(tap({ finalize: () => this.loadingState.set(false) }));
  }

  /** Quick toggle active status — sends PUT with toggled activo */
  toggleActivo(id: number): Observable<UsuarioDTO> {
    const user = this.usuariosState().find(u => u.id === id);
    if (!user) {
      throw new Error(`User with id ${id} not found in state`);
    }
    const dto: UsuarioUpdateDTO = {
      username: user.username,
      rolUsuario: user.rolUsuario,
      activo: !user.activo,
    };
    return this.actualizar(id, dto);
  }
}
