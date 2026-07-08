import { routes } from './app.routes';

describe('App Routes', () => {
  it('should define the routes array', () => {
    expect(routes).toBeDefined();
    expect(Array.isArray(routes)).toBe(true);
  });

  it('should have a lazy route for productos inside layout children', () => {
    // Find the layout route (empty path with LayoutComponent)
    const layoutRoute = routes.find(
      (r) => r.path === '' && r.component != null,
    );
    expect(layoutRoute).toBeDefined();
    expect(layoutRoute!.children).toBeDefined();

    const productosRoute = layoutRoute!.children!.find(
      (r) => r.path === 'productos',
    );
    expect(productosRoute).toBeDefined();
    expect(typeof productosRoute!.loadChildren).toBe('function');
  });
});
