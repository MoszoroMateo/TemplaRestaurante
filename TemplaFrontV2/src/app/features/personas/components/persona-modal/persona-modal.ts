import { Component, input, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Persona, TipoPersona } from '../../models/persona.model';

@Component({
  selector: 'app-persona-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './persona-modal.html',
})
export class PersonaModalComponent implements OnInit {
  // ── Inputs ──
  isEditMode = input(false);
  personaData = input<Persona | undefined>();
  saving = input(false);
  apiError = input<string | null>(null);

  // ── Outputs ──
  save = output<Persona>();
  cancel = output<void>();

  // ── Form ──
  protected form = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(100)] }),
    apellido: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(100)] }),
    dni: new FormControl('', { nonNullable: true, validators: [
      Validators.required,
      Validators.pattern(/^\d+$/),
      Validators.minLength(6),
      Validators.maxLength(10),
    ]}),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email, Validators.maxLength(255)] }),
    telefono: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(20)] }),
    tipoPersona: new FormControl<TipoPersona>(TipoPersona.PERSONAL, { nonNullable: true, validators: [Validators.required] }),
  });

  protected readonly TipoPersona = TipoPersona;
  protected readonly tipoPersonaOptions = Object.values(TipoPersona);

  ngOnInit(): void {
    const data = this.personaData();
    if (data && this.isEditMode()) {
      this.form.patchValue({
        nombre: data.nombre,
        apellido: data.apellido,
        dni: data.dni.toString(),
        email: data.email,
        telefono: data.telefono,
        tipoPersona: data.tipoPersona,
      });
    }
  }

  /** Get validation error message for a field */
  protected fieldError(field: string): string | null {
    const control = this.form.get(field);
    if (!control || !control.errors || !control.touched) return null;

    const err = control.errors;
    if (err['required']) return 'This field is required.';
    if (err['pattern']) return 'Only numbers are allowed.';
    if (err['email']) return 'Enter a valid email address.';
    if (err['minlength']) return `Minimum ${err['minlength'].requiredLength} characters.`;
    if (err['maxlength']) return `Maximum ${err['maxlength'].requiredLength} characters.`;
    return null;
  }

  protected onSubmit(): void {
    if (this.form.invalid || this.saving()) return;

    const raw = this.form.getRawValue();
    const persona: Persona = {
      id: this.personaData()?.id,
      nombre: raw.nombre,
      apellido: raw.apellido,
      dni: parseInt(raw.dni, 10) || 0,
      email: raw.email,
      telefono: raw.telefono,
      tipoPersona: raw.tipoPersona,
      fechaBaja: this.personaData()?.fechaBaja ?? null,
    };

    this.save.emit(persona);
  }

  protected onCancel(): void {
    if (this.saving()) return;
    this.cancel.emit();
  }
}
