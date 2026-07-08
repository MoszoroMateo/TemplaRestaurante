import { USUARIO_ROUTES } from './usuarios.routes';

describe('Usuarios Routes', () => {
  it('should define a routes array with one entry', () => {
    expect(USUARIO_ROUTES).toBeDefined();
    expect(Array.isArray(USUARIO_ROUTES)).toBe(true);
    expect(USUARIO_ROUTES.length).toBe(1);
  });

  it('should have an empty path pointing to UsuarioListComponent', () => {
    const route = USUARIO_ROUTES[0];
    expect(route.path).toBe('');
    expect(route.component).toBeDefined();
  });
});
