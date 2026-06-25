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

  // ── Outputs ──
  save = output<Persona>();
  cancel = output<void>();

  // ── Form ──
  protected form = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    apellido: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    dni: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\d+$/)] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    telefono: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
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

  protected onSubmit(): void {
    if (this.form.invalid) return;

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
    this.cancel.emit();
  }
}
