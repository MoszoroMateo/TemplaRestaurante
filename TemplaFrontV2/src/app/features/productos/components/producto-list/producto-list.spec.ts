import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProductoListComponent } from './producto-list';
import { ProductoService } from '../../services/producto.service';
import { ProductoDTO, TipoProducto, UnidadMedida } from '../../models/producto.model';
import { Page } from '../../../../core/models/page.model';

describe('ProductoListComponent', () => {
  let component: ProductoListComponent;
  let fixture: any;
  let service: ProductoService;
  let httpMock: HttpTestingController;

  const mockPage: Page<ProductoDTO> = {
    content: [
      { id: 1, nombre: 'Coca Cola', precio: 1500, stockActual: 50, stockMinimo: 10, stockMaximo: 200, tipo: TipoProducto.BEBIDA, unidadMedida: UnidadMedida.UNIDAD, activo: true },
      { id: 2, nombre: 'Harina', precio: 800, stockActual: 100, stockMinimo: 20, stockMaximo: 500, tipo: TipoProducto.INSUMO, unidadMedida: UnidadMedida.KILOGRAMO, activo: true },
      { id: 3, nombre: 'Pan Frances', precio: 500, stockActual: 3, stockMinimo: 10, stockMaximo: 100, tipo: TipoProducto.ACOMPAÑANTE, unidadMedida: UnidadMedida.UNIDAD, activo: true },
    ],
    totalElements: 3,
    totalPages: 1,
    number: 0,
    size: 10,
    first: true,
    last: true,
    empty: false,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductoListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    service = TestBed.inject(ProductoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  const mockStats = { total: 3, activos: 3, inactivos: 0, insumos: 1, acompanantes: 1, bebidas: 1, stockCritico: 0, stockBajo: 0, stockSaludable: 3, valorInventario: 2800 };

  function createComponent(): void {
    fixture = TestBed.createComponent(ProductoListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    // Flush the initial loadProductos call (now uses /filtrar)
    httpMock.expectOne(r => r.url.includes('/api/producto/filtrar')).flush(mockPage);
    // Flush the initial loadStats call
    httpMock.expectOne(r => r.url.includes('/api/producto/stats')).flush(mockStats);
    fixture.detectChanges();
  }

  // ── Initialization ──

  it('should create and load products on init exposing service signals', () => {
    createComponent();
    expect(component).toBeTruthy();
    expect(service.productos().length).toBe(3);
    expect(service.totalElements()).toBe(3);
  });

  // ── Modal state ──

  it('should open modal in create mode', () => {
    createComponent();
    (component as any).openNewProductModal();
    expect((component as any).modalOpen()).toBe(true);
    expect((component as any).editProducto()).toBeUndefined();
  });

  it('should open modal in edit mode with product data', () => {
    createComponent();
    (component as any).openEditProductModal(mockPage.content[0]);
    expect((component as any).modalOpen()).toBe(true);
    expect((component as any).editProducto()).toEqual(mockPage.content[0]);
  });

  it('should close modal and reset editProducto', () => {
    createComponent();
    (component as any).openEditProductModal(mockPage.content[0]);
    (component as any).closeModal();
    expect((component as any).modalOpen()).toBe(false);
    expect((component as any).editProducto()).toBeUndefined();
  });

  // ── Search ──

  it('should apply filter via service on search change', () => {
    createComponent();
    const filtrarSpy = vi.spyOn(service, 'filtrar');
    (component as any).busqueda = 'coca';
    (component as any).onBusquedaChange();
    expect(filtrarSpy).toHaveBeenCalledWith({ busqueda: 'coca' });
    httpMock.expectOne(req => req.url.includes('/api/producto/filtrar')).flush(mockPage);
  });

  // ── Filter changes ──

  it('should apply tipo filter via service', () => {
    createComponent();
    const filtrarSpy = vi.spyOn(service, 'filtrar');
    (component as any).onTipoFilterChange(TipoProducto.BEBIDA);
    expect(filtrarSpy).toHaveBeenCalledWith({ tipo: TipoProducto.BEBIDA });
    httpMock.expectOne(req => req.url.includes('/api/producto/filtrar')).flush(mockPage);
  });

  it('should reset tipo filter when empty string', () => {
    createComponent();
    const filtrarSpy = vi.spyOn(service, 'filtrar');
    (component as any).onTipoFilterChange('');
    expect(filtrarSpy).toHaveBeenCalledWith({ tipo: undefined });
    httpMock.expectOne(req => req.url.includes('/api/producto/filtrar')).flush(mockPage);
  });

  it('should apply estado filter via service — activos', () => {
    createComponent();
    const filtrarSpy = vi.spyOn(service, 'filtrar');
    (component as any).onEstadoFilterChange('activos');
    expect(filtrarSpy).toHaveBeenCalledWith({ activo: 'ACTIVOS' });
    httpMock.expectOne(req => req.url.includes('/api/producto/filtrar')).flush(mockPage);
  });

  it('should apply estado filter via service — inactivos', () => {
    createComponent();
    const filtrarSpy = vi.spyOn(service, 'filtrar');
    (component as any).onEstadoFilterChange('inactivos');
    expect(filtrarSpy).toHaveBeenCalledWith({ activo: 'INACTIVOS' });
    httpMock.expectOne(req => req.url.includes('/api/producto/filtrar')).flush(mockPage);
  });

  it('should clear estado filter when "todos"', () => {
    createComponent();
    const filtrarSpy = vi.spyOn(service, 'filtrar');
    (component as any).onEstadoFilterChange('todos');
    expect(filtrarSpy).toHaveBeenCalledWith({ activo: 'TODOS' });
    httpMock.expectOne(req => req.url.includes('/api/producto/filtrar')).flush(mockPage);
  });

  // ── Pagination ──

  it('should call irAPagina on page change', () => {
    createComponent();
    const irAPaginaSpy = vi.spyOn(service, 'irAPagina');
    (component as any).irAPagina(2);
    expect(irAPaginaSpy).toHaveBeenCalledWith(2);
    httpMock.expectOne(req => req.url.includes('/api/producto/filtrar')).flush(mockPage);
  });

  // ── Column definitions ──

  it('should have correct column definitions', () => {
    createComponent();
    const cols = (component as any).columns;
    expect(cols.length).toBe(10);
    expect(cols[0].key).toBe('_index');
    expect(cols[1].key).toBe('nombre');
    expect(cols[2].key).toBe('precio');
    expect(cols[3].key).toBe('tipo');
    expect(cols[8].key).toBe('estado');
    expect(cols[9].key).toBe('_actions');
  });

  // ── Badge maps ──

  it('should have badge map for tipo with correct entries', () => {
    createComponent();
    const badgeMaps = (component as any).badgeMaps;
    expect(badgeMaps.tipo.INSUMO).toBeDefined();
    expect(badgeMaps.tipo.ACOMPAÑANTE).toBeDefined();
    expect(badgeMaps.tipo.BEBIDA).toBeDefined();
    expect(badgeMaps.tipo.INSUMO.label).toBe('Supply');
    expect(badgeMaps.tipo.BEBIDA.label).toBe('Beverage');
  });

  it('should have badge map for estado with correct entries', () => {
    createComponent();
    const badgeMaps = (component as any).badgeMaps;
    expect(badgeMaps.estado.activo_true).toBeDefined();
    expect(badgeMaps.estado.activo_false).toBeDefined();
    expect(badgeMaps.estado.activo_true.label).toBe('Active');
    expect(badgeMaps.estado.activo_false.label).toBe('Inactive');
  });

  // ── Cell renderers ──

  it('should format precio with $ prefix and 2 decimals via cell renderer', () => {
    createComponent();
    const renderer = (component as any).cellRenderers.precio;
    const result = renderer(mockPage.content[0]);
    // es-AR locale: dot for thousands, comma for decimals
    expect(result).toBe('$1.500,00');
  });

  it('should format precio with $ prefix for all product types', () => {
    createComponent();
    const renderer = (component as any).cellRenderers.precio;
    const result = renderer(mockPage.content[1]); // Harina is INSUMO, shows price too now
    expect(result).toMatch(/^\$\d/);
  });

  // ── Custom values for badge ──

  it('should resolve estado custom value based on activo boolean', () => {
    createComponent();
    const cv = (component as any).customValues.estado;
    expect(cv(mockPage.content[0])).toBe('activo_true');
    // Create an inactive product
    const inactive = { ...mockPage.content[0], activo: false };
    expect(cv(inactive)).toBe('activo_false');
  });

  // ── Filter options ──

  it('should have correct tipo filter options', () => {
    createComponent();
    const opts = (component as any).tipoFilterOptions;
    expect(opts.length).toBe(4); // All + 3 tipos
    expect(opts[0].value).toBe('');
    expect(opts[0].label).toBe('All');
    expect(opts[1].value).toBe(TipoProducto.INSUMO);
    expect(opts[2].value).toBe(TipoProducto.ACOMPAÑANTE);
    expect(opts[3].value).toBe(TipoProducto.BEBIDA);
  });

  it('should have correct estado filter options', () => {
    createComponent();
    const opts = (component as any).estadoFilterOptions;
    expect(opts.length).toBe(3); // Activos, All, Inactivos
    expect(opts[0].value).toBe('activos');
    expect(opts[1].value).toBe('todos');
    expect(opts[2].value).toBe('inactivos');
  });

  // ── Stock low check helper ──

  it('should detect low stock when stock <= stockMinimo', () => {
    createComponent();
    const result = (component as any).isStockBajo(mockPage.content[2]); // stockActual=3, min=10
    expect(result).toBe(true);
  });

  it('should not detect low stock when stock > stockMinimo', () => {
    createComponent();
    const result = (component as any).isStockBajo(mockPage.content[0]); // stockActual=50, min=10
    expect(result).toBe(false);
  });
});
