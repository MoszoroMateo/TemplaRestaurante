import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface NotificacionDTO {
  tipo: string;
  mensaje: string;
  datos?: any;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private connected = false;
  private eventSource: EventSource | null = null;
  
  // Subject para las notificaciones
  private notificationsSubject = new BehaviorSubject<NotificacionDTO[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();
  
  // Subject para el contador de notificaciones no leídas
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor() {
    // Constructor vacío - las notificaciones se agregarán cuando sea necesario
  }

  /**
   * Conectar al endpoint SSE de pedidos listos para un mozo específico
   * @param idMozo ID del mozo que recibirá las notificaciones
   */
  public conectarPedidosListos(idMozo: number): void {
    if (this.eventSource) {
      console.log('⚠️ Ya existe una conexión SSE activa, cerrando...');
      this.disconnect();
    }

    const url = `http://localhost:8081/api/sse/pedidos-listos/${idMozo}`;
    console.log(`🔌 Conectando a SSE de pedidos listos para mozo ${idMozo}:`, url);

    this.eventSource = new EventSource(url);

    this.eventSource.onopen = () => {
      console.log('✅ Conexión SSE establecida para pedidos listos');
      this.connected = true;
    };

    this.eventSource.onmessage = (event) => {
      try {
        const notificacion: NotificacionDTO = JSON.parse(event.data);
        console.log('🔔 Notificación de pedido listo recibida:', notificacion);
        this.addNotification(notificacion);
      } catch (error) {
        console.error('❌ Error al parsear notificación de pedido listo:', error);
      }
    };

    this.eventSource.onerror = (error) => {
      console.error('❌ Error en conexión SSE de pedidos listos:', error);
      this.connected = false;
      // Reintentar conexión después de 5 segundos
      setTimeout(() => {
        console.log('🔄 Reintentando conexión SSE...');
        this.conectarPedidosListos(idMozo);
      }, 5000);
    };
  }

  /**
   * Conectar al endpoint SSE de alertas de stock bajo
   * Esta conexión es global y no requiere ID de usuario
   */
  public conectarAlertasStock(): void {
    const url = `http://localhost:8081/api/sse/alertas-stock`;
    console.log('🔌 Conectando a SSE de alertas de stock:', url);

    const stockEventSource = new EventSource(url);

    stockEventSource.onopen = () => {
      console.log('✅ Conexión SSE establecida para alertas de stock');
    };

    stockEventSource.addEventListener('stock-bajo', (event: MessageEvent) => {
      try {
        const notificacion: NotificacionDTO = JSON.parse(event.data);
        console.log('⚠️ Notificación de stock bajo recibida:', notificacion);
        this.addNotification(notificacion);
      } catch (error) {
        console.error('❌ Error al parsear notificación de stock bajo:', error);
      }
    });

    stockEventSource.onerror = (error) => {
      console.error('❌ Error en conexión SSE de alertas de stock:', error);
      // Reintentar conexión después de 5 segundos
      setTimeout(() => {
        console.log('🔄 Reintentando conexión SSE de alertas de stock...');
        this.conectarAlertasStock();
      }, 5000);
    };
  }

  // Método para simular la llegada de una notificación (útil para testing)
  public simulateNotification(notification: NotificacionDTO): void {
    this.addNotification(notification);
  }

  // Método para agregar notificación desde el exterior (cuando se crea un producto)
  public addProductNotification(tipo: 'NUEVO_PRODUCTO' | 'PRODUCTO_ACTUALIZADO' | 'PRODUCTO_ELIMINADO', mensaje: string, datos?: any): void {
    this.addNotification({
      tipo,
      mensaje,
      datos,
      timestamp: new Date().toISOString()
    });
  }

  // Método para agregar notificación de alerta de stock bajo
  public addStockAlertNotification(mensaje: string, datos?: any): void {
    this.addNotification({
      tipo: 'STOCK_BAJO',
      mensaje,
      datos,
      timestamp: new Date().toISOString()
    });
  }

  // Método público para agregar cualquier tipo de notificación
  public addNotification(notification: NotificacionDTO): void {
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = [notification, ...currentNotifications];
    
    // Mantener solo las últimas 10 notificaciones
    if (updatedNotifications.length > 10) {
      updatedNotifications.splice(10);
    }
    
    this.notificationsSubject.next(updatedNotifications);
    
    // Incrementar contador de no leídas
    const currentCount = this.unreadCountSubject.value;
    this.unreadCountSubject.next(currentCount + 1);
  }

  // Método para marcar notificaciones como leídas
  markAsRead(): void {
    this.unreadCountSubject.next(0);
  }

  // Método para limpiar todas las notificaciones
  clearNotifications(): void {
    this.notificationsSubject.next([]);
    this.unreadCountSubject.next(0);
  }

  // Método para enviar una notificación de prueba
  sendTestNotification(): void {
    this.addNotification({
      tipo: 'TEST',
      mensaje: 'Esta es una notificación de prueba',
      timestamp: new Date().toISOString()
    });
  }

  // Método para simular una alerta de stock bajo (para pruebas)
  sendTestStockAlert(): void {
    const productoEjemplo = {
      id: 1,
      nombre: "Harina",
      stockActual: 2,
      stockMinimo: 5,
      tipo: "INSUMO"
    };

    this.addStockAlertNotification(
      `ALERTA: Stock bajo para el producto '${productoEjemplo.nombre}'. Stock actual: ${productoEjemplo.stockActual}, Stock mínimo: ${productoEjemplo.stockMinimo}`,
      productoEjemplo
    );
  }

  // Limpiar recursos al destruir el servicio
  disconnect(): void {
    console.log('Desconectando servicio de notificaciones...');
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.connected = false;
      console.log('✅ Conexión SSE cerrada');
    }
  }

  // Getter para saber si está conectado
  isConnected(): boolean {
    return this.connected;
  }
}