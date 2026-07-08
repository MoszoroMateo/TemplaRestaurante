import { Component, computed, inject, model, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../services/producto.service';
import { ProductoDTO, PostProductoDTO, TipoProducto, ProductoStats } from '../../models/producto.model';
import { ProductoModalComponent } from '../producto-modal/producto-modal';
import { DataTableComponent, ColumnDef, BadgeEntry } from '../../../../shared/components/data-table/data-table';
import { FilterGroupComponent, FilterOption } from '../../../../shared/components/filter-group/filter-group';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-producto-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductoModalComponent, DataTableComponent, FilterGroupComponent],
  templateUrl: './producto-list.html',
})
export class ProductoListComponent implements OnInit {
  private productoService = inject(ProductoService);

  // ── Service signals exposed ──
  protected readonly productos = this.productoService.productos;
  protected readonly totalElements = this.productoService.totalElements;
  protected readonly totalPages = this.productoService.totalPages;
  protected readonly currentPage = this.productoService.currentPage;
  protected readonly pageSize = this.productoService.pageSize;
  protected readonly isLoading = this.productoService.isLoading;
  protected readonly stats = this.productoService.stats;

  // ── Stats computed helpers ──
  protected readonly formattedValorInventario = computed(() => {
    const v = this.stats().valorInventario;
    if (v === 0) return '$0.00';
    return `$${v.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  });

  // ── Search ──
  protected busqueda = '';

  // ── Filters (model for two-way binding with FilterGroupComponent) ──
  protected tipoSeleccionado = model<TipoProducto | ''>('');
  protected estadoSeleccionado = model<'activos' | 'inactivos' | 'todos'>('todos');

  // ── Modal state ──
  protected modalOpen = signal(false);
  protected editProducto = signal<ProductoDTO | undefined>(undefined);
  protected saving = signal(false);
  protected apiError = signal<string | null>(null);

  // ── Data-table column definitions ──
  protected readonly columns: ColumnDef[] = [
    { key: '_index', label: '#', type: 'index', class: 'w-12 text-center' },
    { key: 'nombre', label: 'Name' },
    { key: 'precio', label: 'Price', class: 'text-right' },
    { key: 'tipo', label: 'Type', type: 'badge' },
    { key: 'unidadMedida', label: 'Unit' },
    { key: 'stockActual', label: 'Cur Stock', class: 'text-center' },
    { key: 'stockMinimo', label: 'Min Stock', class: 'text-right' },
    { key: '_stockMax', label: 'Max Stock' },
    { key: 'estado', label: 'Status', type: 'badge' },
    { key: '_actions', label: 'Actions', type: 'actions', class: 'text-center' },
  ];

  // ── Badge maps ──
  protected readonly badgeMaps: Record<string, Record<string, BadgeEntry>> = {
    tipo: {
      INSUMO: { label: 'Supply', class: 'bg-blue-600 text-white' },
      ACOMPAÑANTE: { label: 'Side', class: 'bg-amber-500 text-white' },
      BEBIDA: { label: 'Beverage', class: 'bg-teal-600 text-white' },
    },
    estado: {
      activo_true: { label: 'Active', class: 'bg-accent text-white' },
      activo_false: { label: 'Inactive', class: 'bg-error text-white' },
    },
  };

  // ── Custom values for conditional badges ──
  protected readonly customValues: Record<string, (row: ProductoDTO) => string> = {
    estado: (row) => row.activo ? 'activo_true' : 'activo_false',
  };

  // ── Cell renderers ──
  protected readonly cellRenderers: Record<string, (row: ProductoDTO) => string> = {
    precio: (row) => `$${row.precio.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    unidadMedida: (row) => this.productoService.getUnidadMedidaCorta(row.unidadMedida),
    stockActual: (row) => row.stockActual.toLocaleString('es-AR'),
    stockMinimo: (row) => row.stockMinimo.toLocaleString('es-AR'),
    _stockMax: (row) => row.stockMaximo?.toLocaleString('es-AR') ?? '—',
  };

  // ── Stock cell renderer with color class ──
  protected readonly stockCellClass: (row: ProductoDTO) => string = (row) =>
    this.productoService.getStockClass(row.stockActual, row.stockMinimo);

  // ── Filter options ──
  protected readonly tipoFilterOptions: FilterOption[] = [
    { value: '', label: 'All' },
    { value: TipoProducto.INSUMO, label: 'Supply' },
    { value: TipoProducto.ACOMPAÑANTE, label: 'Side' },
    { value: TipoProducto.BEBIDA, label: 'Beverage' },
  ];

  protected readonly estadoFilterOptions: FilterOption[] = [
    { value: 'activos', label: 'Active' },
    { value: 'todos', label: 'All' },
    { value: 'inactivos', label: 'Inactive' },
  ];

  ngOnInit(): void {
    this.productoService.loadProductos();
    this.productoService.loadStats();
  }

  // ── Search handler ──
  onBusquedaChange(): void {
    this.productoService.filtrar({ busqueda: this.busqueda });
  }

  // ── Filter changes ──
  onTipoFilterChange(tipo: string): void {
    this.productoService.filtrar({ tipo: (tipo as TipoProducto) || undefined });
  }

  onEstadoFilterChange(estado: string): void {
    const activoMap: Record<string, string> = {
      activos: 'ACTIVOS',
      inactivos: 'INACTIVOS',
      todos: 'TODOS',
    };
    this.productoService.filtrar({ activo: activoMap[estado] });
  }

  // ── Pagination ──
  irAPagina(pagina: number): void {
    this.productoService.irAPagina(pagina);
  }

  // ── Modal ──
  openNewProductModal(): void {
    this.editProducto.set(undefined);
    this.modalOpen.set(true);
  }

  openEditProductModal(producto: ProductoDTO): void {
    this.editProducto.set(producto);
    this.modalOpen.set(true);
  }

  closeModal(): void {
    if (this.saving()) return;
    this.modalOpen.set(false);
    this.editProducto.set(undefined);
    this.apiError.set(null);
  }

  onModalSave(producto: PostProductoDTO): void {
    this.saving.set(true);
    this.apiError.set(null);
    const editId = this.editProducto()?.id;

    const handleError = (err: any) => {
      this.saving.set(false);
      const msg = err?.error?.mensaje || err?.error?.message || err?.statusText || 'An unexpected error occurred. Please try again.';
      this.apiError.set(msg);
    };

    if (editId) {
      this.productoService.actualizar(editId, producto).subscribe({
        next: (updated) => {
          this.saving.set(false);
          this.modalOpen.set(false);
          this.editProducto.set(undefined);
          this.apiError.set(null);
          this.productoService.loadProductos();
          this.productoService.loadStats();
          Swal.fire({ icon: 'success', title: 'Updated', text: 'Product updated successfully', timer: 1500, showConfirmButton: false });
          this.checkLowStock(updated);
        },
        error: handleError,
      });
    } else {
      this.productoService.crear(producto).subscribe({
        next: (created) => {
          this.saving.set(false);
          this.modalOpen.set(false);
          this.editProducto.set(undefined);
          this.apiError.set(null);
          this.productoService.loadProductos();
          this.productoService.loadStats();
          Swal.fire({ icon: 'success', title: 'Created', text: 'Product created successfully', timer: 1500, showConfirmButton: false });
          this.checkLowStock(created);
        },
        error: handleError,
      });
    }
  }

  // ── Stock under min check ──
  protected isStockBajo(producto: ProductoDTO): boolean {
    return producto.stockActual <= producto.stockMinimo;
  }

  private checkLowStock(producto: ProductoDTO): void {
    if (this.isStockBajo(producto)) {
      Swal.fire({
        icon: 'warning',
        title: 'Low Stock',
        text: `Product '${producto.nombre}' has low stock (${producto.stockActual} / ${producto.stockMinimo} min).`,
        confirmButtonColor: '#D93838',
      });
    }
  }

  // ── Quick toggle (matches usuarios pattern) ──
  confirmToggleActivo(producto: ProductoDTO): void {
    const action = producto.activo ? 'deactivate' : 'activate';
    Swal.fire({
      title: `${action === 'activate' ? 'Activate' : 'Deactivate'} product?`,
      text: `"${producto.nombre}" will be ${action === 'activate' ? 'activated' : 'deactivated'}.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2E5C40',
      cancelButtonColor: '#D93838',
      cancelButtonText: 'Cancel',
      confirmButtonText: `Yes, ${action}`,
      reverseButtons: true,
    }).then(result => {
      if (result.isConfirmed) {
        const dto: PostProductoDTO = {
          nombre: producto.nombre,
          precio: producto.precio,
          stockActual: producto.stockActual,
          stockMinimo: producto.stockMinimo,
          stockMaximo: producto.stockMaximo,
          tipo: producto.tipo,
          unidadMedida: producto.unidadMedida,
          activo: !producto.activo,
        };

        this.productoService.actualizar(producto.id!, dto).subscribe({
          next: () => {
            this.productoService.loadProductos();
            this.productoService.loadStats();
            Swal.fire({ icon: 'success', title: `${action === 'activate' ? 'Activated' : 'Deactivated'}`, text: `Product ${action}d successfully`, timer: 1500, showConfirmButton: false });
          },
          error: () => {
            Swal.fire({ icon: 'error', title: 'Error', text: `Could not ${action} product`, confirmButtonColor: '#D93838' });
          },
        });
      }
    });
  }

  // ── Delete ──
  confirmDelete(producto: ProductoDTO): void {
    Swal.fire({
      title: 'Delete product?',
      text: `"${producto.nombre}" will be permanently deleted. This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#D93838',
      cancelButtonColor: '#828C85',
      cancelButtonText: 'Cancel',
      confirmButtonText: 'Yes, delete',
      reverseButtons: true,
    }).then(result => {
      if (result.isConfirmed) {
        this.productoService.eliminar(producto.id!).subscribe({
          next: () => {
            this.productoService.loadProductos();
            this.productoService.loadStats();
            Swal.fire({ icon: 'success', title: 'Deleted', text: 'Product permanently deleted', timer: 1500, showConfirmButton: false });
          },
          error: () => {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Could not delete product', confirmButtonColor: '#D93838' });
          },
        });
      }
    });
  }
}
