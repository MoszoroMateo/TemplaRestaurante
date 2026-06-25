import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PersonaService } from './persona.service';
import { Persona, PostPersonaDto, TipoPersona, Page } from '../models/persona.model';

describe('PersonaService', () => {
  let service: PersonaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PersonaService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(PersonaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ── loadPersonas ──

  it('should load personas and update signals', () => {
    const dummyPage: Page<Persona> = {
      content: [
        {
          id: 1, nombre: 'Mateo', apellido: 'Moszoro',
          email: 'm@m.com', telefono: '123', dni: 43998130,
          tipoPersona: TipoPersona.PERSONAL, fechaBaja: null,
        },
      ],
      totalElements: 1, totalPages: 1, size: 10,
      number: 0, first: true, last: true, numberOfElements: 1,
    };

    service.loadPersonas();

    const req = httpMock.expectOne('http://localhost:8081/api/persona/personas?page=0&size=10');
    expect(req.request.method).toBe('GET');
    req.flush(dummyPage);

    expect(service.personas().length).toBe(1);
    expect(service.personas()[0].nombre).toBe('Mateo');
    expect(service.pageInfo()?.totalElements).toBe(1);
  });

  it('should set loading state while loading', () => {
    const dummyPage: Page<Persona> = { content: [], totalElements: 0, totalPages: 0, size: 10, number: 0, first: true, last: true, numberOfElements: 0 };
    service.loadPersonas();

    expect(service.isLoading()).toBe(true);

    const req = httpMock.expectOne('http://localhost:8081/api/persona/personas?page=0&size=10');
    req.flush(dummyPage);

    expect(service.isLoading()).toBe(false);
  });

  // ── filtrar ──

  it('should apply filters and update page info', () => {
    const dummyPage: Page<Persona> = {
      content: [{ id: 2, nombre: 'Ana', apellido: 'Lopez', email: 'a@l.com', telefono: '456', dni: 12345678, tipoPersona: TipoPersona.CLIENTE, fechaBaja: null }],
      totalElements: 1, totalPages: 1, size: 10, number: 0, first: true, last: true, numberOfElements: 1,
    };

    service.filtrar({ busqueda: 'Ana', tipo: TipoPersona.CLIENTE, activo: true });

    const req = httpMock.expectOne(r =>
      r.url === 'http://localhost:8081/api/persona/personas/filtrar' &&
      r.params.get('buscarFiltro') === 'Ana' &&
      r.params.get('tipoPersona') === 'CLIENTE' &&
      r.params.get('estado') === 'ACTIVOS'
    );
    expect(req.request.method).toBe('GET');
    req.flush(dummyPage);

    expect(service.personas().length).toBe(1);
  });

  it('should map activo=false to estado=BAJA', () => {
    const emptyPage: Page<Persona> = { content: [], totalElements: 0, totalPages: 0, size: 10, number: 0, first: true, last: true, numberOfElements: 0 };
    service.filtrar({ activo: false });

    const req = httpMock.expectOne(r =>
      r.url === 'http://localhost:8081/api/persona/personas/filtrar' &&
      r.params.get('estado') === 'BAJA'
    );
    req.flush(emptyPage);
    expect(service.personas().length).toBe(0);
  });

  // ── irAPagina ──

  it('should navigate to a specific page', () => {
    const emptyPage: Page<Persona> = { content: [], totalElements: 0, totalPages: 5, size: 10, number: 2, first: false, last: false, numberOfElements: 0 };
    service.irAPagina(2);

    const req = httpMock.expectOne(r =>
      r.url === 'http://localhost:8081/api/persona/personas/filtrar' &&
      r.params.get('page') === '2'
    );
    req.flush(emptyPage);
    expect(service.pageInfo()?.number).toBe(2);
  });

  // ── crear ──

  it('should create a persona via POST', () => {
    const dto: PostPersonaDto = {
      nombre: 'Nuevo', apellido: 'Test', email: 'n@t.com',
      telefono: '789', dni: 11111111, tipoPersona: TipoPersona.PERSONAL, userAlta: 1,
    };
    const created: Persona = { ...dto, id: 99, fechaBaja: null };

    let result: Persona | undefined;
    service.crear(dto).subscribe(r => result = r);

    const req = httpMock.expectOne('http://localhost:8081/api/persona/crear');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush(created);

    expect(result?.id).toBe(99);
    expect(result?.nombre).toBe('Nuevo');
  });

  // ── actualizar ──

  it('should update a persona via PUT', () => {
    const updated: Persona = {
      id: 1, nombre: 'Mateo Updated', apellido: 'Moszoro',
      email: 'm@m.com', telefono: '123', dni: 43998130,
      tipoPersona: TipoPersona.PERSONAL, fechaBaja: null,
    };

    let result: Persona | undefined;
    service.actualizar(updated).subscribe(r => result = r);

    const req = httpMock.expectOne('http://localhost:8081/api/persona/actualizar');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updated);
    req.flush(updated);

    expect(result?.nombre).toBe('Mateo Updated');
  });

  // ── eliminar ──

  it('should delete a persona via DELETE', () => {
    let completed = false;
    service.eliminar(1).subscribe(() => completed = true);

    const req = httpMock.expectOne('http://localhost:8081/api/persona/baja/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    expect(completed).toBe(true);
  });
});
