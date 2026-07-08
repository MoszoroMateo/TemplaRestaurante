import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ProductoDTO, PostProductoDTO, FiltroProducto, ProductoStats } from '../models/producto.model';
import { Page } from '../../../core/models/page.model';

@Injectable({ providedIn: 'root' })
export class ProductoService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/producto`;

  // ── State ──
  private readonly productosState = signal<Page<ProductoDTO> | null>(null);
  private readonly loadingState = signal(false);
  private readonly filtrosState = signal<FiltroProducto>({ page: 0, size: 10 });
  private readonly statsState = signal<ProductoStats>({
    total: 0, activos: 0, inactivos: 0,
    insumos: 0, acompanantes: 0, bebidas: 0,
    stockCritico: 0, stockBajo: 0, stockSaludable: 0,
    valorInventario: 0,
  });

  // ── Public slices ──
  readonly productos = computed(() => this.productosState()?.content ?? []);
  readonly totalElements = computed(() => this.productosState()?.totalElements ?? 0);
  readonly totalPages = computed(() => this.productosState()?.totalPages ?? 0);
  readonly currentPage = computed(() => this.filtrosState().page);
  readonly pageSize = computed(() => this.filtrosState().size);
  readonly isLoading = computed(() => this.loadingState());
  readonly stats = computed(() => this.statsState());

  // ── Internal: build HttpParams from FiltroProducto ──
  private buildParams(f: FiltroProducto): HttpParams {
    let params = new HttpParams()
      .set('page', f.page)
      .set('size', f.size);

    if (f.busqueda?.trim()) {
      params = params.set('buscar', f.busqueda.trim());
    }
    if (f.tipo) {
      params = params.set('tipoProducto', f.tipo);
    }
    // Always send activo (TODOS when no filter)
    params = params.set('activo', f.activo || 'TODOS');
    return params;
  }

  // ── Centralised server load (always hits /filtrar which handles all params) ──
  private executeLoad(): void {
    const f = this.filtrosState();
    const params = this.buildParams(f);

    this.loadingState.set(true);
    this.http.get<Page<ProductoDTO>>(`${this.API_URL}/filtrar`, { params })
      .pipe(tap({ finalize: () => this.loadingState.set(false) }))
      .subscribe({
        next: (page) => {
          this.productosState.set(page);
          // Sync current page from server response
          this.filtrosState.set({ ...this.filtrosState(), page: page.number });
        },
      });
  }

  // ── Load global KPIs (called once on init) ──
  loadStats(): void {
    this.http.get<ProductoStats>(`${this.API_URL}/stats`).subscribe({
      next: (s) => this.statsState.set(s),
      error: (err) => console.error('[ProductoService] loadStats failed:', err),
    });
  }

  // ── Initial load ──
  loadProductos(): void {
    this.filtrosState.set({ page: 0, size: 10 });
    this.executeLoad();
  }

  // ── Filter (server-side — HTTP call) ──
  filtrar(filtros: Partial<FiltroProducto>): void {
    const merged = { ...this.filtrosState(), ...filtros };
    // Reset to page 0 when filters change (unless page explicitly provided)
    if (filtros.busqueda !== undefined || filtros.tipo !== undefined || filtros.activo !== undefined) {
      merged.page = 0;
    }
    this.filtrosState.set(merged);
    this.executeLoad();
  }

  /** Navigate to a specific page */
  irAPagina(pagina: number): void {
    this.filtrosState.set({ ...this.filtrosState(), page: pagina });
    this.executeLoad();
  }

  // ── CRUD (return Observable for chaining / toasts) ──

  crear(dto: PostProductoDTO): Observable<ProductoDTO> {
    this.loadingState.set(true);
    return this.http.post<ProductoDTO>(`${this.API_URL}/crear`, dto)
      .pipe(tap({ finalize: () => this.loadingState.set(false) }));
  }

  actualizar(id: number, dto: PostProductoDTO): Observable<ProductoDTO> {
    this.loadingState.set(true);
    return this.http.put<ProductoDTO>(`${this.API_URL}/editar/${id}`, dto)
      .pipe(tap({ finalize: () => this.loadingState.set(false) }));
  }

  eliminar(id: number): Observable<void> {
    this.loadingState.set(true);
    return this.http.delete<void>(`${this.API_URL}/eliminar/${id}`)
      .pipe(tap({ finalize: () => this.loadingState.set(false) }));
  }

  // ── Pure helpers (extracted for testability) ──

  /** Convert UnidadMedida to short display form */
  getUnidadMedidaCorta(unidad: string): string {
    switch (unidad) {
      case 'KILOGRAMO': return 'kg';
      case 'LITRO': return 'lt';
      case 'GRAMO': return 'g';
      case 'UNIDAD': return 'u';
      default: return unidad;
    }
  }

  /** Return Tailwind color class based on stock level */
  getStockClass(stock: number, stockMinimo: number): string {
    if (stock <= stockMinimo / 2) return 'text-red-600';
    if (stock <= stockMinimo) return 'text-amber-500';
    return 'text-green-600';
  }
}
