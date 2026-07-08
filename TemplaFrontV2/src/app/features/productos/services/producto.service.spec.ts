import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProductoService } from './producto.service';
import { ProductoDTO, TipoProducto, UnidadMedida, PostProductoDTO, FiltroProducto } from '../models/producto.model';
import { Page } from '../../../core/models/page.model';

describe('ProductoService', () => {
  let service: ProductoService;
  let httpMock: HttpTestingController;

  const mockPage: Page<ProductoDTO> = {
    content: [
      { id: 1, nombre: 'Coca Cola', precio: 1500, stockActual: 50, stockMinimo: 10, stockMaximo: 200, tipo: TipoProducto.BEBIDA, unidadMedida: UnidadMedida.UNIDAD, activo: true },
      { id: 2, nombre: 'Harina', precio: 800, stockActual: 100, stockMinimo: 20, stockMaximo: 500, tipo: TipoProducto.INSUMO, unidadMedida: UnidadMedida.KILOGRAMO, activo: true },
    ],
    totalElements: 2,
    totalPages: 1,
    number: 0,
    size: 10,
    first: true,
    last: true,
    empty: false,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ProductoService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(ProductoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ── loadProductos (initial, no filters) ──

  it('should load products via GET /filtrar with default pagination and update signals', () => {
    service.loadProductos();

    const req = httpMock.expectOne(r => r.url.includes('/api/producto/filtrar'));
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('10');
    expect(req.request.params.get('activo')).toBe('TODOS');
    req.flush(mockPage);

    expect(service.productos().length).toBe(2);
    expect(service.productos()[0].nombre).toBe('Coca Cola');
    expect(service.totalElements()).toBe(2);
    expect(service.totalPages()).toBe(1);
    expect(service.currentPage()).toBe(0);
    expect(service.pageSize()).toBe(10);
    expect(service.isLoading()).toBe(false);
  });

  it('should set loading state while loading', () => {
    service.loadProductos();

    expect(service.isLoading()).toBe(true);

    const req = httpMock.expectOne(r => r.url.includes('/api/producto/filtrar'));
    req.flush(mockPage);

    expect(service.isLoading()).toBe(false);
  });

  it('should handle empty page from server', () => {
    const emptyPage: Page<ProductoDTO> = {
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: 0,
      size: 10,
      first: true,
      last: true,
      empty: true,
    };

    service.loadProductos();
    const req = httpMock.expectOne(r => r.url.includes('/api/producto/filtrar'));
    req.flush(emptyPage);

    expect(service.productos()).toEqual([]);
    expect(service.totalElements()).toBe(0);
    expect(service.totalPages()).toBe(0);
  });

  // ── filtrar (server-side — HTTP call with params) ──

  it('should send filter params via GET and reset to page 0', () => {
    // First load initial data
    service.loadProductos();
    httpMock.expectOne(r => r.url.includes('/api/producto/filtrar')).flush(mockPage);

    // Now filter
    service.filtrar({ busqueda: 'coca', tipo: TipoProducto.BEBIDA, activo: 'ACTIVOS' });

    const req = httpMock.expectOne(r => r.url.includes('/producto/filtrar') && r.params.has('buscar'));
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('buscar')).toBe('coca');
    expect(req.request.params.get('tipoProducto')).toBe('BEBIDA');
    expect(req.request.params.get('activo')).toBe('ACTIVOS');
    expect(req.request.params.get('page')).toBe('0'); // resets to page 0
    req.flush(mockPage);

    expect(service.currentPage()).toBe(0);
  });

  it('should filter by tipo only', () => {
    service.filtrar({ tipo: TipoProducto.INSUMO });

    const req = httpMock.expectOne(r => r.url.includes('/producto/filtrar'));
    expect(req.request.params.get('tipoProducto')).toBe('INSUMO');
    expect(req.request.params.has('buscar')).toBe(false);
    expect(req.request.params.get('activo')).toBe('TODOS'); // always sent
    req.flush(mockPage);
  });

  it('should not send empty busqueda param', () => {
    service.filtrar({ busqueda: '' });

    const req = httpMock.expectOne(r => r.url.includes('/producto/filtrar'));
    expect(req.request.params.has('buscar')).toBe(false);
    expect(req.request.params.get('activo')).toBe('TODOS');
    req.flush(mockPage);
  });

  // ── irAPagina (server-side — HTTP with page param) ──

  it('should navigate to a specific page via GET', () => {
    service.loadProductos();
    httpMock.expectOne(r => r.url.includes('/api/producto/filtrar')).flush(mockPage);

    service.irAPagina(2);

    const req = httpMock.expectOne(r => r.url.includes('/producto/filtrar'));
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('activo')).toBe('TODOS');
    req.flush({ ...mockPage, number: 2 });

    expect(service.currentPage()).toBe(2);
  });

  // ── crear (POST) ──

  it('should create a product via POST /crear', () => {
    const dto: PostProductoDTO = {
      nombre: 'New Product',
      precio: 2000,
      stockActual: 30,
      stockMinimo: 5,
      tipo: TipoProducto.ACOMPAÑANTE,
      unidadMedida: UnidadMedida.UNIDAD,
    };
    const created: ProductoDTO = {
      id: 3, nombre: 'New Product', precio: 2000, stockActual: 30, stockMinimo: 5, stockMaximo: 100,
      tipo: TipoProducto.ACOMPAÑANTE, unidadMedida: UnidadMedida.UNIDAD,
      activo: true,
    };

    let result: ProductoDTO | undefined;
    service.crear(dto).subscribe((r: ProductoDTO) => result = r);

    const req = httpMock.expectOne('http://localhost:8081/api/producto/crear');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush(created);

    expect(result?.id).toBe(3);
    expect(result?.nombre).toBe('New Product');
  });

  // ── actualizar (PUT) ──

  it('should update a product via PUT /editar/{id}', () => {
    const dto: PostProductoDTO = {
      nombre: 'Updated Product',
      precio: 2500,
      stockActual: 40,
      stockMinimo: 10,
      tipo: TipoProducto.BEBIDA,
      unidadMedida: UnidadMedida.LITRO,
    };
    const updated: ProductoDTO = {
      id: 1, nombre: 'Updated Product', precio: 2500, stockActual: 40, stockMinimo: 10, stockMaximo: 200,
      tipo: TipoProducto.BEBIDA, unidadMedida: UnidadMedida.LITRO,
      activo: true,
    };

    let result: ProductoDTO | undefined;
    service.actualizar(1, dto).subscribe((r: ProductoDTO) => result = r);

    const req = httpMock.expectOne('http://localhost:8081/api/producto/editar/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(dto);
    req.flush(updated);

    expect(result?.nombre).toBe('Updated Product');
  });

  // ── eliminar (DELETE) ──

  it('should delete a product via DELETE /eliminar/{id}', () => {
    let completed = false;
    service.eliminar(1).subscribe(() => completed = true);

    const req = httpMock.expectOne('http://localhost:8081/api/producto/eliminar/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    expect(completed).toBe(true);
  });

  // ── Helper: getUnidadMedidaCorta ──

  it('should return short unit for KILOGRAMO', () => {
    expect(service.getUnidadMedidaCorta('KILOGRAMO')).toBe('kg');
  });

  it('should return short unit for LITRO', () => {
    expect(service.getUnidadMedidaCorta('LITRO')).toBe('lt');
  });

  it('should return short unit for GRAMO', () => {
    expect(service.getUnidadMedidaCorta('GRAMO')).toBe('g');
  });

  it('should return short unit for UNIDAD', () => {
    expect(service.getUnidadMedidaCorta('UNIDAD')).toBe('u');
  });

  it('should return the input itself for unknown units', () => {
    expect(service.getUnidadMedidaCorta('CAJA')).toBe('CAJA');
  });

  // ── Helper: getStockClass ──

  it('should return "text-red-600" when stock <= min/2', () => {
    expect(service.getStockClass(3, 10)).toBe('text-red-600');
  });

  it('should return "text-amber-500" when stock <= min but > min/2', () => {
    expect(service.getStockClass(7, 10)).toBe('text-amber-500');
  });

  it('should return "text-green-600" when stock > min', () => {
    expect(service.getStockClass(15, 10)).toBe('text-green-600');
  });

  it('should return "text-red-600" when stock equals min/2', () => {
    expect(service.getStockClass(5, 10)).toBe('text-red-600');
  });
});
