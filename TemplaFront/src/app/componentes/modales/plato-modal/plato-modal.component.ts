import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { GetPlatoDto, TipoPlato } from '../../models/PlatoModel';
import { ProductoDTO } from '../../models/ProductoModel';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-plato-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule], // ✅ CAMBIAR: ReactiveFormsModule
  templateUrl: './plato-modal.component.html',
  styleUrl: './plato-modal.component.css'
})
export class PlatoModalComponent implements OnInit {
  @Input() isEditMode: boolean = false;
  @Input() platoData: GetPlatoDto | null = null;
  @Input() productos: ProductoDTO[] = [];

  platoForm!: FormGroup; // ✅ NUEVO: FormGroup reactivo
  tiposPlatoOptions = Object.values(TipoPlato);

  imagenSeleccionada: File | null = null;
  imagenPreview: string | ArrayBuffer | null = null;

  constructor(
    public activeModal: NgbActiveModal,
    private formBuilder: FormBuilder // ✅ NUEVO: FormBuilder
  ) { }

  ngOnInit() {
    this.inicializarFormulario();

    if (this.isEditMode && this.platoData) {
      this.cargarDatosParaEdicion();
    } else {
      // Agregar un ingrediente vacío por defecto
      this.agregarIngrediente();
    }
  }

  // ✅ NUEVO: Inicializar formulario reactivo
  inicializarFormulario(): void {
    this.platoForm = this.formBuilder.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: ['', [Validators.required, Validators.minLength(10)]],
      precio: ['', [Validators.required, Validators.min(0.01)]],
      tipoPlato: ['', Validators.required],
      disponible: [true],
      foto: ['prueba.jpg'],
      ingredientes: this.formBuilder.array([], Validators.minLength(1)) // ✅ FormArray con validación
    });
  }

  // ✅ NUEVO: Getter para ingredientes FormArray
  get ingredientesFormArray(): FormArray {
    return this.platoForm.get('ingredientes') as FormArray;
  }

  // ✅ NUEVO: Crear FormGroup para un ingrediente
  crearIngredienteFormGroup(idProducto: number | null = null, cantidad: number | null = null): FormGroup {
    return this.formBuilder.group({
      idProducto: [idProducto || '', Validators.required],
      cantidad: [cantidad, [Validators.required, Validators.min(0.001)]] // ✅ Cambiado: min 0.001 (1 gramo)
    });
  }

  // ✅ MEJORADO: Agregar ingrediente usando FormArray
  agregarIngrediente(): void {
    const ingredienteFormGroup = this.crearIngredienteFormGroup();
    this.ingredientesFormArray.push(ingredienteFormGroup);
  }

  // ✅ MEJORADO: Eliminar ingrediente del FormArray
  eliminarIngrediente(index: number): void {
    if (this.ingredientesFormArray.length > 1) {
      this.ingredientesFormArray.removeAt(index);
    }
  }

  // ✅ NUEVO: Cargar datos para edición
  cargarDatosParaEdicion(): void {
    if (!this.platoData) return;

    // Cargar datos básicos
    this.platoForm.patchValue({
      nombre: this.platoData.nombre,
      descripcion: this.platoData.descripcion,
      precio: this.platoData.precio,
      tipoPlato: this.platoData.tipoPlato,
      disponible: this.platoData.disponible,
      foto: this.platoData.foto || ''
    });

    // Limpiar ingredientes existentes
    while (this.ingredientesFormArray.length !== 0) {
      this.ingredientesFormArray.removeAt(0);
    }

    // Agregar ingredientes del plato
    if (this.platoData.ingredientes && this.platoData.ingredientes.length > 0) {
      this.platoData.ingredientes.forEach(ing => {
        const ingredienteFormGroup = this.crearIngredienteFormGroup(ing.idProducto, ing.cantidad);
        this.ingredientesFormArray.push(ingredienteFormGroup);
      });
    } else {
      this.agregarIngrediente();
    }

    // Preview de imagen existente
    if (this.platoData.foto) {
      this.imagenPreview = this.platoData.foto;
    }

    // Debug: verificar estado del formulario
    console.log('📝 Formulario cargado para edición:', {
      valido: this.platoForm.valid,
      valores: this.platoForm.value,
      errores: this.obtenerErroresFormulario()
    });
  }

  // ✅ NUEVO: Método que confirma antes de cambiar el estado
  confirmarToggleDisponibilidad(): void {
    const nuevoValor = this.platoForm.get('disponible')?.value; // El valor ACTUAL (después del click)
    const valorAnterior = !nuevoValor; // El valor ANTERIOR (antes del click)

    const accion = nuevoValor ? 'activar' : 'desactivar';
    const nombrePlato = this.platoForm.get('nombre')?.value || 'este plato';

    Swal.fire({
      title: '¿Confirmar cambio?',
      text: `¿Está seguro de ${accion} "${nombrePlato}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: nuevoValor ? '#84C473' : '#e74c3c',
      cancelButtonColor: '#6c757d',
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        // ✅ Si confirma: ejecutar acción
        this.activeModal.close({
          accion: 'toggleDisponibilidad',
          plato: {
            ...this.platoData,
            disponible: nuevoValor
          }
        });
      } else {
        // ✅ Si cancela: revertir al estado original
        this.platoForm.get('disponible')?.setValue(valorAnterior);
      }
    });
  }

  // ✅ NUEVO: Baja definitiva con SweetAlert
  eliminarPlatoModal(): void {
    const nombrePlato = this.platoForm.get('nombre')?.value || 'este plato';

    Swal.fire({
      title: '⚠️ ¡ATENCIÓN!',
      text: `¿Está seguro de eliminar definitivamente "${nombrePlato}"?`,
      html: `
        <p>¿Está seguro de eliminar definitivamente <strong>"${nombrePlato}"</strong>?</p>
        <p class="text-danger"><strong>Esta acción NO se puede deshacer.</strong></p>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar definitivamente',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      focusCancel: true // ✅ Focus en cancelar por seguridad
    }).then((result) => {
      if (result.isConfirmed) {
        // ✅ Devolver datos al componente padre para que ejecute la eliminación
        this.activeModal.close({
          accion: 'eliminar',
          plato: this.platoData
        });
      }
    });
  }

  // ✅ MODIFICAR: Save normal (sin cambios de estado)
  save(): void {
    console.log('🚀 Guardando cambios normales del plato...');

    if (this.isFormularioValido()) {
      const formValue = this.platoForm.value;

      // Validar ingredientes
      if (!formValue.ingredientes || formValue.ingredientes.length === 0) {
        alert('Debe agregar al menos un ingrediente');
        return;
      }

      const ingredientesTransformados = formValue.ingredientes
        .filter((ing: any) => ing.idProducto && ing.cantidad > 0)
        .map((ing: any) => ({
          idProducto: parseInt(ing.idProducto),
          cantidad: parseFloat(ing.cantidad)
        }));

      if (ingredientesTransformados.length === 0) {
        alert('Debe tener al menos un ingrediente válido');
        return;
      }

      const platoParaGuardar = {
        ...formValue,
        precio: parseFloat(formValue.precio),
        ingredientes: ingredientesTransformados
      };

      // Si es edición, mantener el ID
      if (this.isEditMode && this.platoData) {
        platoParaGuardar.idPlato = this.platoData.idPlato;
      }

      console.log('✅ Plato a guardar:', platoParaGuardar);

      // ✅ Devolver acción normal de guardado
      this.activeModal.close({
        accion: 'guardar',
        plato: platoParaGuardar,
        imagen: this.imagenSeleccionada
      });
    } else {
      console.log('❌ Formulario inválido');
      this.marcarCamposComoTocados();

      if (this.ingredientesFormArray.length === 0) {
        alert('Debe agregar al menos un ingrediente');
      } else if (!this.platoForm.valid) {
        alert('Por favor complete todos los campos obligatorios correctamente');
      } else {
        alert('Verifique que todos los ingredientes tengan producto y cantidad válidos');
      }
    }
  }

  isFormularioValido(): boolean {
    const formularioBasico = this.platoForm.valid;
    const tieneIngredientes = this.ingredientesFormArray.length > 0;
    const ingredientesValidos = this.ingredientesFormArray.controls.every(control =>
      control.valid &&
      control.get('idProducto')?.value &&
      control.get('cantidad')?.value > 0
    );

    console.log('🔍 Validación formulario:', {
      formularioBasico,
      tieneIngredientes,
      ingredientesValidos,
      resultado: formularioBasico && tieneIngredientes && ingredientesValidos
    });

    return formularioBasico && tieneIngredientes && ingredientesValidos;
  }

  // ✅ NUEVO: Marcar campos como touched para mostrar errores
  private marcarCamposComoTocados(): void {
    Object.keys(this.platoForm.controls).forEach(key => {
      this.platoForm.get(key)?.markAsTouched();
    });

    // También marcar ingredientes
    this.ingredientesFormArray.controls.forEach(control => {
      Object.keys(control.value).forEach(key => {
        control.get(key)?.markAsTouched();
      });
    });
  }

  // ✅ SIMPLIFICADO: Ya no necesitamos isFormValid, usamos platoForm.valid
  cancel(): void {
    this.activeModal.dismiss();
  }

  // ✅ ÚTIL: Verificar si un campo específico tiene errores
  hasError(fieldName: string): boolean {
    const field = this.platoForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  // ✅ ÚTIL: Obtener mensaje de error para un campo
  getErrorMessage(fieldName: string): string {
    const field = this.platoForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return 'Este campo es requerido';
      if (field.errors['minlength']) return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
      if (field.errors['min']) return `El valor debe ser mayor a ${field.errors['min'].min}`;
    }
    return '';
  }

  // ✅ NUEVO: Debug - Obtener todos los errores del formulario
  obtenerErroresFormulario(): any {
    const errores: any = {};
    
    Object.keys(this.platoForm.controls).forEach(key => {
      const control = this.platoForm.get(key);
      if (control && control.invalid) {
        errores[key] = control.errors;
      }
    });

    // Errores de ingredientes
    if (this.ingredientesFormArray.invalid) {
      errores.ingredientes = [];
      this.ingredientesFormArray.controls.forEach((control, index) => {
        if (control.invalid) {
          errores.ingredientes.push({
            index,
            errores: control.errors,
            valores: control.value
          });
        }
      });
    }

    return errores;
  }

  // ✅ NUEVO: Método para debug en consola del estado del formulario
  debugFormulario(): void {
    console.log('🔍 Estado del formulario:', {
      valido: this.platoForm.valid,
      valores: this.platoForm.value,
      errores: this.obtenerErroresFormulario(),
      ingredientes: {
        cantidad: this.ingredientesFormArray.length,
        validos: this.ingredientesFormArray.controls.filter(c => c.valid).length,
        invalidos: this.ingredientesFormArray.controls.filter(c => c.invalid).length
      }
    });
  }

  getProductoNombre(id: number): string {
    const producto = this.productos.find(p => p.id === id);
    return producto ? producto.nombre : '';
  }

  getProductoById(id: number): ProductoDTO | undefined {
    return this.productos.find(p => p.id === id);
  }

  // ✅ NUEVO: Obtener unidad de medida abreviada
  getUnidadAbreviada(unidadMedida: string): string {
    switch (unidadMedida?.toUpperCase()) {
      case 'KILOGRAMO':
      case 'KILOGRAMOS':
        return 'kg';
      case 'GRAMO':
      case 'GRAMOS':
        return 'g';
      case 'LITRO':
      case 'LITROS':
        return 'l';
      case 'MILILITRO':
      case 'MILILITROS':
        return 'ml';
      case 'UNIDAD':
      case 'UNIDADES':
        return 'u';
      default:
        return 'u';
    }
  }

  // ✅ NUEVO: Obtener unidad para un ingrediente específico
  getUnidadParaIngrediente(ingredienteControl: any): string {
    const productoId = ingredienteControl.get('idProducto')?.value;
    if (productoId) {
      const producto = this.getProductoById(parseInt(productoId));
      return producto ? this.getUnidadAbreviada(producto.unidadMedida) : 'u';
    }
    return 'u';
  }


    onImagenSeleccionada(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona un archivo de imagen válido');
        return;
      }
      
      // Validar tamaño (5MB máximo)
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen debe ser menor a 5MB');
        return;
      }
      
      this.imagenSeleccionada = file;
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagenPreview = e.target?.result || null;
      };
      reader.readAsDataURL(file);
    }
  }

  // ✅ NUEVO: Método para remover imagen
  removerImagen(): void {
    this.imagenSeleccionada = null;
    this.imagenPreview = null;
    // Limpiar el input
    const inputElement = document.getElementById('imagen') as HTMLInputElement;
    if (inputElement) {
      inputElement.value = '';
    }
  }

}  