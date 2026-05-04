import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { GetMesaDto, PostMesaDto, EstadoMesa } from '../../models/MesasModel';

@Component({
  selector: 'app-mesa-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './mesa-modal.component.html',
  styleUrl: './mesa-modal.component.css'
})
export class MesaModalComponent implements OnInit {
  
  mesaForm!: FormGroup;
  isEditMode: boolean = false;
  mesaData: GetMesaDto | null = null;
  EstadoMesa = EstadoMesa;

  constructor(
    public activeModal: NgbActiveModal,
    private formBuilder: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initForm();
    if (this.isEditMode && this.mesaData) {
      this.cargarDatosMesa();
    }
  }

  private initForm(): void {
    this.mesaForm = this.formBuilder.group({
      numeroMesa: ['', [Validators.required, Validators.maxLength(20)]],
      estadoMesa: [null, [Validators.required]] // ✅ CAMBIAR: null para placeholder
    });
  }

  private cargarDatosMesa(): void {
    if (this.mesaData) {
      this.mesaForm.patchValue({
        numeroMesa: this.mesaData.numeroMesa.toString(),
        estadoMesa: this.mesaData.estadoMesa
      });
    }
  }

  getEstadoTexto(estado: EstadoMesa): string {
    switch (estado) {
      case EstadoMesa.DISPONIBLE: return 'Disponible';
      case EstadoMesa.OCUPADA: return 'Ocupada';
      case EstadoMesa.RESERVADA: return 'Reservada';
      case EstadoMesa.FUERA_SERVICIO: return 'Fuera de Servicio';
      default: return estado;
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.mesaForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.mesaForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) {
        return fieldName === 'numeroMesa' ? 'El número de mesa es obligatorio' : 'El estado es obligatorio';
      }
      if (field.errors['maxlength']) {
        return 'Máximo 20 caracteres';
      }
    }
    return '';
  }

  save(): void {
    if (this.mesaForm.valid) {
      const formValue = this.mesaForm.value;

      if (this.isEditMode && this.mesaData) {
        const mesaActualizada: GetMesaDto = {
          idMesa: this.mesaData.idMesa,
          numeroMesa: formValue.numeroMesa,
          estadoMesa: formValue.estadoMesa
        };
        this.activeModal.close({ accion: 'actualizar', mesa: mesaActualizada });
      } else {
        const nuevaMesa: PostMesaDto = {
          numeroMesa: formValue.numeroMesa,
          estadoMesa: formValue.estadoMesa
        };
        this.activeModal.close({ accion: 'crear', mesa: nuevaMesa });
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.mesaForm.controls).forEach(key => {
      const control = this.mesaForm.get(key);
      control?.markAsTouched();
    });
  }

  cancel(): void {
    this.activeModal.dismiss('cancel');
  }

  get modalTitle(): string {
    return this.isEditMode ? 'Editar Mesa' : 'Alta de Mesa';
  }

  get submitButtonText(): string {
    return this.isEditMode ? 'Guardar' : 'Guardar';
  }
}