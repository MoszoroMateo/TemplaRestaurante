import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MenuService } from './menu.service';
import { AuthService } from './auth.service';
import { GetMenuDTO, PostMenuDTO } from '../componentes/models/MenuModel';
import { environment } from '../../environments/environment';

describe('MenuService', () => {
  let service: MenuService;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('AuthService', ['getToken']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        MenuService,
        { provide: AuthService, useValue: spy }
      ]
    });
    
    service = TestBed.inject(MenuService);
    httpMock = TestBed.inject(HttpTestingController);
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    
    // Mock del token
    authServiceSpy.getToken.and.returnValue('mock-token');
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get menus with pagination', () => {
    const mockMenus = {
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 10,
      number: 0,
      first: true,
      last: true,
      numberOfElements: 0
    };

    service.getMenus(0, 10).subscribe(menus => {
      expect(menus).toEqual(mockMenus);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/menu/menus?page=0&size=10`);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mock-token');
    req.flush(mockMenus);
  });

  it('should get filtered menus', () => {
    const mockMenus = {
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 10,
      number: 0,
      first: true,
      last: true,
      numberOfElements: 0
    };

    service.getMenusFiltrados(0, 10, 'test', 'ACTIVO').subscribe(menus => {
      expect(menus).toEqual(mockMenus);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/menu/filtrar?page=0&size=10&buscarFiltro=test&estado=ACTIVO`);
    expect(req.request.method).toBe('GET');
    req.flush(mockMenus);
  });

  it('should create menu', () => {
    const mockMenu: PostMenuDTO = {
      nombre: 'Test Menu',
      descripcion: 'Test Description',
      precio: 25.99,
      productos: []
    };

    const mockResponse: GetMenuDTO = {
      id: 1,
      nombre: 'Test Menu',
      descripcion: 'Test Description',
      precio: 25.99,
      activo: true,
      productos: []
    };

    service.createMenu(mockMenu).subscribe(menu => {
      expect(menu).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/menu/crear`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockMenu);
    req.flush(mockResponse);
  });

  it('should update menu', () => {
    const mockMenu: GetMenuDTO = {
      id: 1,
      nombre: 'Updated Menu',
      descripcion: 'Updated Description',
      precio: 30.99,
      activo: true,
      productos: []
    };

    service.actualizarMenu(mockMenu).subscribe(menu => {
      expect(menu).toEqual(mockMenu);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/menu/actualizar`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(mockMenu);
    req.flush(mockMenu);
  });

  it('should activate/deactivate menu', () => {
    const mockResponse = 'Estado del menú actualizado correctamente';

    service.activarDesactivarMenu(1).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/menu/activar-desactivar/1`);
    expect(req.request.method).toBe('PUT');
    req.flush(mockResponse);
  });

  it('should delete menu', () => {
    const mockResponse = 'Menú dado de baja correctamente';

    service.bajaMenu(1).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/menu/baja/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(mockResponse);
  });

  it('should get menu by id', () => {
    const mockMenu: GetMenuDTO = {
      id: 1,
      nombre: 'Test Menu',
      descripcion: 'Test Description',
      precio: 25.99,
      activo: true,
      productos: []
    };

    service.obtenerMenuPorId(1).subscribe(menu => {
      expect(menu).toEqual(mockMenu);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/menu/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockMenu);
  });

  it('should get menu details', () => {
    const mockDetalles = [
      { id: 1, menuId: 1, platoId: 1, productoId: 1 }
    ];

    service.obtenerDetallesMenu(1).subscribe(detalles => {
      expect(detalles).toEqual(mockDetalles);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/menu/detalles/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockDetalles);
  });
});