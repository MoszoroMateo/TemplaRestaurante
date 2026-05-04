import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class AlertService {

  // ✅ Colores normalizados para Sweet Alerts
  private readonly colors = {
    primary: '#755143',      // templa-brown
    success: '#84C473',      // verde pastel
    error: '#e74c3c',        // rojo
    warning: '#f5d76e',      // amarillo pastel suave
    darkGreen: '#696848'     // templa-dark-green
  };

  // ✅ Mensaje de éxito genérico
  showSuccess(title: string, message?: string): Promise<any> {
    return Swal.fire({
      title: title,
      text: message || 'Operación completada exitosamente',
      icon: 'success',
      confirmButtonText: 'OK',
      confirmButtonColor: this.colors.success,
      timer: 3000,
      timerProgressBar: true
    });
  }

  // ✅ Mensaje de error genérico
  showError(title: string, message?: string): Promise<any> {
    // ✅ Limpiar el prefijo "Error interno del servidor: " del mensaje
    const cleanMessage = message 
      ? message.replace('Error interno del servidor: ', '')
      : 'Ha ocurrido un error inesperado';
    
    return Swal.fire({
      title: title,
      text: cleanMessage,
      icon: 'error',
      confirmButtonText: 'OK',
      confirmButtonColor: this.colors.error
    });
  }

  // ✅ Mensaje de confirmación
  showConfirmation(title: string, message: string, confirmText: string = 'Sí, continuar'): Promise<any> {
    return Swal.fire({
      title: title,
      text: message,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: 'Cancelar',
      confirmButtonColor: this.colors.success,
      cancelButtonColor: this.colors.error
    });
  }

  // ✅ Mensaje de información
  showInfo(title: string, message: string): Promise<any> {
    return Swal.fire({
      title: title,
      text: message,
      icon: 'info',
      confirmButtonText: 'Entendido',
      confirmButtonColor: this.colors.warning
    });
  }

  // ✅ Loading personalizado
  showLoading(title: string = 'Procesando...', message?: string): void {
    Swal.fire({
      title: title,
      text: message || 'Por favor espere...',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  }

  // ✅ Cerrar loading
  closeLoading(): void {
    Swal.close();
  }

  // ✅ Mensajes específicos para CRUD
  crud = {
    // Éxito
    created: (entity: string) => this.showSuccess('Creado', `${entity} creado exitosamente`),
    updated: (entity: string) => this.showSuccess('Actualizado', `${entity} actualizado exitosamente`),
    deleted: (entity: string) => this.showSuccess('Eliminado', `${entity} eliminado exitosamente`),
    statusChanged: (entity: string, newStatus: string) => 
      this.showSuccess('Estado Actualizado', `${entity} cambiado a: ${newStatus}`),

    // Errores
    createError: (entity: string) => this.showError('Error al Crear', `No se pudo crear ${entity}`),
    updateError: (entity: string) => this.showError('Error al Actualizar', `No se pudo actualizar ${entity}`),
    deleteError: (entity: string) => this.showError('Error al Eliminar', `No se pudo eliminar ${entity}`),
    loadError: (entity: string) => this.showError('Error de Carga', `No se pudieron cargar ${entity}`),

    // Confirmaciones
    confirmDelete: (entity: string, name?: string) => 
      this.showConfirmation(
        'Confirmar Eliminación', 
        `¿Está seguro que desea eliminar ${entity}${name ? ` "${name}"` : ''}?`,
        'Sí, eliminar'
      ),
    confirmStatusChange: (entity: string, newStatus: string) =>
      this.showConfirmation(
        'Confirmar Cambio de Estado',
        `¿Está seguro que desea cambiar el estado de ${entity} a "${newStatus}"?`,
        'Sí, cambiar'
      )
  };

  // ✅ Mensajes específicos para mesas
  mesa = {
    created: () => this.crud.created('la mesa'),
    updated: () => this.crud.updated('la mesa'),
    statusChanged: (newStatus: string) => this.crud.statusChanged('la mesa', newStatus),
    createError: () => this.crud.createError('la mesa'),
    updateError: () => this.crud.updateError('la mesa'),
    statusChangeError: () => this.showError('Error de Estado', 'No se pudo cambiar el estado de la mesa'),
    loadError: () => this.crud.loadError('las mesas')
  };

  // ✅ Mensajes específicos para platos
  plato = {
    created: () => this.crud.created('el plato'),
    updated: () => this.crud.updated('el plato'),
    statusChanged: (newStatus: string) => this.crud.statusChanged('el plato', newStatus),
    createError: () => this.crud.createError('el plato'),
    updateError: () => this.crud.updateError('el plato'),
    statusChangeError: () => this.showError('Error de Estado', 'No se pudo cambiar el estado del plato'),
    loadError: () => this.crud.loadError('los platos')
  };

  // ✅ Mensajes específicos para personas
  persona = {
    created: () => this.crud.created('la persona'),
    updated: () => this.crud.updated('la persona'),
    deleted: () => this.crud.deleted('la persona'),
    createError: () => this.crud.createError('la persona'),
    updateError: () => this.crud.updateError('la persona'),
    deleteError: () => this.crud.deleteError('la persona'),
    loadError: () => this.crud.loadError('las personas'),
    confirmDelete: (name: string) => this.crud.confirmDelete('la persona', name)
  };

  // ✅ Mensajes específicos para menús
  menu = {
    created: () => this.crud.created('el menú'),
    updated: () => this.crud.updated('el menú'),
    statusChanged: (newStatus: string) => this.crud.statusChanged('el menú', newStatus),
    createError: () => this.crud.createError('el menú'),
    updateError: () => this.crud.updateError('el menú'),
    statusChangeError: () => this.showError('Error de Estado', 'No se pudo cambiar el estado del menú'),
    loadError: () => this.showError('Menús No Encontrados', 'No se pudieron cargar los menús. Por favor, inténtelo de nuevo.')
  };

  // ✅ Mensajes específicos para productos
  producto = {
    created: () => this.crud.created('el producto'),
    updated: () => this.crud.updated('el producto'),
    deleted: () => this.crud.deleted('el producto'),
    statusChanged: (newStatus: string) => this.crud.statusChanged('el producto', newStatus),
    createError: () => this.crud.createError('el producto'),
    updateError: () => this.crud.updateError('el producto'),
    deleteError: () => this.crud.deleteError('el producto'),
    statusChangeError: () => this.showError('Error de Estado', 'No se pudo cambiar el estado del producto'),
    loadError: () => this.crud.loadError('los productos'),
    confirmDelete: (name: string) => this.crud.confirmDelete('el producto', name)
  };
}