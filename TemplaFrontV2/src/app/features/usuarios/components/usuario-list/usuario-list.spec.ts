import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { UsuarioListComponent } from './usuario-list';
import { UserService } from '../../services/user.service';
import { UsuarioDTO, RolUsuario } from '../../models/usuario.model';

describe('UsuarioListComponent', () => {
  let component: UsuarioListComponent;
  let fixture: any;
  let service: UserService;
  let httpMock: HttpTestingController;

  const mockUsers: UsuarioDTO[] = [
    { id: 1, username: 'admin', rolUsuario: RolUsuario.ADMINISTRADOR, activo: true, personaNombre: 'Admin User' },
    { id: 2, username: 'mozo1', rolUsuario: RolUsuario.MOZO, activo: true, personaNombre: 'Mozo Uno' },
    { id: 3, username: 'cocina1', rolUsuario: RolUsuario.COCINA, activo: true, personaNombre: null },
    { id: 4, username: 'encargado', rolUsuario: RolUsuario.ENCARGADO, activo: false, personaNombre: 'Encargado' },
    { id: 5, username: 'cocina2', rolUsuario: RolUsuario.COCINA, activo: true, personaNombre: 'Cocina Dos' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsuarioListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(UsuarioListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    // Flush the initial loadUsuarios call
    httpMock.expectOne('http://localhost:8081/api/usuario/listar').flush(mockUsers);
    fixture.detectChanges();
  }

  // ── Initialization ──

  it('should load usuarios on init and expose service signals', () => {
    createComponent();
    expect(component).toBeTruthy();
    expect(service.usuarios().length).toBe(5);
  });

  it('should render stats bar with correct computed values', () => {
    createComponent();
    const stats = (component as any).stats();
    expect(stats.total).toBe(5);
    expect(stats.administradores).toBe(1);
    expect(stats.mozo).toBe(1);
    expect(stats.cocina).toBe(2);
  });

  it('should update stats reactively when filters change', () => {
    createComponent();
    service.filtrar({ rol: RolUsuario.COCINA });
    const stats = (component as any).stats();
    expect(stats.total).toBe(2);
    expect(stats.administradores).toBe(0);
    expect(stats.cocina).toBe(2);
  });

  // ── Modal state ──

  it('should open modal in create mode', () => {
    createComponent();
    component.openNewUserModal();
    expect((component as any).modalOpen()).toBe(true);
    expect((component as any).editUser()).toBeUndefined();
  });

  it('should open modal in edit mode with user data', () => {
    createComponent();
    component.openEditUserModal(mockUsers[0]);
    expect((component as any).modalOpen()).toBe(true);
    expect((component as any).editUser()).toEqual(mockUsers[0]);
  });

  it('should close modal and reset editUser', () => {
    createComponent();
    component.openEditUserModal(mockUsers[0]);
    component.closeModal();
    expect((component as any).modalOpen()).toBe(false);
    expect((component as any).editUser()).toBeUndefined();
  });

  // ── Search (instant, like Personas) ──

  it('should apply filter immediately on search change', () => {
    createComponent();
    const filtrarSpy = vi.spyOn(service, 'filtrar');
    (component as any).busqueda = 'admin';
    component.onBusquedaChange();
    expect(filtrarSpy).toHaveBeenCalledWith({ busqueda: 'admin' });
  });

  // ── Filter change ──

  it('should apply filter immediately on tipoFilter change', () => {
    createComponent();
    const filtrarSpy = vi.spyOn(service, 'filtrar');
    component.onTipoFilterChange(RolUsuario.COCINA);
    expect(filtrarSpy).toHaveBeenCalledWith({ rol: RolUsuario.COCINA });
  });

  it('should apply filter immediately on estadoFilter change', () => {
    createComponent();
    const filtrarSpy = vi.spyOn(service, 'filtrar');
    component.onEstadoFilterChange('activos');
    expect(filtrarSpy).toHaveBeenCalledWith({ activo: true });
  });

  // ── cellPrefixes (avatar initials) ──

  it('should compute initials from username when personaNombre is null', () => {
    const prefix = component.getInitials(mockUsers[2]); // cocina1, personaNombre: null
    expect(prefix).toBe('C');
  });

  it('should compute initials from personaNombre first letter', () => {
    const prefix = component.getInitials(mockUsers[0]); // admin, personaNombre: 'Admin User'
    expect(prefix).toBe('A');
  });

  // ── Pagination ──

  it('should call irAPagina when page changes', () => {
    createComponent();
    const irAPaginaSpy = vi.spyOn(service, 'irAPagina');
    component.irAPagina(2);
    expect(irAPaginaSpy).toHaveBeenCalledWith(2);
  });
});
