import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { MesaService } from '../../../services/mesa.service';
import { PedidoService } from '../../../services/pedido.service';
import { SseService } from '../../../services/sse.service';
import { AuthService } from '../../../services/auth.service';
import { AlertService } from '../../../services/alert.service';
import { NotificationService } from '../../../services/notification.service';
import { EstadoMesa, GetMesaDto } from '../../models/MesasModel';
import { GetPedidoDto } from '../../models/PedidoModel';
import { PedidoModalComponent } from '../../modales/pedido-modal/pedido-modal.component';

interface MesaEnPlano extends GetMesaDto {
  posX: number;
  posY: number;
  piso: number;
}

interface Piso {
  numero: number;
  nombre: string;
  imagenUrl: string;
}

@Component({
  selector: 'app-mapa-mesas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mapa-mesas.component.html',
  styleUrl: './mapa-mesas.component.css'
})
export class MapaMesasComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapaContainer') mapaContainer!: ElementRef;

  // ✅ Configuración de pisos
  pisos: Piso[] = [
    { numero: 0, nombre: 'Principal', imagenUrl: 'assets/imagenes/Planos-Principal.png' },
    { numero: 1, nombre: 'Planta Alta', imagenUrl: 'assets/imagenes/Planos-pAlta.png' },
    { numero: 2, nombre: 'VIP', imagenUrl: 'assets/imagenes/MesaVip.png' }
  ];
  pisoActual: number = 0;

  // ✅ Mesas en el plano actual
  mesasEnPlano: MesaEnPlano[] = [];
  
  // ✅ Mesas disponibles para vincular (panel lateral)
  mesasDisponibles: GetMesaDto[] = [];
  mesasFiltradas: GetMesaDto[] = [];
  busquedaMesa: string = '';

  // ✅ Modo configuración
  modoConfiguracion: boolean = false;
  puedeConfigurar: boolean = false;

  // ✅ Zoom y Pan
  escalaZoom: number = 1;
  panX: number = 0;
  panY: number = 0;
  private isPanning: boolean = false;
  private lastPanPosition = { x: 0, y: 0 };

  // ✅ Escala responsive del plano
  private planoOriginalWidth: number = 720; // Ancho original del plano en píxeles
  private planoOriginalHeight: number = 600; // Alto original del plano en píxeles
  escalaPlano: number = 1; // Factor de escala calculado dinámicamente

  // ✅ Menú contextual
  menuContextual = {
    visible: false,
    x: 0,
    y: 0,
    mesa: null as MesaEnPlano | null
  };

  // ✅ Drag desde panel lateral
  mesaArrastrandoDesdePanel: GetMesaDto | null = null;
  previewMesaPosition: { x: number; y: number } | null = null;

  // ✅ Suscripciones SSE
  private sseSubscriptions: Subscription[] = [];

  // ✅ Enum para el template
  EstadoMesa = EstadoMesa;

  constructor(
    private mesaService: MesaService,
    private pedidoService: PedidoService,
    private sseService: SseService,
    private authService: AuthService,
    private alertService: AlertService,
    private notificationService: NotificationService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.verificarPermisos();
    this.cargarMesasDisponibles();
    this.cargarMesasEnPlano();
    this.suscribirseAEventosSSE();
  }

  ngOnDestroy(): void {
    // Solo desuscribirse de los eventos, no cerrar la conexión SSE
    // (otros componentes pueden estar usándola)
    this.sseSubscriptions.forEach(sub => sub.unsubscribe());
    window.removeEventListener('resize', () => this.calcularEscalaPlano());
  }
  
  ngAfterViewInit(): void {
    this.inicializarInteracciones();
    this.calcularEscalaPlano();
    
    // Recalcular escala en resize
    window.addEventListener('resize', () => this.calcularEscalaPlano());
  }

  // ═══════════════════════════════════════════════════════════
  // CÁLCULO DE ESCALA RESPONSIVE
  // ═══════════════════════════════════════════════════════════

  /**
   * Calcula el factor de escala del plano según el viewport actual
   */
  calcularEscalaPlano(): void {
    if (!this.mapaContainer) return;

    const imgElement = this.mapaContainer.nativeElement.querySelector('.plano-imagen');
    if (!imgElement) return;

    const rect = imgElement.getBoundingClientRect();
    const anchoReal = rect.width;
    const altoReal = rect.height;

    // Si la imagen aún no se cargó, esperar
    if (anchoReal === 0 || altoReal === 0) {
      console.warn('⚠️ Imagen del plano aún no cargada, esperando...');
      return;
    }

    // Calcular factores de escala
    const factorX = anchoReal / this.planoOriginalWidth;
    const factorY = altoReal / this.planoOriginalHeight;

    // Usar el menor factor para mantener proporciones
    this.escalaPlano = Math.min(factorX, factorY);

    console.log('📐 Escala del plano calculada:', {
      anchoReal,
      altoReal,
      anchoOriginal: this.planoOriginalWidth,
      altoOriginal: this.planoOriginalHeight,
      escalaPlano: this.escalaPlano
    });
  }

  /**
   * Callback cuando la imagen del plano se carga
   */
  onImagenCargada(): void {
    console.log('🖼️ Imagen del plano cargada, calculando escala...');
    setTimeout(() => {
      this.calcularEscalaPlano();
    }, 100);
  }

  /**
   * Obtiene la posición X escalada de una mesa
   */
  getPosXEscalada(mesa: MesaEnPlano): number {
    return mesa.posX * this.escalaPlano;
  }

  /**
   * Obtiene la posición Y escalada de una mesa
   */
  getPosYEscalada(mesa: MesaEnPlano): number {
    return mesa.posY * this.escalaPlano;
  }

  // ═══════════════════════════════════════════════════════════
  // PERMISOS Y ROLES
  // ═══════════════════════════════════════════════════════════

  verificarPermisos(): void {
    const userInfo = this.authService.getUserInfo();
    console.log('User Info para modo configuración:', userInfo); // Debug
    if (userInfo && userInfo.rol) {
      const rolesPermitidos = ['ADMINISTRADOR', 'ENCARGADO'];
      this.puedeConfigurar = rolesPermitidos.includes(userInfo.rol);
      console.log('Puede configurar:', this.puedeConfigurar, '- Rol:', userInfo.rol); // Debug
    } else {
      // Si no hay rol o no está logueado, permitir temporalmente para pruebas
      console.warn('No se detectó rol. Habilitando modo configuración para pruebas.');
      this.puedeConfigurar = false; // TEMPORAL: cambiar a false en producción
    }
  }

  toggleModoConfiguracion(): void {
    // No hacemos toggle aquí porque [(ngModel)] ya lo hace
    if (this.modoConfiguracion) {
      this.alertService.showInfo('Modo Configuración', 'Puedes arrastrar mesas desde el panel lateral');
    } else {
      this.alertService.showInfo('Modo Normal', 'Modo configuración desactivado');
    }
  }

  // ═══════════════════════════════════════════════════════════
  // CARGA DE DATOS
  // ═══════════════════════════════════════════════════════════

  cargarMesasDisponibles(): void {
    // Cargar todas las mesas del sistema (sin filtro)
    this.mesaService.getMesasFiltradas(0, 1000).subscribe({
      next: (response) => {
        this.mesasDisponibles = response.content;
        this.mesasFiltradas = [...this.mesasDisponibles];
      },
      error: (error) => {
        console.error('Error al cargar mesas disponibles:', error);
        this.alertService.showError('Error al cargar las mesas disponibles');
      }
    });
  }

  cargarMesasEnPlano(): void {
    this.mesaService.getMesasConPosiciones().subscribe({
      next: (mesas) => {
        this.mesasEnPlano = mesas.filter(m => 
          m.posX !== undefined && 
          m.posY !== undefined && 
          m.piso !== undefined
        ) as MesaEnPlano[];
        
        console.log('Mesas cargadas desde BD:', this.mesasEnPlano);
      },
      error: (error) => {
        console.error('Error al cargar mesas en plano:', error);
        this.alertService.showError('Error', 'No se pudieron cargar las posiciones de las mesas');
      }
    });
  }

  suscribirseAEventosSSE(): void {
    // Asegurarnos de que la conexión SSE esté iniciada
    this.sseService.iniciarConexion('cocina', ['nuevo-pedido', 'pedido-actualizado']);
    
    // Suscribirse a nuevos pedidos
    const nuevoPedidoSub = this.sseService.onEvento<GetPedidoDto>('nuevo-pedido').subscribe({
      next: (pedido: GetPedidoDto) => {
        console.log('SSE: Nuevo pedido recibido en mapa-mesas:', pedido);
        // Recargar mesas para actualizar el estado
        this.cargarMesasEnPlano();
        this.alertService.showInfo('Nuevo Pedido', `Mesa ${pedido.numeroMesa} - Pedido #${pedido.idPedido}`);
      },
      error: (error: any) => {
        console.error('Error en evento nuevo-pedido:', error);
      }
    });

    // Suscribirse a actualizaciones de pedidos
    const actualizacionPedidoSub = this.sseService.onEvento<GetPedidoDto>('pedido-actualizado').subscribe({
      next: (pedido: GetPedidoDto) => {
        console.log('SSE: Pedido actualizado en mapa-mesas:', pedido);
        
        // Si el pedido fue cancelado, recargar mesas para actualizar estados
        if (pedido.estado === 'CANCELADO') {
          this.alertService.showInfo('Pedido Cancelado', `Mesa ${pedido.numeroMesa} - Pedido #${pedido.idPedido} cancelado`);
          this.cargarMesasEnPlano();
          return;
        }
        
        // Actualizar la mesa correspondiente en el plano si existe
        const mesa = this.mesasEnPlano.find(m => m.numeroMesa === pedido.numeroMesa);
        if (mesa) {
          // Recargar solo esa mesa o actualizar su estado según los detalles del pedido
          this.actualizarEstadoMesaPorPedido(mesa, pedido);
        }
      },
      error: (error: any) => {
        console.error('Error en evento pedido-actualizado:', error);
      }
    });

    // Guardar suscripciones para limpieza
    this.sseSubscriptions.push(nuevoPedidoSub, actualizacionPedidoSub);
  }

  /**
   * Actualizar el estado visual de una mesa basado en el pedido actualizado
   */
  private actualizarEstadoMesaPorPedido(mesa: MesaEnPlano, pedido: GetPedidoDto): void {
    console.log(`🔄 Actualizando mesa ${mesa.numeroMesa} por cambio en pedido #${pedido.idPedido}`);
    
    const todosEntregados = pedido.detalles.every(d => d.estado === 'ENTREGADO');
    const itemsListos = pedido.detalles.filter(d => d.estado === 'LISTO_PARA_ENTREGAR');
    
    if (todosEntregados) {
      console.log(`✅ Todos los items de la mesa ${mesa.numeroMesa} están entregados`);
    } else if (itemsListos.length > 0) {
      console.log(`🍽️ Hay ${itemsListos.length} items listos para entregar en mesa ${mesa.numeroMesa}`);
      
      const itemsNombres = itemsListos.map(d => `${d.cantidad}x ${d.nombreItem}`).join(', ');
      
      // Agregar notificación al sistema
      this.notificationService.addNotification({
        tipo: 'ITEMS_LISTOS',
        mensaje: `Mesa ${mesa.numeroMesa}: ${itemsNombres}`,
        datos: {
          idPedido: pedido.idPedido,
          idMesa: mesa.idMesa,
          numeroMesa: mesa.numeroMesa,
          itemsListos: itemsListos
        },
        timestamp: new Date().toISOString()
      });
      
      // Notificación del navegador si está permitido
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`🍽️ Items Listos - Mesa ${mesa.numeroMesa}`, {
          body: itemsNombres,
          icon: 'assets/iconos/cocina.png',
          tag: `mesa-${mesa.idMesa}`,
          requireInteraction: true // Mantener la notificación hasta que el usuario la cierre
        });
      } else if ('Notification' in window && Notification.permission === 'default') {
        // Solicitar permiso si aún no se ha pedido
        Notification.requestPermission();
      }
    }
  }

  filtrarMesas(): void {
    const busqueda = this.busquedaMesa.toLowerCase().trim();
    if (!busqueda) {
      this.mesasFiltradas = [...this.mesasDisponibles];
    } else {
      this.mesasFiltradas = this.mesasDisponibles.filter(mesa =>
        mesa.numeroMesa.toLowerCase().includes(busqueda) ||
        mesa.idMesa.toString().includes(busqueda)
      );
    }
  }

  // ═══════════════════════════════════════════════════════════
  // GESTIÓN DE PISOS
  // ═══════════════════════════════════════════════════════════

  cambiarPiso(numeroPiso: number): void {
    this.pisoActual = numeroPiso;
    this.resetearZoomYPan();
  }

  get pisoSeleccionado(): Piso {
    return this.pisos.find(p => p.numero === this.pisoActual) || this.pisos[0];
  }

  get mesasDelPisoActual(): MesaEnPlano[] {
    return this.mesasEnPlano.filter(m => m.piso === this.pisoActual);
  }

  contarMesasPiso(piso: number): number {
    return this.mesasEnPlano.filter(m => m.piso === piso).length;
  }

  // ═══════════════════════════════════════════════════════════
  // ZOOM Y PAN
  // ═══════════════════════════════════════════════════════════

  aplicarZoom(delta: number): void {
    const nuevaEscala = this.escalaZoom + delta;
    if (nuevaEscala >= 0.5 && nuevaEscala <= 3) {
      this.escalaZoom = nuevaEscala;
    }
  }

  zoomIn(): void {
    this.aplicarZoom(0.2);
  }

  zoomOut(): void {
    this.aplicarZoom(-0.2);
  }

  resetearZoomYPan(): void {
    this.escalaZoom = 1;
    this.panX = 0;
    this.panY = 0;
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.1 : 0.1;
    this.aplicarZoom(delta);
  }

  onMouseDown(event: MouseEvent): void {
    // Permitir pan con click izquierdo cuando NO se hace click en una mesa
    const target = event.target as HTMLElement;
    const isMesaClick = target.closest('.mesa-circulo');
    
    if (!isMesaClick && (event.button === 0 || event.button === 1)) {
      this.isPanning = true;
      this.lastPanPosition = { x: event.clientX, y: event.clientY };
      event.preventDefault();
    }
  }

  onMouseMove(event: MouseEvent): void {
    if (this.isPanning) {
      const deltaX = event.clientX - this.lastPanPosition.x;
      const deltaY = event.clientY - this.lastPanPosition.y;
      this.panX += deltaX;
      this.panY += deltaY;
      this.lastPanPosition = { x: event.clientX, y: event.clientY };
      event.preventDefault();
    }
  }

  onMouseUp(): void {
    this.isPanning = false;
  }

  // ═══════════════════════════════════════════════════════════
  // SOPORTE TÁCTIL PARA MOBILE (Pan y Zoom)
  // ═══════════════════════════════════════════════════════════

  onTouchStart(event: TouchEvent): void {
    const target = event.target as HTMLElement;
    const isMesaClick = target.closest('.mesa-circulo');
    
    if (!isMesaClick) {
      if (event.touches.length === 1) {
        // Un dedo: pan
        this.isPanning = true;
        this.lastPanPosition = { 
          x: event.touches[0].clientX, 
          y: event.touches[0].clientY 
        };
        event.preventDefault();
      } else if (event.touches.length === 2) {
        // Dos dedos: zoom (pinch)
        this.isPanning = false;
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        this.lastPinchDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
      }
    }
  }

  private lastPinchDistance: number = 0;

  onTouchMove(event: TouchEvent): void {
    if (event.touches.length === 1 && this.isPanning) {
      // Pan con un dedo
      const deltaX = event.touches[0].clientX - this.lastPanPosition.x;
      const deltaY = event.touches[0].clientY - this.lastPanPosition.y;
      this.panX += deltaX;
      this.panY += deltaY;
      this.lastPanPosition = { 
        x: event.touches[0].clientX, 
        y: event.touches[0].clientY 
      };
      event.preventDefault();
    } else if (event.touches.length === 2) {
      // Zoom con dos dedos (pinch)
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const currentDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      if (this.lastPinchDistance > 0) {
        const delta = (currentDistance - this.lastPinchDistance) * 0.01;
        this.aplicarZoom(delta);
      }

      this.lastPinchDistance = currentDistance;
      event.preventDefault();
    }
  }

  onTouchEnd(event: TouchEvent): void {
    if (event.touches.length === 0) {
      this.isPanning = false;
      this.lastPinchDistance = 0;
    } else if (event.touches.length === 1) {
      // Si queda un dedo, reiniciar pan
      this.lastPanPosition = { 
        x: event.touches[0].clientX, 
        y: event.touches[0].clientY 
      };
    }
  }

  get transformStyle(): string {
    return `translate(${this.panX}px, ${this.panY}px) scale(${this.escalaZoom})`;
  }

  // ═══════════════════════════════════════════════════════════
  // INTERACCIONES CON MESAS
  // ═══════════════════════════════════════════════════════════

  inicializarInteracciones(): void {
    // Las interacciones de drag se manejan con HTML5 drag & drop
    // Ver métodos onDrag* para la implementación
  }

  habilitarDragMesas(): void {
    // Controlado por atributos draggable en el HTML
  }

  // ═══════════════════════════════════════════════════════════
  // DRAG DESDE PANEL LATERAL
  // ═══════════════════════════════════════════════════════════

  onDragStartPanel(event: DragEvent, mesa: GetMesaDto): void {
    if (!this.modoConfiguracion) return;
    
    this.mesaArrastrandoDesdePanel = mesa;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'copy';
      event.dataTransfer.setData('text/plain', mesa.idMesa.toString());
    }
  }

  onDragOverMapa(event: DragEvent): void {
    if (this.modoConfiguracion && this.mesaArrastrandoDesdePanel) {
      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'copy';
      }

      // Calcular posición del preview considerando el transform del wrapper
      const mapaElement = event.currentTarget as HTMLElement;
      const wrapperElement = mapaElement.querySelector('.mapa-wrapper') as HTMLElement;
      
      if (wrapperElement) {
        const wrapperRect = wrapperElement.getBoundingClientRect();
        
        // Posición relativa al wrapper transformado
        this.previewMesaPosition = {
          x: (event.clientX - wrapperRect.left) / this.escalaZoom,
          y: (event.clientY - wrapperRect.top) / this.escalaZoom
        };
      }
    }
  }

  onDropEnMapa(event: DragEvent): void {
    event.preventDefault();
    
    if (!this.modoConfiguracion || !this.mesaArrastrandoDesdePanel) return;

    // Usar la misma lógica que el preview para consistencia
    const mapaElement = event.currentTarget as HTMLElement;
    const wrapperElement = mapaElement.querySelector('.mapa-wrapper') as HTMLElement;
    
    if (wrapperElement) {
      const wrapperRect = wrapperElement.getBoundingClientRect();
      
      // Calcular posición considerando zoom
      let x = (event.clientX - wrapperRect.left) / this.escalaZoom;
      let y = (event.clientY - wrapperRect.top) / this.escalaZoom;

      // Dividir por escala del plano para obtener coordenadas originales
      x = x / this.escalaPlano;
      y = y / this.escalaPlano;

      console.log('💾 Guardando mesa en posición original:', { x, y, escalaPlano: this.escalaPlano });

      this.vincularMesaEnPosicion(this.mesaArrastrandoDesdePanel, x, y);
    }

    this.mesaArrastrandoDesdePanel = null;
    this.previewMesaPosition = null;
  }

  onDragLeaveMapa(): void {
    this.previewMesaPosition = null;
  }

  vincularMesaEnPosicion(mesa: GetMesaDto, x: number, y: number): void {
    // Verificar si ya está vinculada
    const yaVinculada = this.mesasEnPlano.find(m => m.idMesa === mesa.idMesa);
    if (yaVinculada) {
      this.alertService.showError('Mesa Duplicada', 'Esta mesa ya está vinculada en el plano');
      return;
    }

    // ✅ Llamar al backend para guardar la posición
    this.mesaService.actualizarPosicionMesa(mesa.idMesa, x, y, this.pisoActual).subscribe({
      next: (mesaActualizada) => {
        const mesaEnPlano: MesaEnPlano = {
          ...mesaActualizada,
          posX: x,
          posY: y,
          piso: this.pisoActual
        };

        this.mesasEnPlano.push(mesaEnPlano);
        this.alertService.showSuccess('Mesa Vinculada', `Mesa ${mesa.numeroMesa} vinculada correctamente`);
      },
      error: (error) => {
        console.error('Error al vincular mesa:', error);
        this.alertService.showError('Error al Vincular', 'No se pudo vincular la mesa al plano');
      }
    });
  }

  guardarPosicionMesa(idMesa: number, x: number, y: number): void {
    const mesa = this.mesasEnPlano.find(m => m.idMesa === idMesa);
    if (mesa) {
      // Actualizar localmente primero para feedback inmediato
      mesa.posX = x;
      mesa.posY = y;
      
      // ✅ Guardar en el backend
      this.mesaService.actualizarPosicionMesa(idMesa, x, y, this.pisoActual).subscribe({
        next: (mesaActualizada) => {
          console.log('Posición actualizada en BD:', mesaActualizada);
        },
        error: (error) => {
          console.error('Error al actualizar posición:', error);
          this.alertService.showError('Error', 'No se pudo guardar la posición de la mesa');
        }
      });
    }
  }

  // ═══════════════════════════════════════════════════════════
  // MENÚ CONTEXTUAL
  // ═══════════════════════════════════════════════════════════

  onClickMesa(event: MouseEvent, mesa: MesaEnPlano): void {
    event.preventDefault();
    event.stopPropagation();

    // Calcular posición del menú ajustada a la pantalla
    const menuWidth = 250; // Ancho aproximado del menú
    const menuHeight = 400; // Alto aproximado del menú
    const padding = 10; // Espacio desde el borde

    let x = event.clientX;
    let y = event.clientY;

    // Ajustar X si se sale por la derecha
    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - padding;
    }

    // Ajustar Y si se sale por abajo
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - padding;
    }

    // Ajustar X si se sale por la izquierda
    if (x < padding) {
      x = padding;
    }

    // Ajustar Y si se sale por arriba
    if (y < padding) {
      y = padding;
    }

    this.menuContextual = {
      visible: true,
      x: x,
      y: y,
      mesa: mesa
    };
  }

  cerrarMenuContextual(event?: MouseEvent | TouchEvent): void {
    // Si el evento viene del menú contextual mismo, no hacer nada
    if (event) {
      const target = event.target as HTMLElement;
      if (target.closest('.menu-contextual')) {
        return;
      }
    }
    
    this.menuContextual.visible = false;
    this.menuContextual.mesa = null;
  }

  cambiarEstadoMesa(nuevoEstado: EstadoMesa): void {
    if (!this.menuContextual.mesa) return;

    const mesa = this.menuContextual.mesa;
    mesa.estadoMesa = nuevoEstado;

    this.mesaService.cambiarEstadoMesa(mesa).subscribe({
      next: () => {
        this.alertService.showSuccess(`Estado de ${mesa.numeroMesa} cambiado a ${nuevoEstado}`);
        this.cerrarMenuContextual();
      },
      error: (error) => {
        console.error('Error al cambiar estado:', error);
        this.alertService.showError('Error al cambiar el estado de la mesa');
      }
    });
  }

  desvincularMesa(): void {
    if (!this.menuContextual.mesa) return;

    const mesa = this.menuContextual.mesa;
    
    this.mesaService.desvincularMesaDelPlano(mesa.idMesa).subscribe({
      next: () => {
        this.mesasEnPlano = this.mesasEnPlano.filter(m => m.idMesa !== mesa.idMesa);
        this.alertService.showSuccess(`Mesa ${mesa.numeroMesa} desvinculada del plano`);
        this.cerrarMenuContextual();
      },
      error: (error) => {
        console.error('Error al desvincular mesa:', error);
        this.alertService.showError('Error al desvincular la mesa');
      }
    });
  }

  abrirModalPedido(): void {
    if (!this.menuContextual.mesa) return;

    const modalRef = this.modalService.open(PedidoModalComponent, {
      size: 'xl',
      backdrop: 'static'
    });

    // ✅ Usar el método getUserId() mejorado en lugar de acceso directo
    const userId = this.authService.getUserId();
    modalRef.componentInstance.mesaSeleccionada = this.menuContextual.mesa;
    modalRef.componentInstance.idMozoLogueado = userId;

    modalRef.result.then(
      (result) => {
        if (result) {
          this.alertService.showSuccess('Pedido Creado', 'Pedido creado exitosamente');
          // Cambiar estado de la mesa a OCUPADA
          this.cambiarEstadoMesa(EstadoMesa.OCUPADA);
          // ✅ Recargar mesas para actualizar el plano
          this.cargarMesasEnPlano();
        }
      },
      () => {
        // Modal cerrado sin acción
      }
    );

    this.cerrarMenuContextual();
  }

  // ✅ Ver pedido activo de la mesa
  verPedidoMesa(): void {
    if (!this.menuContextual.mesa) return;

    const idMesa = this.menuContextual.mesa.idMesa;
    
    // Obtener el pedido activo de la mesa
    this.pedidoService.obtenerPedidoPorMesa(idMesa).subscribe({
      next: (pedido) => {
        console.log('✅ Pedido obtenido:', pedido);
        
        const modalRef = this.modalService.open(PedidoModalComponent, {
          size: 'xl',
          backdrop: 'static'
        });

        // Pasar datos al modal
        modalRef.componentInstance.isEditMode = true;
        modalRef.componentInstance.pedidoData = pedido;
        modalRef.componentInstance.mesaSeleccionada = this.menuContextual.mesa;
        modalRef.componentInstance.soloLectura = false; // Permitir edición y cambios de estado

        modalRef.result.then(
          (result) => {
            if (result) {
              console.log('✅ Modal cerrado con resultado:', result);
              // Recargar mesas para actualizar estados
              this.cargarMesasEnPlano();
              
              if (result.accion === 'finalizado') {
                this.alertService.showSuccess('Pedido Finalizado', 'El pedido ha sido finalizado exitosamente');
                // Cambiar estado de la mesa a DISPONIBLE
                this.cambiarEstadoMesa(EstadoMesa.DISPONIBLE);
              } else if (result.accion === 'actualizado') {
                this.alertService.showSuccess('Pedido Actualizado', 'Se han agregado items al pedido');
              }
            }
          },
          () => {
            // Modal cerrado sin acción
            console.log('Modal cancelado');
          }
        );
      },
      error: (error) => {
        console.error('❌ Error al obtener pedido:', error);
        this.alertService.showError('No se encontró pedido activo para esta mesa');
      } 
    });

    this.cerrarMenuContextual();
  }

  // ═══════════════════════════════════════════════════════════
  // UTILIDADES
  // ═══════════════════════════════════════════════════════════

  estaVinculada(mesa: GetMesaDto): boolean {
    return this.mesasEnPlano.some(m => m.idMesa === mesa.idMesa);
  }

  // ✅ Función para formatear estados sin guiones bajos
  formatearEstado(estado: string): string {
    return estado.replace(/_/g, ' ');
  }
}

