# Testing Guide — Templa Frontend V2

Testing is not a chore to do at the end of the project. **It's a development tool.** Writing tests first (TDD) saves you time because you don't have to start the server, log in, click 5 buttons, and fill a form just to see if a simple service method works.

We use **Vitest** for blistering fast, modern testing.

---

## 1. Why Vitest?
Vitest runs on Vite (fast, light, doesn't need heavy Angular builder runtimes). You run `npm run test` and it takes less than 1 second to give you feedback.

---

## 2. Service Unit Test Pattern
Services are easy to test because we just mock the `HttpClient`.

### The Test File: `persona.service.spec.ts`
```typescript
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PersonaService } from './persona.service';
import { Persona } from '../models/persona.model';
import { describe, beforeEach, it, expect, inject } from 'vitest';

describe('PersonaService', () => {
  let service: PersonaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PersonaService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(PersonaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should fetch personas and update state signal', () => {
    const dummyPersonas: Persona[] = [
      { id: 1, nombre: 'Mateo', apellido: 'Perez', email: 'm@p.com', telefono: '123', activo: true }
    ];

    // Trigger API call
    service.getPersonas().subscribe(personas => {
      expect(personas.length).toBe(1);
      expect(personas).toEqual(dummyPersonas);
    });

    // Verify correct HTTP request was made
    const req = httpMock.expectOne('http://localhost:8081/api/personas');
    expect(req.request.method).toBe('GET');
    
    // Flush dummy data to resolve the request
    req.flush(dummyPersonas);

    // Verify signal was updated!
    expect(service.personas()).toEqual(dummyPersonas);
  });
});
```

---

## 3. Component Test Pattern
We test:
1. Does it render correctly?
2. Does it emit outputs when interactive elements are clicked?

```typescript
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { PersonaListComponent } from './persona-list';
import { PersonaService } from '../../services/persona.service';
import { of } from 'rxjs';
import { describe, beforeEach, it, expect, vi } from 'vitest';

describe('PersonaListComponent', () => {
  let component: PersonaListComponent;
  let fixture: ComponentFixture<PersonaListComponent>;
  
  // Mock service
  const mockPersonaService = {
    getPersonas: vi.fn().mockReturnValue(of([])),
    personas: () => [],
    isLoading: () => false
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonaListComponent],
      providers: [
        { provide: PersonaService, useValue: mockPersonaService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PersonaListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should compile and call getPersonas on init', () => {
    expect(component).toBeTruthy();
    expect(mockPersonaService.getPersonas).toHaveBeenCalled();
  });
});
```

---

## 4. Simple Learning Flow (How to learn TDD)
1. Write an empty service class `class MyService {}`.
2. Write a `.spec.ts` file describing what you want your service to do: e.g. `it('should calculate total order cost')`.
3. Run the tests. They fail.
4. Write the minimum code in `MyService` to make the test pass.
5. Pat yourself on the back. You just did TDD.
