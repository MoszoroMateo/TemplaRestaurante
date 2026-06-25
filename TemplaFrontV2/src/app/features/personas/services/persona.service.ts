import { inject, Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Persona, PostPersonaDto, FiltroPersona, Page } from '../models/persona.model';

@Injectable({ providedIn: 'root' })
export class PersonaService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/persona`;

  // ── State ──
  private readonly personasState = signal<Persona[]>([]);
  private readonly pageInfoState = signal<Page<Persona> | null>(null);
  private readonly loadingState = signal(false);
  private readonly filtrosState = signal<FiltroPersona>({ page: 0, size: 10 });

  // ── Public slices ──
  readonly personas = computed(() => this.personasState());
  readonly pageInfo = computed(() => this.pageInfoState());
  readonly isLoading = computed(() => this.loadingState());

  // ── Load (initial) ──
  loadPersonas(): void {
    this.loadingState.set(true);
    const params = new HttpParams()
      .set('page', '0')
      .set('size', '10');

    this.http.get<Page<Persona>>(`${this.API_URL}/personas`, { params })
      .pipe(tap({ finalize: () => this.loadingState.set(false) }))
      .subscribe({
        next: (page) => {
          this.personasState.set(page.content);
          this.pageInfoState.set(page);
          this.filtrosState.set({ page: page.number, size: page.size });
        },
      });
  }

  // ── Filter ──
  filtrar(filtros: Partial<FiltroPersona>): void {
    const merged = { ...this.filtrosState(), ...filtros };
    this.filtrosState.set(merged);

    this.loadingState.set(true);

    let params = new HttpParams()
      .set('page', merged.page.toString())
      .set('size', merged.size.toString());

    if (merged.busqueda?.trim()) {
      params = params.set('buscarFiltro', merged.busqueda.trim());
    }
    if (merged.tipo) {
      params = params.set('tipoPersona', merged.tipo);
    }
    // Map active filter to estado
    if (merged.activo === true) {
      params = params.set('estado', 'ACTIVOS');
    } else if (merged.activo === false) {
      params = params.set('estado', 'BAJA');
    }

    this.http.get<Page<Persona>>(`${this.API_URL}/personas/filtrar`, { params })
      .pipe(tap({ finalize: () => this.loadingState.set(false) }))
      .subscribe({
        next: (page) => {
          this.personasState.set(page.content);
          this.pageInfoState.set(page);
        },
      });
  }

  /** Navigate to a specific page keeping current filters */
  irAPagina(pagina: number): void {
    this.filtrar({ page: pagina });
  }

  // ── CRUD (return Observable for chaining / toasts) ──

  crear(dto: PostPersonaDto): Observable<Persona> {
    this.loadingState.set(true);
    return this.http.post<Persona>(`${this.API_URL}/crear`, dto)
      .pipe(tap({ finalize: () => this.loadingState.set(false) }));
  }

  actualizar(persona: Persona): Observable<Persona> {
    this.loadingState.set(true);
    return this.http.put<Persona>(`${this.API_URL}/actualizar`, persona)
      .pipe(tap({ finalize: () => this.loadingState.set(false) }));
  }

  eliminar(id: number): Observable<void> {
    this.loadingState.set(true);
    return this.http.delete<void>(`${this.API_URL}/baja/${id}`)
      .pipe(tap({ finalize: () => this.loadingState.set(false) }));
  }
}
