import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProductoListComponent } from './components/producto-list/producto-list';
import { ProductoService } from './services/producto.service';
import { PostProductoDTO, TipoProducto, UnidadMedida } from './models/producto.model';
import { Page } from '../../core/models/page.model';
import Swal from 'sweetalert2';

describe('Productos Integration — list + modal + service flow', () => {
  let fixture: any;
  let component: ProductoListComponent;
  let service: ProductoService;
  let httpMock: HttpTestingController;

  const mockPage: Page<any> = {
    content: [
      { id: 1, nombre: 'Coca Cola', precio: 1500, stockActual: 50, stockMinimo: 10, stockMaximo: 200, tipo: TipoProducto.BEBIDA, unidadMedida: UnidadMedida.UNIDAD, activo: true },
    ],
    totalElements: 1,
    totalPages: 1,
    number: 0,
    size: 10,
    first: true,
    last: true,
    empty: false,
  };

  const newProducto: PostProductoDTO = {
    nombre: 'Nuevo Producto',
    precio: 2500,
    stockActual: 100,
    stockMinimo: 5,
    tipo: TipoProducto.INSUMO,
    unidadMedida: UnidadMedida.KILOGRAMO,
  };

  beforeEach(async () => {
    // Mock Swal.fire to avoid actual dialog
    vi.spyOn(Swal, 'fire').mockResolvedValue({ isConfirmed: true, isDenied: false, isDismissed: false } as any);

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

  const mockStats = { total: 1, activos: 1, inactivos: 0, insumos: 0, acompanantes: 0, bebidas: 1, stockCritico: 0, stockBajo: 0, stockSaludable: 1, valorInventario: 1500 };

  function initComponent(): void {
    fixture = TestBed.createComponent(ProductoListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    // Flush initial load
    httpMock.expectOne(r => r.url.includes('/api/producto/filtrar')).flush(mockPage);
    // Flush initial stats
    httpMock.expectOne(r => r.url.includes('/api/producto/stats')).flush(mockStats);
    fixture.detectChanges();
  }

  it('should load products and open modal, then save a new product via HTTP', () => {
    initComponent();

    // Initially the modal is hidden and products are loaded
    expect((component as any).modalOpen()).toBe(false);
    expect(service.productos().length).toBe(1);

    // Open the create modal
    (component as any).openNewProductModal();
    fixture.detectChanges();
    expect((component as any).modalOpen()).toBe(true);

    // Submit the save action
    (component as any).onModalSave(newProducto);
    fixture.detectChanges();

    // Expect a POST request to /api/producto/crear
    const postReq = httpMock.expectOne('http://localhost:8081/api/producto/crear');
    expect(postReq.request.method).toBe('POST');
    expect(postReq.request.body).toMatchObject({
      nombre: 'Nuevo Producto',
      precio: 2500,
    });

    // Respond to the POST
    const createdProducto = { id: 99, ...newProducto, activo: true };
    postReq.flush(createdProducto);

    // The onModalSave callback calls loadProductos() and loadStats()
    fixture.detectChanges();
    const getReq = httpMock.expectOne(r => r.url.includes('/api/producto/filtrar'));
    getReq.flush(mockPage);
    const statsReq2 = httpMock.expectOne(r => r.url.includes('/api/producto/stats'));
    statsReq2.flush(mockStats);
    fixture.detectChanges();

    // Verify the success toast was shown
    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({ icon: 'success', title: 'Created' }),
    );

    // Modal should be closed
    expect((component as any).modalOpen()).toBe(false);
  });

  it('should edit an existing product via HTTP', () => {
    initComponent();

    // Open edit modal with the first product
    const existingProduct = mockPage.content[0];
    (component as any).openEditProductModal(existingProduct);
    fixture.detectChanges();
    expect((component as any).modalOpen()).toBe(true);
    expect((component as any).editProducto()).toEqual(existingProduct);

    // Submit update
    const updateData: PostProductoDTO = {
      nombre: 'Coca Cola Editada',
      precio: 1800,
      stockActual: 40,
      stockMinimo: 10,
      tipo: TipoProducto.BEBIDA,
      unidadMedida: UnidadMedida.UNIDAD,
    };
    (component as any).onModalSave(updateData);
    fixture.detectChanges();

    // Expect PUT request
    const putReq = httpMock.expectOne('http://localhost:8081/api/producto/editar/1');
    expect(putReq.request.method).toBe('PUT');
    expect(putReq.request.body.nombre).toBe('Coca Cola Editada');

    // Respond
    const updated = { id: 1, ...updateData, activo: true };
    putReq.flush(updated);

    // Subsequent loadProductos + loadStats
    fixture.detectChanges();
    const getReq = httpMock.expectOne(r => r.url.includes('/api/producto/filtrar'));
    getReq.flush(mockPage);
    const statsReq = httpMock.expectOne(r => r.url.includes('/api/producto/stats'));
    statsReq.flush(mockStats);
    fixture.detectChanges();

    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({ icon: 'success', title: 'Updated' }),
    );

    expect((component as any).modalOpen()).toBe(false);
  });
});
