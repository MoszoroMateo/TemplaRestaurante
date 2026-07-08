import { Component, input, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductoDTO, PostProductoDTO, TipoProducto, UnidadMedida } from '../../models/producto.model';

@Component({
  selector: 'app-producto-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './producto-modal.html',
})
export class ProductoModalComponent implements OnInit {
  // ── Inputs ──
  isEditMode = input(false);
  productoData = input<ProductoDTO | undefined>();
  saving = input(false);
  apiError = input<string | null>(null);

  // ── Outputs ──
  save = output<PostProductoDTO>();
  cancel = output<void>();

  // ── Form ──
  protected form = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    precio: new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    stockActual: new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    stockMinimo: new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    stockMaximo: new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    tipo: new FormControl<TipoProducto | ''>('', { nonNullable: true, validators: [Validators.required] }),
    unidadMedida: new FormControl<UnidadMedida | ''>('', { nonNullable: true, validators: [Validators.required] }),
  });

  protected readonly TipoProducto = TipoProducto;
  protected readonly UnidadMedida = UnidadMedida;
  protected readonly tipos = Object.values(TipoProducto);
  protected readonly unidades = Object.values(UnidadMedida);

  ngOnInit(): void {
    const data = this.productoData();
    if (data && this.isEditMode()) {
      this.form.patchValue({
        nombre: data.nombre,
        precio: data.precio,
        stockActual: data.stockActual,
        stockMinimo: data.stockMinimo,
        stockMaximo: data.stockMaximo ?? 0,
        tipo: data.tipo,
        unidadMedida: data.unidadMedida,
      });
    }
  }

  /** Get validation error message for a field */
  protected fieldError(field: string): string | null {
    const control = this.form.get(field);
    if (!control || !control.errors || !control.touched) return null;

    const err = control.errors;
    if (err['required']) return 'This field is required.';
    if (err['minlength']) return `Minimum ${err['minlength'].requiredLength} characters.`;
    if (err['min']) return 'Value must be 0 or greater.';
    return null;
  }

  protected onSubmit(): void {
    if (this.form.invalid || this.saving()) return;

    const raw = this.form.getRawValue();

    const dto: PostProductoDTO = {
      nombre: raw.nombre,
      precio: raw.precio,
      stockActual: raw.stockActual,
      stockMinimo: raw.stockMinimo,
      stockMaximo: raw.stockMaximo,
      tipo: raw.tipo as TipoProducto,
      unidadMedida: raw.unidadMedida as UnidadMedida,
    };

    this.save.emit(dto);
  }

  protected onCancel(): void {
    if (this.saving()) return;
    this.cancel.emit();
  }
}
