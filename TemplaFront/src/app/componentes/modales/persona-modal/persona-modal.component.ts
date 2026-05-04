import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Persona, TipoPersona } from '../../models/PersonaModel';


@Component({
  selector: 'app-persona-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './persona-modal.component.html',
  styleUrl: './persona-modal.component.css'
})
export class PersonaModalComponent implements OnInit {
  @Input() isEditMode: boolean = false;
  @Input() personaData: Persona | null = null;

  persona: Persona = {    
    nombre: '',
    apellido: '',
    dni: '',
    email: '',
    telefono: '',
    tipoPersona: null as any,
    fechaBaja: '',
    activo: true
  };

  tipoPersonaOptions = Object.values(TipoPersona);

  constructor(public activeModal: NgbActiveModal) {}

  getFechaFormateada(fecha: any): string {
    if (!fecha) return '';
    
    if (Array.isArray(fecha)) {
      const [year, month, day] = fecha;
      return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
    }
    
    return '';
  }

  ngOnInit() {
    if (this.isEditMode && this.personaData) {
      this.persona = { ...this.personaData };
          if (this.persona.dni && typeof this.persona.dni !== 'string') {
            this.persona.dni = (this.persona.dni as any).toString();
          }
    }
  }

  save() {
    if (!this.isFormValid()) {
      alert('Por favor complete todos los campos obligatorios');
      return;
    }

    console.log('Persona a guardar:', this.persona);
    this.activeModal.close(this.persona);
  }

  isFormValid(): boolean {
    return !!(
      this.persona.nombre?.trim() &&
      this.persona.apellido?.trim() &&
      this.persona.dni?.toString()?.trim() && // ✅ CAMBIAR: más seguro
      this.persona.email?.trim() &&
      this.persona.telefono?.trim() &&
      this.persona.tipoPersona 
    );
  }

  cancel() {
    this.activeModal.dismiss();
  }
}
