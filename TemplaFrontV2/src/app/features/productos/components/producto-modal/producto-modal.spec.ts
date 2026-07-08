import { TestBed } from '@angular/core/testing';
import { ProductoModalComponent } from './producto-modal';
import { TipoProducto, UnidadMedida, ProductoDTO } from '../../models/producto.model';

describe('ProductoModalComponent', () => {
  function createComponent(
    isEditMode = false,
    productoData?: ProductoDTO,
  ): { component: ProductoModalComponent; fixture: any } {
    const fixture = TestBed.createComponent(ProductoModalComponent);
    const component = fixture.componentInstance;

    // Set inputs via componentRef (required for signal-based inputs in Angular 17+)
    fixture.componentRef.setInput('isEditMode', isEditMode);
    fixture.componentRef.setInput('productoData', productoData);
    fixture.detectChanges();

    return { component, fixture };
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductoModalComponent],
    }).compileComponents();
  });

  // ── Form initialization ──

  it('should create the form with required controls', () => {
    const { component } = createComponent();
    expect((component as any).form.contains('nombre')).toBe(true);
    expect((component as any).form.contains('precio')).toBe(true);
    expect((component as any).form.contains('stockActual')).toBe(true);
    expect((component as any).form.contains('stockMinimo')).toBe(true);
    expect((component as any).form.contains('stockMaximo')).toBe(true);
    expect((component as any).form.contains('tipo')).toBe(true);
    expect((component as any).form.contains('unidadMedida')).toBe(true);
  });

  it('should require nombre, tipo, unidadMedida and enforce min validators', () => {
    const { component } = createComponent();
    const form = (component as any).form;

    // Required fields that start empty/null
    expect(form.get('nombre')?.valid).toBe(false);
    expect(form.get('tipo')?.valid).toBe(false);
    expect(form.get('unidadMedida')?.valid).toBe(false);

    // Numeric fields start at 0 (min=0 passes), but negative should fail
    for (const ctrl of ['precio', 'stockActual', 'stockMinimo', 'stockMaximo']) {
      expect(form.get(ctrl)?.valid).toBe(true); // 0 passes min(0)
      form.get(ctrl)?.setValue(-1);
      expect(form.get(ctrl)?.valid).toBe(false);
      form.get(ctrl)?.setValue(5);
      expect(form.get(ctrl)?.valid).toBe(true);
    }

    // Fill all fields -> form becomes valid
    form.patchValue({
      nombre: 'Coca Cola',
      tipo: TipoProducto.BEBIDA,
      unidadMedida: UnidadMedida.UNIDAD,
    });

    expect(form.valid).toBe(true);
  });

  // ── Edit mode — patching values ──

  it('should patch form values in edit mode', () => {
    const producto: ProductoDTO = {
      id: 1, nombre: 'Coca Cola', precio: 1500,
      stockActual: 50, stockMinimo: 10, stockMaximo: 200,
      tipo: TipoProducto.BEBIDA, unidadMedida: UnidadMedida.UNIDAD,
      activo: true,
    };
    const { component } = createComponent(true, producto);

    expect((component as any).form.get('nombre')?.value).toBe('Coca Cola');
    expect((component as any).form.get('precio')?.value).toBe(1500);
    expect((component as any).form.get('tipo')?.value).toBe(TipoProducto.BEBIDA);
    expect((component as any).form.get('unidadMedida')?.value).toBe(UnidadMedida.UNIDAD);
  });

  // ── Submit ──

  it('should emit save with PostProductoDTO on create submit', () => {
    const { component } = createComponent();
    let emitted: any = null;
    component.save.subscribe(e => emitted = e);

    (component as any).form.patchValue({
      nombre: 'New Product',
      precio: 2000,
      stockActual: 30,
      stockMinimo: 5,
      tipo: TipoProducto.ACOMPAÑANTE,
      unidadMedida: UnidadMedida.UNIDAD,
    });

    (component as any).onSubmit();

    expect(emitted).toBeTruthy();
    expect(emitted.nombre).toBe('New Product');
    expect(emitted.precio).toBe(2000);
    expect(emitted.tipo).toBe(TipoProducto.ACOMPAÑANTE);
    expect(emitted.unidadMedida).toBe(UnidadMedida.UNIDAD);
  });

  it('should emit save on edit submit with same shape', () => {
    const producto: ProductoDTO = {
      id: 1, nombre: 'Coca Cola', precio: 1500,
      stockActual: 50, stockMinimo: 10,
      tipo: TipoProducto.BEBIDA, unidadMedida: UnidadMedida.UNIDAD,
      activo: true,
    };
    const { component } = createComponent(true, producto);
    let emitted: any = null;
    component.save.subscribe(e => emitted = e);

    (component as any).form.patchValue({
      nombre: 'Coca Updated',
      precio: 1600,
    });

    (component as any).onSubmit();

    expect(emitted).toBeTruthy();
    expect(emitted.nombre).toBe('Coca Updated');
    expect(emitted.precio).toBe(1600);
  });

  it('should NOT emit save when form is invalid', () => {
    const { component } = createComponent();
    let emitted = false;
    component.save.subscribe(() => emitted = true);

    (component as any).onSubmit(); // form empty/invalid

    expect(emitted).toBe(false);
  });

  // ── Cancel ──

  it('should emit cancel when onCancel is called', () => {
    const { component } = createComponent();
    let emitted = false;
    component.cancel.subscribe(() => emitted = true);

    (component as any).onCancel();

    expect(emitted).toBe(true);
  });


});
