# Component Patterns — Templa Frontend V2

This guide outlines professional patterns for building visual and functional components in Angular 21 using Signals and Tailwind v4.

---

## 1. Input Field with Tailwind-Native Floating Label

We do NOT need custom CSS or complex TypeScript class binding for floating labels. We can achieve this elegantly using Tailwind's `peer` selector.

### HTML Pattern
```html
<div class="relative w-full border-b border-muted/50 focus-within:border-primary transition-colors duration-200">
  <input 
    id="email" 
    type="email" 
    placeholder=" " 
    class="peer w-full bg-transparent pt-6 pb-2 font-body text-base text-deep outline-none placeholder-transparent"
    [formControl]="emailControl"
  />
  <label 
    for="email" 
    class="absolute left-0 top-6 origin-[0] -translate-y-4 scale-75 transform font-body text-sm text-muted duration-200 
           peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 
           peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:text-primary 
           peer-focus:font-semibold peer-focus:tracking-[0.1em] peer-focus:uppercase"
  >
    Email Address
  </label>
</div>
```
*Note: The `placeholder=" "` is critical for `peer-placeholder-shown` to detect whether the input has value.*

---

## 2. Standard Buttons (Tailwind v4 composition)

Buttons are sharp (`rounded-none`), tall (`h-14`), and highly interactive:

### Primary Button (Clay solid)
```html
<button 
  type="submit"
  class="flex items-center justify-center w-full h-14 bg-primary hover:bg-primary-hover text-white font-nav text-xs font-semibold tracking-[0.15em] uppercase transition-colors duration-150 rounded-none disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
  [disabled]="isLoading()"
>
  @if (!isLoading()) {
    <span>Confirmar</span>
  } @else {
    <div class="flex items-center gap-1.5">
      <span class="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.3s]"></span>
      <span class="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.15s]"></span>
      <span class="w-1.5 h-1.5 rounded-full bg-white animate-bounce"></span>
    </div>
  }
</button>
```

### Secondary Button (Deep Forest outline)
```html
<button 
  type="button"
  class="flex items-center justify-center w-full h-14 bg-transparent border border-deep text-deep hover:bg-deep hover:text-white font-nav text-xs font-semibold tracking-[0.15em] uppercase transition-all duration-150 rounded-none cursor-pointer"
>
  Cancelar
</button>
```

---

## 3. Standard Data Table with Signals

Tables are designed with generous spacing and high visual contrast.

### Component TS
```typescript
import { Component, input, output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './data-table.html'
})
export class DataTableComponent<T> {
  // Signals inputs (Angular 17.1+)
  columns = input.required<{ key: keyof T; label: string; class?: string }[]>();
  data = input.required<T[]>();
  totalItems = input<number>(0);
  pageSize = input<number>(10);
  currentPage = input<number>(1);

  // Signal outputs
  pageChange = output<number>();
  sortChange = output<{ key: keyof T; order: 'asc' | 'desc' }>();

  // Reactive state
  protected activeSort = signal<{ key: keyof T; order: 'asc' | 'desc' } | null>(null);

  protected totalPages = computed(() => Math.ceil(this.totalItems() / this.pageSize()));

  protected changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.pageChange.emit(page);
    }
  }

  protected sort(key: keyof T): void {
    const current = this.activeSort();
    const order = current?.key === key && current.order === 'asc' ? 'desc' : 'asc';
    this.activeSort.set({ key, order });
    this.sortChange.emit({ key, order });
  }
}
```

### HTML Template (`data-table.html`)
```html
<div class="w-full bg-surface border border-muted/10 overflow-hidden rounded-none">
  <div class="overflow-x-auto">
    <table class="w-full text-left border-collapse">
      <thead>
        <tr class="bg-deep border-b border-muted/10 text-white font-nav text-[11px] font-semibold tracking-[0.15em] uppercase">
          @for (col of columns(); track col.key) {
            <th 
              class="px-6 py-4 cursor-pointer hover:bg-deep/90 select-none {{ col.class }}"
              (click)="sort(col.key)"
            >
              <div class="flex items-center gap-2">
                {{ col.label }}
                @if (activeSort()?.key === col.key) {
                  <span>{{ activeSort()?.order === 'asc' ? '↑' : '↓' }}</span>
                }
              </div>
            </th>
          }
        </tr>
      </thead>
      <tbody class="divide-y divide-muted/10">
        @for (row of data(); track $index) {
          <tr class="hover:bg-bg/40 transition-colors duration-150 font-body text-[14px] text-deep">
            @for (col of columns(); track col.key) {
              <td class="px-6 py-4 {{ col.class }}">
                <!-- Ng-content template outlet projection would be ideal, or simple property output -->
                {{ row[col.key] }}
              </td>
            }
          </tr>
        } @empty {
          <tr>
            <td [attr.colspan]="columns().length" class="text-center py-12 text-muted font-body">
              No hay registros disponibles.
            </td>
          </tr>
        }
      </tbody>
    </table>
  </div>

  <!-- Pagination footer -->
  <div class="flex items-center justify-between px-6 py-4 border-t border-muted/10 bg-bg/20 font-body text-xs text-muted">
    <div>
      Mostrando <span class="font-semibold text-deep">{{ (currentPage() - 1) * pageSize() + 1 }}</span> 
      a <span class="font-semibold text-deep">{{ Math.min(currentPage() * pageSize(), totalItems()) }}</span> 
      de <span class="font-semibold text-deep">{{ totalItems() }}</span> registros
    </div>
    
    <div class="flex gap-1">
      <button 
        class="px-3 h-8 border border-muted/20 text-deep hover:bg-bg disabled:opacity-40 rounded-none cursor-pointer"
        [disabled]="currentPage() === 1"
        (click)="changePage(currentPage() - 1)"
      >
        Anterior
      </button>
      <button 
        class="px-3 h-8 border border-muted/20 text-deep hover:bg-bg disabled:opacity-40 rounded-none cursor-pointer"
        [disabled]="currentPage() === totalPages()"
        (click)="changePage(currentPage() + 1)"
      >
        Siguiente
      </button>
    </div>
  </div>
</div>
```
