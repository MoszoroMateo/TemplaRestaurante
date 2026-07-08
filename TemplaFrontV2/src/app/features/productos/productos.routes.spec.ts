import { PRODUCTO_ROUTES } from './productos.routes';

describe('Productos Routes', () => {
  it('should define a routes array with one entry', () => {
    expect(PRODUCTO_ROUTES).toBeDefined();
    expect(Array.isArray(PRODUCTO_ROUTES)).toBe(true);
    expect(PRODUCTO_ROUTES.length).toBe(1);
  });

  it('should have an empty path pointing to ProductoListComponent', () => {
    const route = PRODUCTO_ROUTES[0];
    expect(route.path).toBe('');
    expect(route.component).toBeDefined();
  });
});
