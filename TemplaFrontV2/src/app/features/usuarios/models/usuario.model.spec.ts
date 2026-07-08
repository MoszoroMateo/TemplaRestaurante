import { RolUsuario, UsuarioDTO, UsuarioCreateDTO, UsuarioUpdateDTO, FiltroUsuario } from './usuario.model';

describe('Usuario Model / Types', () => {
  it('should define RolUsuario enum with 4 values', () => {
    expect(Object.keys(RolUsuario).length).toBe(4);
    expect(RolUsuario.ADMINISTRADOR).toBe('ADMINISTRADOR');
    expect(RolUsuario.MOZO).toBe('MOZO');
    expect(RolUsuario.COCINA).toBe('COCINA');
    expect(RolUsuario.ENCARGADO).toBe('ENCARGADO');
  });

  it('should create a valid UsuarioDTO', () => {
    const dto: UsuarioDTO = {
      id: 1,
      username: 'admin',
      rolUsuario: RolUsuario.ADMINISTRADOR,
      activo: true,
      personaNombre: 'Mateo Moszoro',
    };

    expect(dto.id).toBe(1);
    expect(dto.username).toBe('admin');
    expect(dto.rolUsuario).toBe('ADMINISTRADOR');
    expect(dto.activo).toBe(true);
    expect(dto.personaNombre).toBe('Mateo Moszoro');
  });

  it('should create a valid UsuarioDTO with personaNombre null', () => {
    const dto: UsuarioDTO = {
      id: 2,
      username: 'cocinero1',
      rolUsuario: RolUsuario.COCINA,
      activo: true,
      personaNombre: null,
    };

    expect(dto.personaNombre).toBeNull();
  });

  it('should create a valid UsuarioCreateDTO with personaDni', () => {
    const dto: UsuarioCreateDTO = {
      username: 'newuser',
      password: 'pass123',
      rolUsuario: RolUsuario.MOZO,
      personaDni: 43998130,
    };

    expect(dto.username).toBe('newuser');
    expect(dto.password).toBe('pass123');
    expect(dto.rolUsuario).toBe('MOZO');
    expect(dto.personaDni).toBe(43998130);
  });

  it('should create a valid UsuarioCreateDTO without personaDni', () => {
    const dto: UsuarioCreateDTO = {
      username: 'newuser',
      password: 'pass123',
      rolUsuario: RolUsuario.ENCARGADO,
    };

    expect(dto.personaDni).toBeUndefined();
  });

  it('should create a valid UsuarioUpdateDTO', () => {
    const dto: UsuarioUpdateDTO = {
      username: 'updated',
      rolUsuario: RolUsuario.ADMINISTRADOR,
      activo: true,
    };

    expect(dto.username).toBe('updated');
    expect(dto.activo).toBe(true);
    expect(dto.password).toBeUndefined();
  });

  it('should create a valid FiltroUsuario with defaults', () => {
    const filtro: FiltroUsuario = {
      page: 0,
      size: 10,
    };

    expect(filtro.page).toBe(0);
    expect(filtro.size).toBe(10);
    expect(filtro.busqueda).toBeUndefined();
    expect(filtro.rol).toBeUndefined();
    expect(filtro.activo).toBeUndefined();
  });

  it('should create a FiltroUsuario with all filters', () => {
    const filtro: FiltroUsuario = {
      busqueda: 'admin',
      rol: RolUsuario.ADMINISTRADOR,
      activo: true,
      page: 1,
      size: 20,
    };

    expect(filtro.busqueda).toBe('admin');
    expect(filtro.rol).toBe('ADMINISTRADOR');
    expect(filtro.activo).toBe(true);
    expect(filtro.page).toBe(1);
    expect(filtro.size).toBe(20);
  });
});
