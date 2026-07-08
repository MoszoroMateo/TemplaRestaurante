import { Component, input, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuarioDTO, UsuarioCreateDTO, UsuarioUpdateDTO, RolUsuario } from '../../models/usuario.model';

@Component({
  selector: 'app-usuario-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './usuario-modal.html',
})
export class UsuarioModalComponent implements OnInit {
  // ── Inputs ──
  isEditMode = input(false);
  usuarioData = input<UsuarioDTO | undefined>();
  personas = input<{ dni: number; nombre: string }[]>([]);
  saving = input(false);
  apiError = input<string | null>(null);

  // ── Outputs ──
  save = output<UsuarioCreateDTO | UsuarioUpdateDTO>();
  cancel = output<void>();

  // ── Form ──
  protected form = new FormGroup({
    username: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3), Validators.maxLength(50)] }),
    password: new FormControl('', { nonNullable: true }),
    rol: new FormControl<RolUsuario | ''>('', { nonNullable: true, validators: [Validators.required] }),
    personaDni: new FormControl<number | null>(null, { validators: [Validators.required] }),
  });

  protected readonly RolUsuario = RolUsuario;
  protected readonly roles = Object.values(RolUsuario);

  ngOnInit(): void {
    const data = this.usuarioData();
    if (data && this.isEditMode()) {
      this.form.patchValue({
        username: data.username,
        rol: data.rolUsuario,
      });
      // Password and persona are optional in edit mode — clear validators
      this.form.get('password')?.clearValidators();
      this.form.get('password')?.updateValueAndValidity();
      this.form.get('personaDni')?.clearValidators();
      this.form.get('personaDni')?.updateValueAndValidity();
    } else {
      // Password & persona required in create mode
      this.form.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
      this.form.get('password')?.updateValueAndValidity();
      this.form.get('personaDni')?.setValidators([Validators.required]);
      this.form.get('personaDni')?.updateValueAndValidity();
    }
  }

  /** Get validation error message for a field */
  protected fieldError(field: string): string | null {
    const control = this.form.get(field);
    if (!control || !control.errors || !control.touched) return null;

    const err = control.errors;
    if (err['required']) return 'This field is required.';
    if (err['minlength']) return `Minimum ${err['minlength'].requiredLength} characters.`;
    if (err['maxlength']) return `Maximum ${err['maxlength'].requiredLength} characters.`;
    return null;
  }

  protected onSubmit(): void {
    if (this.form.invalid || this.saving()) return;

    const raw = this.form.getRawValue();
    const rolValue = raw.rol as RolUsuario;

    if (this.isEditMode()) {
      const dto: UsuarioUpdateDTO = {
        username: raw.username,
        rolUsuario: rolValue,
        activo: this.usuarioData()?.activo ?? true,
      };
      // Only include password if non-empty
      if (raw.password?.trim()) {
        dto.password = raw.password.trim();
      }
      this.save.emit(dto);
    } else {
      const dto: UsuarioCreateDTO = {
        username: raw.username,
        password: raw.password,
        rolUsuario: rolValue,
        personaDni: raw.personaDni!,
      };
      this.save.emit(dto);
    }
  }

  protected onCancel(): void {
    if (this.saving()) return;
    this.cancel.emit();
  }
}
