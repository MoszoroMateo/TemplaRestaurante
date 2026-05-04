import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { GetMenuDTO, GetProductosMenuDto, PostMenuDTO, PostProductosMenuDto } from '../../models/MenuModel';
import { GetPlatoDto } from '../../models/PlatoModel';
import { ProductoDTO } from '../../models/ProductoModel';
import { MenuService } from '../../../services/menu.service';
import Swal from 'sweetalert2';

export interface ItemMenu {
  id: number;
  nombre: string;
  tipo: 'PLATO' | 'PRODUCTO';
  tipoEspecifico: string; // TipoPlato o TipoProducto
}

@Component({
  selector: 'app-menu-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './menu-modal.component.html',
  styleUrl: './menu-modal.component.css'
})
export class MenuModalComponent implements OnInit {

  productoDummyFijo: ProductoDTO | null = null;
  platoDummyFijo: GetPlatoDto | null = null;

  @Input() menu?: GetMenuDTO;
  @Input() platos: GetPlatoDto[] = [];
  @Input() productos: ProductoDTO[] = [];

  // ✅ Formulario
  menuForm = {
    nombre: '',
    descripcion: '',
    precio: null as number | null,
    disponibleDesde: '',
    disponibleHasta: '',
    productos: [] as PostProductosMenuDto[]
  };

  // ✅ Estado adicional
  activo = true;

  // ✅ Estado del formulario
  esEdicion = false;
  guardando = false;

  // ✅ Tipos de contenido para el menú
  tiposContenido = [
    { valor: 'PLATO', texto: 'Todos los Platos' },
    { valor: 'BEBIDA', texto: 'Bebidas' },
    { valor: 'ACOMPAÑANTE', texto: 'Acompañantes' }
  ];

  // ✅ Items disponibles según el tipo seleccionado
  itemsDisponibles: ItemMenu[] = [];
  
  // ✅ Selecciones actuales
  tipoSeleccionado = '';
  itemSeleccionado: number | null = null;
  itemsAgregados: ItemMenu[] = [];

  constructor(
    public activeModal: NgbActiveModal,
    private menuService: MenuService
  ) {}

  ngOnInit(): void {
  console.log('🚀 Iniciando MenuModalComponent...');
  console.log('¿Es edición?', !!this.menu);
  console.log('Menú recibido:', this.menu);
  console.log('Platos disponibles:', this.platos?.length || 0);
  console.log('Productos disponibles:', this.productos?.length || 0);
  
  this.esEdicion = !!this.menu;
  
  // ✅ BUSCAR DUMMYS FIJOS
  this.buscarDummysFijos();
  
  if (this.esEdicion && this.menu) {
    console.log('📝 Cargando datos para edición...');
    this.cargarDatosMenu();
  } else {
    console.log('✨ Configurando nuevo menú...');
    // Configurar fechas por defecto para nuevo menú
    const hoy = new Date();
    this.menuForm.disponibleDesde = hoy.toISOString().split('T')[0];
    
    const finAno = new Date(hoy.getFullYear(), 11, 31);
    this.menuForm.disponibleHasta = finAno.toISOString().split('T')[0];
  }
  
  console.log('🎯 Estado inicial del modal:');
  console.log('- Items agregados:', this.itemsAgregados);
  console.log('- Formulario productos:', this.menuForm.productos);
}

// ✅ Método para buscar dummies fijos - VERSIÓN ROBUSTA
private buscarDummysFijos(): void {
  console.log('🔍 Buscando elementos dummy para el sistema de menús...');
  console.log('Productos disponibles:', this.productos?.length || 0);
  console.log('Platos disponibles:', this.platos?.length || 0);
  
  // ✅ BUSCAR PRODUCTO DUMMY CON MÚLTIPLES FALLBACKS
  this.productoDummyFijo = null;
  
  if (this.productos && this.productos.length > 0) {
    // ✅ CORRECCIÓN: usar Papas Fritas (ACOMPAÑANTE) como dummy para evitar conflictos
    this.productoDummyFijo = this.productos.find(p => p.tipo === 'ACOMPAÑANTE') || null;
    
    // Fallback: primer producto disponible
    if (!this.productoDummyFijo) {
      this.productoDummyFijo = this.productos[0];
      console.log('🔄 Usando primer producto como dummy:', this.productoDummyFijo?.nombre);
    }
  }

  // ✅ BUSCAR PLATO DUMMY CON FALLBACKS
  this.platoDummyFijo = null;
  
  if (this.platos && this.platos.length > 0) {
    // Adaptado a tu configuración: usar Milanesa (PRINCIPAL) como dummy
    this.platoDummyFijo = this.platos.find(p => p.tipoPlato === 'PRINCIPAL') || null;
    
    // Fallback: primer plato disponible
    if (!this.platoDummyFijo) {
      this.platoDummyFijo = this.platos[0];
      console.log('🔄 Usando primer plato como dummy:', this.platoDummyFijo?.nombre);
    }
  }

  console.log('✅ Elementos dummy finales:');
  console.log('- Producto dummy:', this.productoDummyFijo?.nombre, `(ID: ${this.productoDummyFijo?.id})`);
  console.log('- Plato dummy:', this.platoDummyFijo?.nombre, `(ID: ${this.platoDummyFijo?.idPlato})`);
  
  // ✅ VALIDACIÓN CON MANEJO DE ERRORES MEJORADO
  if (!this.productoDummyFijo || !this.platoDummyFijo) {
    console.error('❌ ADVERTENCIA: No se pudieron encontrar elementos dummy óptimos');
    console.error('Estado del sistema:');
    console.error('- Productos recibidos:', this.productos?.length || 0);
    console.error('- Platos recibidos:', this.platos?.length || 0);
    console.error('- Producto dummy encontrado:', !!this.productoDummyFijo);
    console.error('- Plato dummy encontrado:', !!this.platoDummyFijo);
    
    // Si no hay elementos suficientes, esto podría causar problemas
    if (!this.productos?.length || !this.platos?.length) {
      console.error('💥 PROBLEMA CRÍTICO: No hay suficientes platos o productos en el sistema');
    }
  } else {
    console.log('✅ Sistema de dummies configurado correctamente');
  }
}

  private cargarDatosMenu(): void {
    if (!this.menu) {
      console.log('❌ No hay menú para cargar');
      return;
    }
    
    console.log('📋 Cargando datos del menú:', this.menu.nombre);
    
    this.menuForm = {
      nombre: this.menu.nombre,
      descripcion: this.menu.descripcion || '',
      precio: this.menu.precio,
      disponibleDesde: this.menu.disponibleDesde || '',
      disponibleHasta: this.menu.disponibleHasta || '',
      productos: [...this.menu.productos]
    };
    
    this.activo = this.menu.activo;
    
    console.log('📝 Formulario inicializado:', {
      nombre: this.menuForm.nombre,
      precio: this.menuForm.precio,
      productosCount: this.menuForm.productos.length
    });
    
    // ✅ CARGAR ITEMS EXISTENTES del menú
    console.log('🔄 Iniciando carga de items existentes...');
    this.cargarItemsExistentes();
    
    console.log('✅ Carga de datos completada. Estado final:');
    console.log('- Items para mostrar:', this.itemsAgregados.length);
    console.log('- Productos en formulario:', this.menuForm.productos.length);
  }

  private cargarItemsExistentes(): void {
  if (!this.menu?.productos) return;

  console.log('🔄 Cargando items existentes del menú:', this.menu.nombre);
  console.log('Productos del menú original:', this.menu.productos);
  
  this.itemsAgregados = [];

  this.menu.productos.forEach((item: GetProductosMenuDto, index: number) => {
    console.log(`\n--- Procesando item existente ${index + 1} ---`);
    console.log('Item data:', item);
    
    // ✅ CORRECCIÓN SIMPLE: Cargar según lo que tenga el item
    if (item.idPlato) {
      // ✅ TIENE PLATO - buscar y cargar
      const plato = this.platos.find(p => p.idPlato === item.idPlato);
      if (plato) {
        this.itemsAgregados.push({
          id: plato.idPlato,
          nombre: plato.nombre,
          tipo: 'PLATO',
          tipoEspecifico: plato.tipoPlato
        });
        console.log(`✅ PLATO cargado: ${plato.nombre}`);
      }
    }
    
    if (item.idProducto) {
      // ✅ TIENE PRODUCTO - buscar y cargar
      const producto = this.productos.find(p => p.id === item.idProducto);
      if (producto) {
        this.itemsAgregados.push({
          id: producto.id!,
          nombre: producto.nombre,
          tipo: 'PRODUCTO',
          tipoEspecifico: producto.tipo
        });
        console.log(`✅ PRODUCTO cargado: ${producto.nombre}`);
      }
    }
  });

  console.log('🎯 Items finales cargados para mostrar:', this.itemsAgregados);
}
// ✅ Cuando cambia el tipo seleccionado, cargar items correspondientes
onTipoChange(): void {
  console.log('onTipoChange llamado con:', this.tipoSeleccionado);
  this.itemsDisponibles = [];
  this.itemSeleccionado = null;

  if (!this.tipoSeleccionado) return;

  switch (this.tipoSeleccionado) {
    case 'PLATO':
      console.log('Cargando todos los platos:', this.platos);
      this.itemsDisponibles = this.platos.map(plato => ({
        id: plato.idPlato,
        nombre: plato.nombre,
        tipo: 'PLATO' as const,
        tipoEspecifico: plato.tipoPlato
      }));
      break;

    case 'BEBIDA':
      console.log('Cargando bebidas:', this.productos);
      this.itemsDisponibles = this.productos
        .filter(producto => producto.tipo === 'BEBIDA')
        .map(producto => ({
          id: producto.id!,
          nombre: producto.nombre,
          tipo: 'PRODUCTO' as const,
          tipoEspecifico: producto.tipo
        }));
      break;

    case 'ACOMPAÑANTE':
      console.log('Cargando acompañantes:', this.productos);
      this.itemsDisponibles = this.productos
        .filter(producto => producto.tipo === 'ACOMPAÑANTE')
        .map(producto => ({
          id: producto.id!,
          nombre: producto.nombre,
          tipo: 'PRODUCTO' as const,
          tipoEspecifico: producto.tipo
        }));
      break;
  }
  
  console.log('Items disponibles después del switch:', this.itemsDisponibles);
}



// ✅ Agregar item al menú - SIN DUMMIES
agregarItem(): void {
  console.log('🚀 Iniciando agregarItem...', {
    itemSeleccionado: this.itemSeleccionado,
    tipoSeleccionado: this.tipoSeleccionado
  });
  
  // ✅ Validaciones básicas
  if (!this.itemSeleccionado || !this.tipoSeleccionado) {
    console.log('❌ Faltan datos obligatorios');
    return;
  }

  const item = this.itemsDisponibles.find(i => i.id === Number(this.itemSeleccionado));
  if (!item) {
    console.log('❌ Item no encontrado');
    return;
  }

  console.log('✅ Item seleccionado:', item);

  // ✅ Verificar duplicados
  const yaExiste = this.itemsAgregados.some(i => 
    i.id === item.id && i.tipo === item.tipo
  );
  
  if (yaExiste) {
    Swal.fire({
      title: 'Item duplicado',
      text: 'Este item ya está agregado al menú',
      icon: 'warning',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#f5d76e'
    });
    return;
  }

  // ✅ Agregar a la lista visual
  this.itemsAgregados.push(item);
  console.log('📝 Item agregado a la lista visual');

  // ✅ Crear el elemento para el backend - SIN DUMMIES
  const productoMenu: PostProductosMenuDto = {};

  if (item.tipo === 'PLATO') {
    // ✅ SOLO PLATO: solo idPlato, sin producto dummy
    productoMenu.idPlato = item.id;
    console.log(`📋 PLATO agregado: "${item.nombre}" (ID: ${item.id})`);
    
  } else if (item.tipo === 'PRODUCTO') {
    // ✅ SOLO PRODUCTO: solo idProducto, sin plato dummy
    productoMenu.idProducto = item.id;
    console.log(`🧴 PRODUCTO agregado: "${item.nombre}" (ID: ${item.id})`);
  }
  
  // ✅ Agregar al formulario
  this.menuForm.productos.push(productoMenu);
  console.log('💾 Elemento agregado al formulario:', productoMenu);

  // ✅ Resetear selección
  this.tipoSeleccionado = '';
  this.itemSeleccionado = null;
  this.itemsDisponibles = [];
}
  // ✅ Quitar item del menú
  quitarItem(index: number): void {
    this.itemsAgregados.splice(index, 1);
    this.menuForm.productos.splice(index, 1);
  }

  // ✅ Validar formulario
  esFormularioValido(): boolean {
    const valido = !!(
      this.menuForm.nombre.trim() &&
      this.menuForm.precio != null &&
      this.menuForm.precio > 0 &&
      this.menuForm.disponibleDesde &&
      this.menuForm.productos.length > 0
    );
    
    console.log('Validación del formulario:', {
      nombre: this.menuForm.nombre,
      precio: this.menuForm.precio,
      disponibleDesde: this.menuForm.disponibleDesde,
      productos: this.menuForm.productos,
      valido: valido
    });
    
    return valido;
  }

  // ✅ Limpiar objeto eliminando campos undefined/null/empty
  private limpiarObjetoParaEnvio(obj: any): any {
    const resultado: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined && value !== null && value !== '') {
        resultado[key] = value;
      }
    }
    
    return resultado;
  }

  // ✅ Guardar menú
  onGuardar(): void {
    if (!this.esFormularioValido()) {
      Swal.fire({
        title: 'Formulario incompleto',
        text: 'Por favor complete todos los campos obligatorios',
        icon: 'warning',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#f5d76e'
      });
      return;
    }

    this.guardando = true;

    if (this.esEdicion && this.menu?.id) {
      // Actualizar menú existente - usar GetMenuDTO
      const menuCompleto: GetMenuDTO = {
        id: this.menu.id,
        nombre: this.menuForm.nombre,
        descripcion: this.menuForm.descripcion,
        precio: this.menuForm.precio!,
        disponibleDesde: this.menuForm.disponibleDesde,
        disponibleHasta: this.menuForm.disponibleHasta,
        activo: this.activo,
        productos: this.menuForm.productos
      };
      
      this.menuService.actualizarMenu(menuCompleto).subscribe({
        next: (menuActualizado) => {
          this.guardando = false;
          Swal.fire({
            title: 'Éxito',
            text: 'Menú actualizado correctamente',
            icon: 'success',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#84C473'
          }).then(() => {
            this.activeModal.close({
              action: 'updated',
              menu: menuActualizado
            });
          });
        },
        error: (error) => {
          console.error('Error al actualizar menú:', error);
          this.guardando = false;
          Swal.fire({
            title: 'Error',
            text: 'No se pudo actualizar el menú',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#e74c3c'
          });
        }
      });
    } else {
      // Crear nuevo menú - usar PostMenuDTO (sin activo)
      // Primero limpiar duplicados del formulario
      this.limpiarDuplicados();
      
      const menuBase: PostMenuDTO = {
        nombre: this.menuForm.nombre,
        descripcion: this.menuForm.descripcion || undefined,
        precio: this.menuForm.precio!,
        disponibleDesde: this.menuForm.disponibleDesde || undefined,
        disponibleHasta: this.menuForm.disponibleHasta || undefined,
        productos: this.menuForm.productos
      };
      
      // Limpiar campos vacíos
      const menuParaCrear = this.limpiarObjetoParaEnvio(menuBase);
      
      console.log('Menú base:', menuBase);
      console.log('Menú limpio para envío:', JSON.stringify(menuParaCrear, null, 2));
      
      this.menuService.createMenu(menuParaCrear).subscribe({
        next: (menuCreado) => {
          this.guardando = false;
          Swal.fire({
            title: 'Éxito',
            text: 'Menú creado correctamente',
            icon: 'success',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#84C473'
          }).then(() => {
            this.activeModal.close({
              action: 'created',
              menu: menuCreado
            });
          });
        },
        error: (error) => {
          console.error('Error completo al crear menú:', error);
          console.error('Error status:', error.status);
          console.error('Error message:', error.message);
          console.error('Error body:', error.error);
          
          this.guardando = false;
          
          let mensajeError = 'No se pudo crear el menú';
          if (error.error && error.error.message) {
            mensajeError = error.error.message;
          } else if (error.message) {
            mensajeError = error.message;
          }
          
          Swal.fire({
            title: 'Error',
            text: mensajeError,
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#e74c3c'
          });
        }
      });
    }
  }

  // ✅ Limpiar duplicados del formulario
  private limpiarDuplicados(): void {
    const productosUnicos: PostProductosMenuDto[] = [];
    const yaAgregados = new Set<string>();
    
    this.menuForm.productos.forEach(producto => {
      // Crear una clave única para identificar duplicados
      const clave = `${producto.idPlato || 0}-${producto.idProducto || 0}`;
      
      if (!yaAgregados.has(clave)) {
        yaAgregados.add(clave);
        productosUnicos.push(producto);
      }
    });
    
    console.log('Productos antes de limpiar:', this.menuForm.productos);
    console.log('Productos después de limpiar:', productosUnicos);
    
    this.menuForm.productos = productosUnicos;
  }

  // ✅ Cancelar
  onCancelar(): void {
    this.activeModal.dismiss('cancel');
  }
}