import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { UserService } from './user.service';
import { UsuarioDTO, RolUsuario, UsuarioCreateDTO, UsuarioUpdateDTO } from '../models/usuario.model';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  const mockUsers: UsuarioDTO[] = [
    { id: 1, username: 'admin', rolUsuario: RolUsuario.ADMINISTRADOR, activo: true, personaNombre: 'Admin User' },
    { id: 2, username: 'mozo1', rolUsuario: RolUsuario.MOZO, activo: true, personaNombre: 'Mozo Uno' },
    { id: 3, username: 'cocina1', rolUsuario: RolUsuario.COCINA, activo: true, personaNombre: null },
    { id: 4, username: 'encargado', rolUsuario: RolUsuario.ENCARGADO, activo: false, personaNombre: 'Encargado Uno' },
    { id: 5, username: 'cocina2', rolUsuario: RolUsuario.COCINA, activo: true, personaNombre: 'Cocina Dos' },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UserService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ── loadUsuarios ──

  it('should load all users via GET /listar and update signals', () => {
    service.loadUsuarios();

    const req = httpMock.expectOne('http://localhost:8081/api/usuario/listar');
    expect(req.request.method).toBe('GET');
    req.flush(mockUsers);

    expect(service.usuarios().length).toBe(5);
    expect(service.usuarios()[0].username).toBe('admin');
    expect(service.usuarios()[3].activo).toBe(false);
    expect(service.isLoading()).toBe(false);
  });

  it('should set loading state while loading usuarios', () => {
    service.loadUsuarios();
    expect(service.isLoading()).toBe(true);

    const req = httpMock.expectOne('http://localhost:8081/api/usuario/listar');
    req.flush(mockUsers);
    expect(service.isLoading()).toBe(false);
  });

  it('should handle empty list', () => {
    service.loadUsuarios();

    const req = httpMock.expectOne('http://localhost:8081/api/usuario/listar');
    req.flush([]);

    expect(service.usuarios()).toEqual([]);
    expect(service.filteredUsers()).toEqual([]);
  });

  // ── filtrar (client-side) ──

  it('should filter by rol via computed signal', () => {
    service.loadUsuarios();
    httpMock.expectOne('http://localhost:8081/api/usuario/listar').flush(mockUsers);

    service.filtrar({ rol: RolUsuario.COCINA });

    const filtered = service.filteredUsers();
    expect(filtered.length).toBe(2);
    expect(filtered.every(u => u.rolUsuario === RolUsuario.COCINA)).toBe(true);
  });

  it('should filter by activo status', () => {
    service.loadUsuarios();
    httpMock.expectOne('http://localhost:8081/api/usuario/listar').flush(mockUsers);

    service.filtrar({ activo: false });

    const filtered = service.filteredUsers();
    expect(filtered.length).toBe(1);
    expect(filtered[0].username).toBe('encargado');
  });

  it('should filter by search text case-insensitive', () => {
    service.loadUsuarios();
    httpMock.expectOne('http://localhost:8081/api/usuario/listar').flush(mockUsers);

    service.filtrar({ busqueda: 'COCINA' });

    const filtered = service.filteredUsers();
    expect(filtered.length).toBe(2);
  });

  it('should combine multiple filters (rol + activo + busqueda)', () => {
    service.loadUsuarios();
    httpMock.expectOne('http://localhost:8081/api/usuario/listar').flush(mockUsers);

    service.filtrar({ rol: RolUsuario.COCINA, activo: true, busqueda: 'cocina' });

    const filtered = service.filteredUsers();
    expect(filtered.length).toBe(2);
  });

  it('should return empty array when no filters match', () => {
    service.loadUsuarios();
    httpMock.expectOne('http://localhost:8081/api/usuario/listar').flush(mockUsers);

    service.filtrar({ busqueda: 'nonexistent' });

    expect(service.filteredUsers()).toEqual([]);
  });

  // ── irAPagina (client-side pagination) ──

  it('should paginate filtered results client-side', () => {
    // Load 5 users but set page size to 2
    service.loadUsuarios();
    httpMock.expectOne('http://localhost:8081/api/usuario/listar').flush(mockUsers);

    service.filtrar({ page: 0, size: 2 });
    expect(service.filteredUsers().length).toBe(2);

    service.irAPagina(1);
    expect(service.filteredUsers().length).toBe(2);

    service.irAPagina(2);
    expect(service.filteredUsers().length).toBe(1); // last page has 1
  });

  it('should reset to page 0 when filters change', () => {
    service.loadUsuarios();
    httpMock.expectOne('http://localhost:8081/api/usuario/listar').flush(mockUsers);

    service.filtrar({ page: 1, size: 2 });
    service.filtrar({ rol: RolUsuario.COCINA });

    // After filter change, page resets to 0
    const filtered = service.filteredUsers();
    expect(filtered.length).toBe(2); // first 2 from page 0 with size 2
    expect(filtered[0].username).toBe('cocina1');
  });

  // ── totalPages / totalElements computed ──

  it('should compute totalElements from filtered data', () => {
    service.loadUsuarios();
    httpMock.expectOne('http://localhost:8081/api/usuario/listar').flush(mockUsers);

    expect(service.totalElements()).toBe(5);

    service.filtrar({ rol: RolUsuario.COCINA });
    expect(service.totalElements()).toBe(2);
  });

  it('should compute totalPages from filtered data', () => {
    service.loadUsuarios();
    httpMock.expectOne('http://localhost:8081/api/usuario/listar').flush(mockUsers);

    service.filtrar({ size: 2 });
    expect(service.totalPages()).toBe(3); // 5 items / 2 per page = 3 pages

    service.filtrar({ size: 10 });
    expect(service.totalPages()).toBe(1);
  });

  // ── crear (POST) ──

  it('should create a user via POST /crear', () => {
    const dto: UsuarioCreateDTO = {
      username: 'newuser',
      password: 'pass123',
      rolUsuario: RolUsuario.MOZO,
      personaDni: 43998130,
    };
    const created: UsuarioDTO = { id: 6, username: 'newuser', rolUsuario: RolUsuario.MOZO, activo: true, personaNombre: null };

    let result: UsuarioDTO | undefined;
    service.crear(dto).subscribe(r => result = r);

    const req = httpMock.expectOne('http://localhost:8081/api/usuario/crear');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush(created);

    expect(result?.id).toBe(6);
    expect(result?.username).toBe('newuser');
  });

  // ── actualizar (PUT) ──

  it('should update a user via PUT /editar/{id}', () => {
    const dto: UsuarioUpdateDTO = {
      username: 'updated',
      rolUsuario: RolUsuario.ADMINISTRADOR,
      activo: true,
    };
    const updated: UsuarioDTO = { id: 1, username: 'updated', rolUsuario: RolUsuario.ADMINISTRADOR, activo: true, personaNombre: 'Admin' };

    let result: UsuarioDTO | undefined;
    service.actualizar(1, dto).subscribe(r => result = r);

    const req = httpMock.expectOne('http://localhost:8081/api/usuario/editar/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(dto);
    req.flush(updated);

    expect(result?.username).toBe('updated');
  });

  it('should include password in PUT only if non-empty', () => {
    const dtoWithPassword: UsuarioUpdateDTO = {
      username: 'updated',
      password: 'newpass123',
      rolUsuario: RolUsuario.ADMINISTRADOR,
      activo: true,
    };

    service.actualizar(1, dtoWithPassword).subscribe();
    const req = httpMock.expectOne('http://localhost:8081/api/usuario/editar/1');
    expect(req.request.body.password).toBe('newpass123');
    req.flush({ id: 1, username: 'updated', rolUsuario: RolUsuario.ADMINISTRADOR, activo: true, personaNombre: null });
  });

  // ── eliminar (DELETE) ──

  it('should delete a user via DELETE /eliminar/{id}', () => {
    let completed = false;
    service.eliminar(1).subscribe(() => completed = true);

    const req = httpMock.expectOne('http://localhost:8081/api/usuario/eliminar/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    expect(completed).toBe(true);
  });

  // ── toggleActivo ──

  it('should toggle activo via PUT /editar/{id}', () => {
    // First load users
    service.loadUsuarios();
    httpMock.expectOne('http://localhost:8081/api/usuario/listar').flush(mockUsers);

    // Toggle user 1 (admin, activo: true) → should send activo: false
    let result: UsuarioDTO | undefined;
    service.toggleActivo(1).subscribe(r => result = r);

    const req = httpMock.expectOne('http://localhost:8081/api/usuario/editar/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.activo).toBe(false);
    req.flush({ ...mockUsers[0], activo: false });
  });

  it('should toggle activo from false to true', () => {
    service.loadUsuarios();
    httpMock.expectOne('http://localhost:8081/api/usuario/listar').flush(mockUsers);

    let result: UsuarioDTO | undefined;
    service.toggleActivo(4).subscribe(r => result = r); // encargado, activo: false

    const req = httpMock.expectOne('http://localhost:8081/api/usuario/editar/4');
    expect(req.request.body.activo).toBe(true);
    req.flush({ ...mockUsers[3], activo: true });

    expect(result?.activo).toBe(true);
  });
});
