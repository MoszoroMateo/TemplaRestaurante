import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { forkJoin, Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { GetPedidoDto, PostPedidoDto, PostPedidoDetalleDto } from '../../models/PedidoModel';
import { GetMesaDto } from '../../models/MesasModel';
import { GetPlatoDto } from '../../models/PlatoModel';
import { MesaService } from '../../../services/mesa.service';
import { PlatoService } from '../../../services/plato.service';
import { PedidoService } from '../../../services/pedido.service';
import { AuthService } from '../../../services/auth.service';
import { AlertService } from '../../../services/alert.service';
import { MenuService } from '../../../services/menu.service';
import { ProductoService } from '../../../services/producto.service';
import { SseService } from '../../../services/sse.service';
import { NotificationService } from '../../../services/notification.service';
import { GetMenuDTO } from '../../models/MenuModel';
import { ProductoDTO } from '../../models/ProductoModel';

export interface ItemDetalle {
  id: number;
  nombre: string;
  tipo: 'PLATO' | 'MENU' | 'PRODUCTO';
  precio: number;
  cantidad: number;
  estado?: string;
  esNuevo?: boolean; // ✅ Marcar si es un item nuevo agregado en esta sesión
}

@Component({
  selector: 'app-pedido-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './pedido-modal.component.html',
  styleUrl: './pedido-modal.component.css'
})
export class PedidoModalComponent implements OnInit, OnDestroy {
  @Input() isEditMode: boolean = false;
  @Input() pedidoData: GetPedidoDto | null = null;
  @Input() soloLectura: boolean = false;
  @Input() mesaSeleccionada: GetMesaDto | null = null; // ✅ Mesa preseleccionada desde mapa
  @Input() idMozoLogueado: number = 1; // ✅ ID del mozo desde mapa

  pedidoForm!: FormGroup;

  // Listas para los selects
  mesas: GetMesaDto[] = [];
  platos: GetPlatoDto[] = [];
  menus: GetMenuDTO[] = [];
  productos: ProductoDTO[] = [];

  // Tipos de item
  tiposItem = [
    { valor: 'PLATO', texto: 'Plato' },
    { valor: 'MENU', texto: 'Menú' },
    { valor: 'PRODUCTO', texto: 'Producto' }
  ];

  // Items disponibles según el tipo seleccionado
  itemsDisponibles: any[] = [];

  // Selecciones actuales para agregar detalle
  tipoItemSeleccionado = '';
  itemSeleccionado: number | null = null;
  cantidadSeleccionada: number = 1;

  // Items agregados al pedido
  detallesAgregados: ItemDetalle[] = [];

  // Estado
  guardando = false;
  cargandoDatos = true;

  // Suscripciones SSE
  private sseSubscriptions: Subscription[] = [];

  constructor(
    public activeModal: NgbActiveModal,
    private formBuilder: FormBuilder,
    private mesaService: MesaService,
    private platoService: PlatoService,
    private menuService: MenuService,
    private productoService: ProductoService,
    private pedidoService: PedidoService,
    private authService: AuthService,
    private alertService: AlertService,
    private sseService: SseService,
    private notificationService: NotificationService
  ) { }

  ngOnInit() {
    console.log('🔍 Iniciando modal de pedido...');
    
    // ✅ Obtener ID del mozo logueado - priorizar el valor del token sobre el @Input
    this.establecerIdMozoLogueado();
    
    console.log('👤 ID Mozo final asignado:', this.idMozoLogueado);
    console.log('👤 Tipo:', typeof this.idMozoLogueado);
    console.log('🍽️ Mesa preseleccionada:', this.mesaSeleccionada);

    this.inicializarFormulario();
    this.cargarDatosIniciales();

    // ✅ Si hay mesa preseleccionada, setearla en el formulario
    if (this.mesaSeleccionada) {
      this.pedidoForm.patchValue({
        idMesa: this.mesaSeleccionada.idMesa
      });
      // Deshabilitar el campo para que no se pueda cambiar
      this.pedidoForm.get('idMesa')?.disable();
    }

    if (this.soloLectura) {
      this.pedidoForm.disable();
    }

    // Suscribirse a eventos SSE si estamos en modo edición/visualización
    if ((this.isEditMode || this.soloLectura) && this.pedidoData) {
      this.suscribirseAActualizacionesPedido();
    }
  }

  ngOnDestroy(): void {
    // Limpiar suscripciones SSE
    this.sseSubscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Suscribirse a actualizaciones del pedido vía SSE
   */
  private suscribirseAActualizacionesPedido(): void {
    if (!this.pedidoData) return;

    const idPedidoActual = this.pedidoData.idPedido;

    // Asegurarse de que la conexión SSE esté activa
    this.sseService.iniciarConexion('cocina', ['pedido-actualizado']);

    // Suscribirse a actualizaciones de pedidos
    const actualizacionSub = this.sseService.onEvento<GetPedidoDto>('pedido-actualizado').subscribe({
      next: (pedidoActualizado: GetPedidoDto) => {
        // Solo actualizar si es el pedido que estamos viendo
        if (pedidoActualizado.idPedido === idPedidoActual) {
          console.log('🔄 SSE: Pedido actualizado en modal:', pedidoActualizado);
          this.actualizarDatosPedido(pedidoActualizado);
          
          // Notificar al mozo si hay items listos para entregar
          this.verificarItemsListosParaEntregar(pedidoActualizado);
        }
      },
      error: (error: any) => {
        console.error('❌ Error en evento SSE pedido-actualizado:', error);
      }
    });

    this.sseSubscriptions.push(actualizacionSub);
  }

  /**
   * Actualizar los datos del pedido en el modal cuando llega actualización SSE
   */
  private actualizarDatosPedido(pedidoActualizado: GetPedidoDto): void {
    // Si el pedido fue cancelado, cerrar el modal
    if (pedidoActualizado.estado === 'CANCELADO') {
      this.alertService.showInfo('Pedido Cancelado', 'Este pedido ha sido cancelado');
      this.activeModal.close({ accion: 'cancelado', pedido: pedidoActualizado });
      return;
    }
    
    this.pedidoData = pedidoActualizado;
    
    // Actualizar detalles agregados con los nuevos estados
    this.detallesAgregados = pedidoActualizado.detalles.map(detalle => ({
      id: detalle.idPedidoDetalle,
      nombre: detalle.nombreItem,
      tipo: detalle.tipo,
      precio: detalle.precioUnitario,
      cantidad: detalle.cantidad,
      estado: detalle.estado,
      esNuevo: false
    }));

    console.log('✅ Detalles actualizados en modal:', this.detallesAgregados);
  }

  /**
   * Verificar si hay items listos para entregar y notificar al mozo
   */
  private verificarItemsListosParaEntregar(pedido: GetPedidoDto): void {
    const itemsListos = pedido.detalles.filter(d => d.estado === 'LISTO_PARA_ENTREGAR');
    
    if (itemsListos.length > 0) {
      const itemsNombres = itemsListos.map(d => `${d.cantidad}x ${d.nombreItem}`).join(', ');
      
      // Agregar notificación al sistema
      this.notificationService.addNotification({
        tipo: 'ITEMS_LISTOS',
        mensaje: `Mesa ${pedido.numeroMesa}: ${itemsNombres} Listo/s Para entregar.`,
        datos: {
          idPedido: pedido.idPedido,
          numeroMesa: pedido.numeroMesa,
          itemsListos: itemsListos
        },
        timestamp: new Date().toISOString()
      });
      
      // Notificación del navegador si está permitido
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`🍽️ Items Listos - Mesa ${pedido.numeroMesa}`, {
          body: itemsNombres,
          icon: 'assets/iconos/cocina.png',
          tag: `pedido-${pedido.idPedido}` // Para evitar duplicados
        });
      } else if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }

  // ✅ Inicializar formulario reactivo
  inicializarFormulario(): void {
    this.pedidoForm = this.formBuilder.group({
      idMesa: ['', Validators.required]
    });
  }

  // ✅ Cargar datos para los selects
  cargarDatosIniciales(): void {
    this.cargandoDatos = true;
    this.cargarMesas();
    this.cargarPlatos();
    this.cargarProductos();
    this.cargarMenus();
  }

  // ✅ Método para establecer el ID del mozo logueado
  private establecerIdMozoLogueado(): void {
    // Primer intento: obtener desde el token JWT
    const userIdFromToken = this.authService.getUserId();
    
    console.log('🔍 establecerIdMozoLogueado():');
    console.log('  - ID desde token JWT:', userIdFromToken);
    console.log('  - ID desde @Input:', this.idMozoLogueado);
    
    if (userIdFromToken !== null && typeof userIdFromToken === 'number' && userIdFromToken > 0) {
      // Usar el ID del token si es válido
      this.idMozoLogueado = userIdFromToken;
      console.log('✅ Usando ID del token JWT:', this.idMozoLogueado);
    } else if (this.idMozoLogueado && this.idMozoLogueado > 0) {
      // Usar el ID pasado desde el componente padre si el token no funciona
      console.log('⚠️ Token JWT no válido, usando ID del @Input:', this.idMozoLogueado);
    } else {
      // Último recurso: usar ID por defecto y mostrar advertencia
      console.error('❌ PROBLEMA CRÍTICO: No se pudo obtener ID del mozo de ninguna fuente');
      console.error('💡 SOLUCIONES:');
      console.error('   1. Verificar que el backend incluya ID numérico en el JWT');
      console.error('   2. Verificar que el componente padre pase el ID correctamente');
      console.error('   3. Como último recurso se usará ID = 1');
      
      if (!this.idMozoLogueado || this.idMozoLogueado <= 0) {
        this.idMozoLogueado = 1; // Fallback de emergencia
      }
    }
  }

  // ✅ Método para mostrar debug completo del pedido antes de guardar
  private debugPedidoAntesDEGuardar(pedidoDTO: PostPedidoDto, idMesa: number, detallesDTO: PostPedidoDetalleDto[]): void {
    console.log('=================== DEBUG PEDIDO ===================');
    console.log('✅ Pedido completo a guardar:', pedidoDTO);
    console.log('🔍 Debug detallado:');
    console.log('  - ID Mesa:', idMesa);
    console.log('  - ID Mozo (USUARIO LOGUEADO):', pedidoDTO.idMozo);
    console.log('  - Cantidad de items:', detallesDTO.length);
    console.log('  - Detalles:', detallesDTO);
    
    // Mostrar información del token para debug
    const userInfo = this.authService.getUserInfo();
    console.log('🔍 Token JWT info:', userInfo);
    console.log('🔍 getUserId() resultado:', this.authService.getUserId());
    
    // Validación final
    if (pedidoDTO.idMozo && pedidoDTO.idMozo > 0) {
      console.log('✅ ID del mozo válido - El pedido se asociará correctamente al usuario logueado');
    } else {
      console.error('❌ ADVERTENCIA: ID del mozo no válido - Revisar autenticación');
    }
    console.log('==================================================');
  }

  private cargarMesas(): void {
    this.mesaService.getMesasFiltradas(0, 100, '', 'DISPONIBLE').subscribe({
      next: (response) => {
        this.mesas = response.content;
        console.log('✅ Mesas cargadas:', this.mesas.length);
        this.cargasCompletadas.mesas = true;
        this.verificarCargaCompleta();
      },
      error: (error) => {
        console.error('❌ Error cargando mesas:', error);
        this.cargandoDatos = false;
        this.alertService.showError('Error', 'No se pudieron cargar las mesas');
      }
    });
  }

  // ✅ MODIFICAR cargarPlatos (línea ~125)
  private cargarPlatos(): void {
    this.platoService.getPlatosFiltrados(0, 100, '', undefined, 'DISPONIBLES').subscribe({
      next: (response) => {
        this.platos = response.content;
        console.log('✅ Platos cargados:', this.platos.length);
        this.cargasCompletadas.platos = true;
        this.verificarCargaCompleta();
      },
      error: (error) => {
        console.error('❌ Error cargando platos:', error);
        this.cargandoDatos = false;
        this.alertService.showError('Error', 'No se pudieron cargar los platos');
      }
    });
  }

  // ✅ MODIFICAR cargarProductos (línea ~141)
  private cargarProductos(): void {
    this.productoService.obtenerProductosConFiltros({
      page: 0,
      size: 100,
      busqueda: '',
      tipo: undefined,
      activo: true
    }).subscribe({
      next: (response) => {
        this.productos = response.content.filter(
          p => p.tipo === 'BEBIDA' || p.tipo === 'ACOMPAÑANTE'
        );
        console.log('✅ Productos cargados:', this.productos.length);
        this.cargasCompletadas.productos = true;
        this.verificarCargaCompleta();
      },
      error: (error) => {
        console.error('❌ Error cargando productos:', error);
        this.cargandoDatos = false;
        this.alertService.showError('Error', 'No se pudieron cargar los productos');
      }
    });
  }

  private cargarMenus(): void {
    this.menuService.getMenusFiltrados(0, 100, '', 'ACTIVO').subscribe({
      next: (response) => {
        this.menus = response.content;
        console.log('✅ Menús cargados:', this.menus.length);
        this.cargasCompletadas.menus = true;
        this.verificarCargaCompleta();
      },
      error: (error) => {
        console.error('❌ Error cargando menús:', error);
        this.cargandoDatos = false;
        this.alertService.showError('Error', 'No se pudieron cargar los menús');
      }
    });
  }

  private cargasCompletadas = {
    mesas: false,
    platos: false,
    productos: false,
    menus: false
  };

  private verificarCargaCompleta(): void {
    console.log('🔍 Verificando cargas:', this.cargasCompletadas);

    const todosCargados = this.cargasCompletadas.mesas &&
      this.cargasCompletadas.platos &&
      this.cargasCompletadas.productos &&
      this.cargasCompletadas.menus; // ✅ AGREGAR esta línea

    console.log('¿Todos cargados?', todosCargados);

    if (todosCargados) {
      this.cargandoDatos = false;
      console.log('✅ Todos los datos cargados');

      // Si es solo lectura o edición, cargar datos del pedido
      if ((this.isEditMode || this.soloLectura) && this.pedidoData) {
        console.log('📋 Cargando datos del pedido para edición/visualización');
        this.cargarDatosParaEdicion();
      }
    }
  }

  // ✅ Cuando cambia el tipo seleccionado, cargar items correspondientes
  onTipoItemChange(): void {
    console.log('Tipo seleccionado:', this.tipoItemSeleccionado);
    this.itemsDisponibles = [];
    this.itemSeleccionado = null;

    if (!this.tipoItemSeleccionado) return;

    switch (this.tipoItemSeleccionado) {
      case 'PLATO':
        this.itemsDisponibles = this.platos.map(plato => ({
          id: plato.idPlato,
          nombre: plato.nombre,
          precio: plato.precio
        }));
        break;

      case 'MENU':
        this.itemsDisponibles = this.menus.map(menu => ({
          id: menu.id,
          nombre: menu.nombre,
          precio: menu.precio
        }));
        break;

      case 'PRODUCTO':
        this.itemsDisponibles = this.productos.map(producto => ({
          id: producto.id!,
          nombre: producto.nombre,
          precio: producto.precio
        }));
        break;
    }

    console.log('Items disponibles:', this.itemsDisponibles);
  }

  // ✅ Agregar detalle al pedido
  agregarDetalle(): void {
    console.log('Agregar detalle:', {
      tipo: this.tipoItemSeleccionado,
      item: this.itemSeleccionado,
      cantidad: this.cantidadSeleccionada
    });

    if (!this.tipoItemSeleccionado || !this.itemSeleccionado || this.cantidadSeleccionada < 1) {
      this.alertService.showError('Error', 'Complete todos los campos para agregar el detalle');
      return;
    }

    const item = this.itemsDisponibles.find(i => i.id === Number(this.itemSeleccionado));
    if (!item) {
      console.log('Item no encontrado');
      return;
    }

    // Agregar a la lista visual
    this.detallesAgregados.push({
      id: item.id,
      nombre: item.nombre,
      tipo: this.tipoItemSeleccionado as 'PLATO' | 'MENU' | 'PRODUCTO',
      precio: item.precio,
      cantidad: this.cantidadSeleccionada,
      esNuevo: true // ✅ Marcar como nuevo item agregado en esta sesión
    });

    console.log('✅ Detalle agregado. Total detalles:', this.detallesAgregados);

    // Resetear selección
    this.tipoItemSeleccionado = '';
    this.itemSeleccionado = null;
    this.cantidadSeleccionada = 1;
    this.itemsDisponibles = [];
  }

  // ✅ Quitar detalle del pedido (solo para items nuevos sin estado)
  quitarDetalle(index: number): void {
    this.detallesAgregados.splice(index, 1);
  }

  // ✅ Cancelar detalle específico del pedido (para items con estado PENDIENTE)
  cancelarDetalle(idDetalle: number): void {
    if (!this.pedidoData) {
      console.error('No hay pedido cargado');
      return;
    }

    this.alertService.showConfirmation('Confirmar Cancelación', '¿Está seguro que desea cancelar este item?', 'Sí, cancelar').then((result) => {
      if (result.isConfirmed) {
        // ✅ Llamar al servicio para cancelar el detalle específico
        this.guardando = true;
        this.pedidoService.cancelarDetalleEspecifico(this.pedidoData!.idPedido, idDetalle).subscribe({
          next: (response) => {
            console.log('✅ Detalle cancelado:', response);
            this.guardando = false;
            
            // Actualizar los detalles con la respuesta del backend
            this.detallesAgregados = response.detalles.map(detalle => ({
              id: detalle.idPedidoDetalle,
              nombre: detalle.nombreItem,
              tipo: detalle.tipo,
              precio: detalle.precioUnitario,
              cantidad: detalle.cantidad,
              estado: detalle.estado,
              esNuevo: false
            }));
            
            // ✅ Actualizar también pedidoData para mantener sincronizado
            this.pedidoData = response;
            
            this.alertService.showSuccess('Item Cancelado', 'El item ha sido cancelado exitosamente');
          },
          error: (error: any) => {
            console.error('❌ Error al cancelar detalle:', error);
            this.guardando = false;
            this.alertService.showError('Error al Cancelar', error.error?.message || 'Error desconocido');
          }
        });
      }
    });
  }

  // ✅ Calcular total del pedido (excluyendo items cancelados)
  calcularTotal(): number {
    return this.detallesAgregados
      .filter(detalle => detalle.estado !== 'CANCELADO') // Excluir cancelados
      .reduce((total, detalle) => {
        return total + (detalle.precio * detalle.cantidad);
      }, 0);
  }

  // ✅ Cargar datos para edición (agregar items a pedido existente)
  cargarDatosParaEdicion(): void {
    if (!this.pedidoData) return;

    // ✅ Si es modo edición, setear la mesa del pedido (aunque no se muestre)
    if (this.isEditMode) {
      const mesaEncontrada = this.mesas.find(m => m.numeroMesa === this.pedidoData!.numeroMesa);

      if (mesaEncontrada) {
        this.pedidoForm.patchValue({
          idMesa: mesaEncontrada.idMesa
        });
      }
    }

    // ✅ Cargar los detalles existentes (tanto en modo edición como solo lectura)
    if ((this.isEditMode || this.soloLectura) && this.pedidoData.detalles) {
      this.detallesAgregados = this.pedidoData.detalles.map(detalle => ({
        id: detalle.idPedidoDetalle,  // ✅ Usar el ID del detalle para poder identificarlo
        nombre: detalle.nombreItem,
        tipo: detalle.tipo,
        precio: detalle.precioUnitario,
        cantidad: detalle.cantidad,
        estado: detalle.estado,
        esNuevo: false // ✅ Items existentes NO son nuevos
      }));
    }

    console.log(this.soloLectura ? 'Modo visualización' : (this.isEditMode ? 'Modo edición: Agregar items al pedido existente' : 'Modo crear pedido nuevo'));
  }

  // ✅ Validar formulario
  esFormularioValido(): boolean {
    if (this.soloLectura) return false; // No permitir guardar en modo solo lectura

    const tieneDetalles = this.detallesAgregados.length > 0;

    // ✅ Si es modo edición, solo validar que haya detalles
    if (this.isEditMode) {
      return tieneDetalles;
    }

    // ✅ Si es modo crear, validar mesa Y detalles
    // Si la mesa viene preseleccionada, considerar válida
    const mesaValida = this.mesaSeleccionada ? true : this.pedidoForm.valid;
    return mesaValida && tieneDetalles;
  }

  // ✅ Guardar pedido
  onGuardar(): void {
    console.log('🚀 Guardando pedido...');

    if (!this.esFormularioValido()) {
      if (!this.pedidoForm.valid) {
        this.alertService.showError('Error', 'Seleccione una mesa');
      } else if (this.detallesAgregados.length === 0) {
        this.alertService.showError('Error', 'Debe agregar al menos un detalle al pedido');
      }
      return;
    }

    this.guardando = true;

    const formValue = this.pedidoForm.value;

    // ✅ Usar mesaSeleccionada si existe, sino usar el valor del formulario
    const idMesa = this.mesaSeleccionada 
      ? this.mesaSeleccionada.idMesa 
      : parseInt(formValue.idMesa);

    // ✅ Transformar detalles de ItemDetalle a PostPedidoDetalleDto
    // En modo edición: Solo enviar items NUEVOS (esNuevo === true)
    // En modo crear: Enviar TODOS los items
    const itemsAEnviar = this.isEditMode 
      ? this.detallesAgregados.filter(d => d.esNuevo === true)
      : this.detallesAgregados;

    console.log('📋 Items a enviar al backend:', itemsAEnviar.length);
    console.log('📋 Items nuevos:', itemsAEnviar);

    const detallesDTO: PostPedidoDetalleDto[] = itemsAEnviar.map(detalle => ({
      idPlato: detalle.tipo === 'PLATO' ? detalle.id : 0,
      idMenu: detalle.tipo === 'MENU' ? detalle.id : 0,
      idProducto: detalle.tipo === 'PRODUCTO' ? detalle.id : 0,
      cantidad: detalle.cantidad
    }));

    const pedidoDTO: PostPedidoDto = {
      idMesa: idMesa,
      idMozo: this.idMozoLogueado,
      detalles: detallesDTO
    };

    // ✅ Debug completo del pedido antes de enviar
    this.debugPedidoAntesDEGuardar(pedidoDTO, idMesa, detallesDTO);

    // ✅ Validar que el mozo esté asignado
    if (!this.idMozoLogueado || this.idMozoLogueado === 0) {
      this.guardando = false;
      this.alertService.showError(
        'No se pudo identificar al mozo logueado. Por favor, cierre sesión y vuelva a ingresar.',
        'Error de Autenticación'
      );
      console.error('❌ ERROR: idMozoLogueado no válido:', this.idMozoLogueado);
      return;
    }

    // ✅ Llamar al backend para crear o actualizar el pedido
    if (this.isEditMode && this.pedidoData) {
      // Modo edición: actualizar pedido existente
      this.pedidoService.actualizarPedido(this.pedidoData.idPedido, pedidoDTO).subscribe({
        next: (response: GetPedidoDto) => {
          console.log('✅ Pedido actualizado exitosamente:', response);
          console.log(`✅ Pedido #${response.idPedido} actualizado por mozo ID: ${this.idMozoLogueado}`);
          this.guardando = false;
          this.activeModal.close({
            accion: 'actualizado',
            pedido: response
          });
        },
        error: (error: any) => {
          console.error('❌ Error al actualizar pedido:', error);
          this.guardando = false;
          
          // ✅ Manejo mejorado de errores con mensajes específicos
          const errorMsg = (error.error?.message || error.message || 'Error desconocido').replace('Error interno del servidor: ', '');
          
          if (errorMsg.includes('no está disponible') || errorMsg.includes('no tiene stock') || 
              errorMsg.includes('está inactivo') || errorMsg.includes('Stock insuficiente')) {
            Swal.fire({
              title: 'Item no disponible',
              text: errorMsg,
              icon: 'warning',
              confirmButtonText: 'Entendido',
              confirmButtonColor: '#f5d76e'
            });
          } else {
            this.alertService.showError('Error al actualizar el pedido', errorMsg);
          }
        }
      });
    } else {
      this.pedidoService.crearPedido(pedidoDTO).subscribe({
        next: (response: GetPedidoDto) => {
          console.log('✅ Pedido creado exitosamente:', response);
          console.log(`✅ Pedido #${response.idPedido} creado por mozo ID: ${this.idMozoLogueado} (${this.authService.getUsername()})`);
          this.guardando = false;
          this.activeModal.close({
            accion: 'crear',
            pedido: response
          });
        },
        error: (error: any) => {
          console.error('❌ Error al crear pedido:', error);
          this.guardando = false;
          
          // ✅ Manejo mejorado de errores con mensajes específicos
          const errorMsg = (error.error?.message || error.message || 'Error desconocido').replace('Error interno del servidor: ', '');
          
          if (errorMsg.includes('no está disponible') || errorMsg.includes('no tiene stock') || 
              errorMsg.includes('está inactivo') || errorMsg.includes('Stock insuficiente')) {
            Swal.fire({
              title: 'Item no disponible',
              text: errorMsg,
              icon: 'warning',
              confirmButtonText: 'Entendido',
              confirmButtonColor: '#f5d76e'
            });
          } else {
            this.alertService.showError('Error al crear el pedido', errorMsg);
          }
        }
      });
    }
  }

  // ✅ Cancelar
  onCancelar(): void {
    this.activeModal.dismiss('cancel');
  }

  /**
   * ✅ Verificar si hay items con estado LISTO
   */
  hayItemsListos(): boolean {
    return this.detallesAgregados.some(d => d.estado === 'LISTO_PARA_ENTREGAR');
  }

  /**
   * ✅ Entregar todos los items que están LISTO
   */
  entregarItemsListos(): void {
    if (!this.pedidoData) return;

    const itemsListos = this.detallesAgregados.filter(d => d.estado === 'LISTO_PARA_ENTREGAR');
    
    if (itemsListos.length === 0) {
      this.alertService.showInfo('Sin Items Listos', 'No hay items listos para entregar.');
      return;
    }

    const mensaje = `¿Desea entregar ${itemsListos.length} item(s) listo(s)?`;
    this.alertService.showConfirmation('Confirmar Entrega', mensaje, 'Sí, entregar').then((result) => {
      if (result.isConfirmed) {
        this.guardando = true;
        
        // Llamar al backend para marcar como ENTREGADO todos los items LISTO
        this.pedidoService.entregarDetalles(this.pedidoData!.idPedido).subscribe({
          next: (response) => {
            console.log('✅ Items entregados:', response);
            
            // ✅ Actualizar los datos del pedido con la respuesta del backend
            this.pedidoData = response;
            this.detallesAgregados = response.detalles.map(detalle => ({
              id: detalle.idPedidoDetalle,
              nombre: detalle.nombreItem,
              tipo: detalle.tipo,
              precio: detalle.precioUnitario,
              cantidad: detalle.cantidad,
              estado: detalle.estado,
              esNuevo: false
            }));
            
            this.guardando = false;
            this.alertService.showSuccess('Items Entregados', `${itemsListos.length} item(s) entregado(s) exitosamente`);
          },
          error: (error: any) => {
            console.error('❌ Error al entregar items:', error);
            this.guardando = false;
            this.alertService.showError('Error al Entregar', error.error?.message || 'Error desconocido');
          }
        });
      }
    });
  }

  /**
   * ✅ Verificar si todos los detalles están entregados (ignorando cancelados)
   */
  todosPedidosEntregados(): boolean {
    if (this.detallesAgregados.length === 0) return false;
    // Filtrar solo los items que NO están cancelados
    const itemsActivos = this.detallesAgregados.filter(d => d.estado !== 'CANCELADO');
    if (itemsActivos.length === 0) return false;
    return itemsActivos.every(d => d.estado === 'ENTREGADO');
  }

  /**
   * ✅ Verificar si todos los detalles están cancelados
   */
  todosItemsCancelados(): boolean {
    if (this.detallesAgregados.length === 0) return false;
    return this.detallesAgregados.every(d => d.estado === 'CANCELADO');
  }

  /**
   * ✅ Cancelar pedido completo (cuando todos los items están cancelados)
   */
  cancelarPedidoCompleto(): void {
    if (!this.pedidoData) return;

    this.alertService.showConfirmation(
      'Confirmar Cancelación de Pedido', 
      'Todos los items están cancelados. ¿Desea cancelar el pedido completo?', 
      'Sí, cancelar pedido'
    ).then((result) => {
      if (result.isConfirmed) {
        this.guardando = true;
        this.pedidoService.cancelarPedido(this.pedidoData!.idPedido).subscribe({
          next: (response) => {
            console.log('✅ Pedido cancelado:', response);
            this.guardando = false;
            this.activeModal.close({
              accion: 'cancelado',
              pedido: response
            });
          },
          error: (error: any) => {
            console.error('❌ Error al cancelar pedido:', error);
            this.guardando = false;
            this.alertService.showError('Error al Cancelar Pedido', error.error?.message || 'Error desconocido');
          }
        });
      }
    });
  }

  /**
   * ✅ Finalizar pedido completo
   */
  finalizarPedido(): void {
    if (!this.pedidoData) return;

    if (!this.todosPedidosEntregados()) {
      this.alertService.showError('No se Puede Finalizar', 'Aún hay items sin entregar.');
      return;
    }

    this.alertService.showConfirmation('Confirmar Finalización', '¿Está seguro que desea finalizar este pedido?', 'Sí, finalizar').then((result) => {
      if (result.isConfirmed) {
        this.guardando = true;
        this.pedidoService.finalizarPedido(this.pedidoData!.idPedido).subscribe({
          next: (response) => {
            console.log('✅ Pedido finalizado:', response);
            this.guardando = false;
            this.activeModal.close({
              accion: 'finalizado',
              pedido: response
            });
          },
          error: (error: any) => {
            console.error('❌ Error al finalizar pedido:', error);
            this.guardando = false;
            this.alertService.showError('Error al Finalizar', error.error?.message || 'Error desconocido');
          }
        });
      }
    });
  }

  formatearFecha(fechaHora: number[] | string): string {
    if (Array.isArray(fechaHora)) {
      const [year, month, day, hour, minute] = fechaHora;

      const fecha = new Date(year, month - 1, day, hour, minute);

      const dd = String(fecha.getDate()).padStart(2, '0');
      const mm = String(fecha.getMonth() + 1).padStart(2, '0');
      const yyyy = fecha.getFullYear();
      const hh = String(fecha.getHours()).padStart(2, '0');
      const min = String(fecha.getMinutes()).padStart(2, '0');

      return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
    }
    return fechaHora;
  }

  /**
   * ✅ Obtener texto del estado
   */
  getEstadoTexto(estado: string): string {
    const estados: { [key: string]: string } = {
      'ORDENADO': 'Ordenado',
      'EN_PROCESO': 'En Proceso',
      'LISTO_PARA_ENTREGAR': 'Listo',
      'ENTREGADO': 'Entregado',
      'FINALIZADO': 'Finalizado',
      'CANCELADO': 'Cancelado'
    };
    return estados[estado] || estado;
  }

  /**
   * ✅ Obtener clase CSS para el badge del estado
   */
  getEstadoBadgeClass(estado: string): string {
    const clases: { [key: string]: string } = {
      'ORDENADO': 'badge-warning',
      'EN_PROCESO': 'badge-info',
      'LISTO_PARA_ENTREGAR': 'badge-primary',
      'ENTREGADO': 'badge-success',
      'FINALIZADO': 'badge-secondary',
      'CANCELADO': 'badge-danger'
    };
    return clases[estado] || 'badge-secondary';
  }


  getEstadoDetalleTexto(estado: string): string {
    const estados: { [key: string]: string } = {
      'PENDIENTE': 'Pendiente',
      'EN_PREPARACION': 'En Preparación',
      'LISTO': 'Listo',
      'ENTREGADO': 'Entregado',
      'CANCELADO': 'Cancelado'
    };
    return estados[estado] || estado;
  }

  /**
   * ✅ Obtener clase CSS para el estado del detalle
   */
  getEstadoDetalleClass(estado: string): string {
    const clases: { [key: string]: string } = {
      'PENDIENTE': 'estado-pendiente',
      'EN_PREPARACION': 'estado-en-preparacion',
      'LISTO': 'estado-listo',
      'ENTREGADO': 'estado-entregado',
      'CANCELADO': 'estado-cancelado'
    };
    return clases[estado] || 'estado-pendiente';
  }

  /**
   * ✅ Obtener color para el badge de estado de mesa
   */
  getColorEstado(estado: string): string {
    const colores: { [key: string]: string } = {
      'DISPONIBLE': '#84C473',        // templa-green
      'OCUPADA': '#e2e3e5',           // templa-bg-ocupada (gris pastel)
      'RESERVADA': '#d2a46d',         // templa-gold
      'FUERA_SERVICIO': '#C47373'     // templa-red
    };
    return colores[estado] || '#e2e3e5';
  }
}