import { TipoProducto, UnidadMedida, ProductoDTO, PostProductoDTO, FiltroProducto } from './producto.model';

describe('Producto Model / Types', () => {
  it('should define TipoProducto enum with 3 values', () => {
    expect(Object.keys(TipoProducto).length).toBe(3);
    expect(TipoProducto.INSUMO).toBe('INSUMO');
    expect(TipoProducto.ACOMPAÑANTE).toBe('ACOMPAÑANTE');
    expect(TipoProducto.BEBIDA).toBe('BEBIDA');
  });

  it('should define UnidadMedida enum with 4 values', () => {
    expect(Object.keys(UnidadMedida).length).toBe(4);
    expect(UnidadMedida.KILOGRAMO).toBe('KILOGRAMO');
    expect(UnidadMedida.LITRO).toBe('LITRO');
    expect(UnidadMedida.GRAMO).toBe('GRAMO');
    expect(UnidadMedida.UNIDAD).toBe('UNIDAD');
  });

  it('should create a valid ProductoDTO', () => {
    const dto: ProductoDTO = {
      id: 1,
      nombre: 'Coca Cola 500ml',
      precio: 1500.00,
      stockActual: 50,
      stockMinimo: 10,
      tipo: TipoProducto.BEBIDA,
      unidadMedida: UnidadMedida.UNIDAD,
      activo: true,
    };

    expect(dto.id).toBe(1);
    expect(dto.nombre).toBe('Coca Cola 500ml');
    expect(dto.precio).toBe(1500.00);
    expect(dto.tipo).toBe('BEBIDA');
    expect(dto.unidadMedida).toBe('UNIDAD');
    expect(dto.activo).toBe(true);
  });

  it('should create a valid PostProductoDTO for create request', () => {
    const dto: PostProductoDTO = {
      nombre: 'Agua 1.5L',
      precio: 1200.00,
      stockActual: 200,
      stockMinimo: 50,
      tipo: TipoProducto.BEBIDA,
      unidadMedida: UnidadMedida.LITRO,
    };

    expect(dto.nombre).toBe('Agua 1.5L');
    expect(dto.tipo).toBe('BEBIDA');
    expect(dto.unidadMedida).toBe('LITRO');
    expect(dto.stockActual).toBe(200);
  });

  it('should create a valid PostProductoDTO with minimal fields', () => {
    const dto: PostProductoDTO = {
      nombre: 'Pan francés',
      precio: 500.00,
      stockActual: 30,
      stockMinimo: 5,
      tipo: TipoProducto.ACOMPAÑANTE,
      unidadMedida: UnidadMedida.UNIDAD,
    };

    expect(dto).toBeTruthy();
  });

  it('should create a valid FiltroProducto with defaults', () => {
    const filtro: FiltroProducto = {
      page: 0,
      size: 10,
    };

    expect(filtro.page).toBe(0);
    expect(filtro.size).toBe(10);
    expect(filtro.busqueda).toBeUndefined();
    expect(filtro.tipo).toBeUndefined();
    expect(filtro.activo).toBeUndefined();
  });

  it('should create a FiltroProducto with all filters', () => {
    const filtro: FiltroProducto = {
      busqueda: 'coca',
      tipo: TipoProducto.BEBIDA,
      activo: 'ACTIVOS',
      page: 1,
      size: 20,
    };

    expect(filtro.busqueda).toBe('coca');
    expect(filtro.tipo).toBe('BEBIDA');
    expect(filtro.activo).toBe('ACTIVOS');
    expect(filtro.page).toBe(1);
    expect(filtro.size).toBe(20);
  });
});
