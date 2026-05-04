import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * Servicio genérico para manejar conexiones SSE (Server-Sent Events)
 * Permite suscribirse a eventos en tiempo real desde el backend
 */
@Injectable({
  providedIn: 'root'
})
export class SseService {
  private sseUrl = 'http://localhost:8081/api/sse';
  
  // Subjects para comunicación en tiempo real
  private eventSubjects = new Map<string, Subject<any>>();
  private conectadoSubject = new BehaviorSubject<boolean>(false);

  // EventSource para recibir eventos del servidor
  private eventSource: EventSource | null = null;
  private reconectarIntervalo: any = null;
  
  // Lista de eventos registrados
  private eventosRegistrados: string[] = [];

  constructor(private authService: AuthService) {}

  /**
   * Iniciar conexión SSE a un endpoint específico
   * @param endpoint El endpoint SSE (ej: 'cocina', 'pedidos', 'reservas')
   * @param eventos Lista de nombres de eventos a escuchar (ej: ['nuevo-pedido', 'pedido-actualizado'])
   */
  iniciarConexion(endpoint: string, eventos: string[]): void {
    if (this.eventSource) {
      console.log('⚠️ Ya existe una conexión SSE activa, usando la existente');
      // Agregar nuevos eventos si no están registrados
      eventos.forEach(evento => {
        if (!this.eventosRegistrados.includes(evento)) {
          this.eventosRegistrados.push(evento);
          this.registrarEvento(evento);
        }
      });
      return;
    }

    this.eventosRegistrados = eventos;
    this.conectarSSE(endpoint);
  }

  /**
   * Establecer conexión SSE
   */
  private conectarSSE(endpoint: string): void {
    try {
      const token = this.authService.getToken();
      if (!token) {
        console.log('❌ No hay token, no se puede conectar al SSE');
        return;
      }

      const sseUrlConToken = `${this.sseUrl}/${endpoint}?token=${encodeURIComponent(token)}`;
      this.eventSource = new EventSource(sseUrlConToken);

      this.eventSource.onopen = () => {
        console.log(`✅ Conexión SSE establecida: /${endpoint}`);
        this.conectadoSubject.next(true);
        this.limpiarReconexion();
      };

      // Registrar listeners para cada evento
      this.eventosRegistrados.forEach(nombreEvento => {
        this.registrarEvento(nombreEvento);
      });

      this.eventSource.onerror = (error) => {
        console.error('❌ Error en conexión SSE:', error);
        this.conectadoSubject.next(false);
        this.programarReconexion(endpoint);
      };

    } catch (error) {
      console.error('Error iniciando conexión SSE:', error);
      this.programarReconexion(endpoint);
    }
  }

  /**
   * Registrar un evento en el EventSource
   */
  private registrarEvento(nombreEvento: string): void {
    if (!this.eventSource) {
      console.warn(`No se puede registrar evento ${nombreEvento}: no hay conexión SSE`);
      return;
    }

    this.eventSource.addEventListener(nombreEvento, (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        console.log(`📩 Evento SSE recibido: ${nombreEvento}`, data);
        
        // Emitir el evento a través del Subject correspondiente
        const subject = this.getOrCreateSubject(nombreEvento);
        subject.next(data);
      } catch (error) {
        console.error(`Error parsing evento ${nombreEvento}:`, error);
      }
    });
  }

  /**
   * Programar reconexión automática
   */
  private programarReconexion(endpoint: string): void {
    this.limpiarReconexion();
    
    this.reconectarIntervalo = setTimeout(() => {
      console.log('🔄 Intentando reconectar SSE...');
      this.conectarSSE(endpoint);
    }, 5000); // Reintentar cada 5 segundos
  }

  /**
   * Limpiar interval de reconexión
   */
  private limpiarReconexion(): void {
    if (this.reconectarIntervalo) {
      clearTimeout(this.reconectarIntervalo);
      this.reconectarIntervalo = null;
    }
  }

  /**
   * Desconectar SSE
   */
  desconectar(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      console.log('🔌 Conexión SSE cerrada');
    }
    
    this.limpiarReconexion();
    this.conectadoSubject.next(false);
    
    // Completar todos los subjects
    this.eventSubjects.forEach(subject => subject.complete());
    this.eventSubjects.clear();
  }

  /**
   * Obtener o crear un Subject para un evento específico
   */
  private getOrCreateSubject<T>(nombreEvento: string): Subject<T> {
    if (!this.eventSubjects.has(nombreEvento)) {
      this.eventSubjects.set(nombreEvento, new Subject<T>());
    }
    return this.eventSubjects.get(nombreEvento) as Subject<T>;
  }

  /**
   * Observable para escuchar un evento específico
   */
  onEvento<T>(nombreEvento: string): Observable<T> {
    return this.getOrCreateSubject<T>(nombreEvento).asObservable();
  }

  /**
   * Observable para saber si está conectado al SSE
   */
  onConexionEstado(): Observable<boolean> {
    return this.conectadoSubject.asObservable();
  }

  /**
   * Verificar si está conectado
   */
  estaConectado(): boolean {
    return this.conectadoSubject.value;
  }
}
