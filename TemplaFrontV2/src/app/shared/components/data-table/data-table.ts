import { Component, input, output, TemplateRef, ContentChild, effect, signal, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ColumnDef {
  key: string;
  label: string;
  class?: string;
  /** Column rendering type: text (default), badge, index, actions */
  type?: 'text' | 'badge' | 'index' | 'actions';
}

export interface BadgeEntry {
  label: string;
  class: string;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './data-table.html',
})
export class DataTableComponent<T extends { [key: string]: any }> {
  // ── Data ──
  columns = input.required<ColumnDef[]>();
  data = input.required<T[]>();
  loading = input(false);
  trackBy = input('id');
  emptyMessage = input('No records found.');

  // ── Badge maps: { columnKey: { cellValue: { label, class } } } ──
  badgeMaps = input<Record<string, Record<string, BadgeEntry>>>({});
  /** Resolve custom display values for columns (e.g. for conditional badge logic).
   *  Keyed by column key, function transforms the row to the display value. */
  customValues = input<Record<string, (row: T) => string>>({});

  // ── Pagination (0-indexed page) ──
  totalItems = input(0);
  pageSize = input(10);
  currentPage = input(0);
  pageChange = output<number>();

  // ── Cell rendering — prefix element before text ──
  cellPrefixes = input<Record<string, (row: T) => string>>({});
  // ── Custom text renderers (override default row[col.key]) ──
  cellRenderers = input<Record<string, (row: T) => string>>({});

  // ── Skeleton loading mode ──
  skeleton = input(false);

  // ── Minimum loading display time (ms) — prevents flash for fast responses ──
  minLoadingMs = input(0);
  /** Internal loading state that enforces minimum display duration */
  protected readonly effectiveLoading = signal(false);
  private _hideTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    const destroyRef = inject(DestroyRef);

    effect(() => {
      const isLoading = this.loading();
      if (isLoading) {
        if (this._hideTimer) { clearTimeout(this._hideTimer); this._hideTimer = null; }
        this.effectiveLoading.set(true);
      } else if (this.minLoadingMs() > 0 && this.effectiveLoading()) {
        this._hideTimer = setTimeout(() => {
          this.effectiveLoading.set(false);
          this._hideTimer = null;
        }, this.minLoadingMs());
      }
    });

    destroyRef.onDestroy(() => {
      if (this._hideTimer) clearTimeout(this._hideTimer);
    });
  }

  // ── Actions ──
  actionClick = output<{ action: string; row: T }>();

  // ── Row actions template (content-projected) ──
  @ContentChild(TemplateRef) actionsTemplate?: TemplateRef<any>;

  // ── Helpers ──
  protected Math = Math;

  protected getBadge(colKey: string, value: any): BadgeEntry | null {
    return this.badgeMaps()[colKey]?.[value] ?? null;
  }

  protected onAction(action: string, row: T): void {
    this.actionClick.emit({ action, row });
  }

  protected changePage(page: number): void {
    if (page < 0 || page >= this.totalPages()) return;
    this.pageChange.emit(page);
  }

  protected totalPages = (): number => Math.ceil(this.totalItems() / this.pageSize()) || 1;

  /** Returns page numbers with ellipsis for large pagination */
  protected paginationPages(): (number | null)[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: (number | null)[] = [];

    if (total <= 7) {
      for (let i = 0; i < total; i++) pages.push(i);
    } else if (current < 4) {
      pages.push(0, 1, 2, 3, 4);
      pages.push(null);
      pages.push(total - 1);
    } else if (current > total - 5) {
      pages.push(0);
      pages.push(null);
      for (let i = total - 5; i < total; i++) pages.push(i);
    } else {
      pages.push(0);
      pages.push(null);
      pages.push(current - 1, current, current + 1);
      pages.push(null);
      pages.push(total - 1);
    }
    return pages;
  }

  /** Number of the first visible item for the index column */
  protected indexOffset(): number {
    return this.currentPage() * this.pageSize() + 1;
  }
}
