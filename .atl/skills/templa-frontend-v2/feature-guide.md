# Feature Guide — Templa Frontend V2

This guide walks you through creating a new feature in Templa Frontend V2 using professional Angular 21 structures and patterns.

---

## 1. Directory Anatomy
Each feature resides in `src/app/features/{domain}/`. 
A complete domain folder should look like this:

```
features/personas/
├── components/
│   ├── persona-list/           # List view (Table, search, pagination)
│   │   ├── persona-list.ts     # Component TS (standalone)
│   │   ├── persona-list.html   # Template
│   │   └── persona-list.css    # Local Tailwind scopes (empty usually)
│   └── persona-modal/          # Creation / edit modal form
│       ├── persona-modal.ts
│       └── persona-modal.html
├── services/
│   └── persona.service.ts      # API consumer and domain state manager
├── models/
│   └── persona.model.ts        # TypeScript interfaces
└── personas.routes.ts          # Feature lazy routing declarations
```

---

## 2. Standard Feature Creation Flow

Always build from the data structure out to the UI. Do not write HTML until your models and services are verified.

### Step 1: Define Your Models (`models/`)
Define clean TypeScript interfaces. Ensure optional fields are explicit.

```typescript
export interface Persona {
  id?: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  activo: boolean;
}
```

### Step 2: Create Your Service (`services/`)
Your service should handle API calls and manage local state using **Signals**.

```typescript
import { inject, Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Persona } from '../models/persona.model';

@Injectable()
export class PersonaService {
  private http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:8081/api/personas';

  // State
  private personasState = signal<Persona[]>([]);
  private loadingState = signal<boolean>(false);

  // Read-only public slices
  personas = computed(() => this.personasState());
  isLoading = computed(() => this.loadingState());

  getPersonas(): Observable<Persona[]> {
    this.loadingState.set(true);
    return this.http.get<Persona[]>(this.API_URL).pipe(
      tap({
        next: (data) => this.personasState.set(data),
        finalize: () => this.loadingState.set(false)
      })
    );
  }

  createPersona(persona: Persona): Observable<Persona> {
    this.loadingState.set(true);
    return this.http.post<Persona>(this.API_URL, persona).pipe(
      tap({
        next: (newPersona) => this.personasState.update(list => [...list, newPersona]),
        finalize: () => this.loadingState.set(false)
      })
    );
  }
}
```

### Step 3: Write Services & Component Tests
See [Testing Guide](testing-guide.md). Do not skip this!

### Step 4: Create Presentational and Container Components
- **Container Component**: Loads services, triggers API calls, feeds data to templates.
- **Presentational Component**: Simple, reusable (like `app-data-table`), communicates purely via `input()` and `output()`.

### Step 5: Setup Feature Routes
Define lazy loading paths inside `personas.routes.ts`:

```typescript
import { Routes } from '@angular/router';
import { PersonaListComponent } from './components/persona-list/persona-list';

export const PERSONA_ROUTES: Routes = [
  { path: '', component: PersonaListComponent }
];
```

Then register them dynamically in `app.routes.ts`:
```typescript
{
  path: 'personas',
  loadChildren: () => import('./features/personas/personas.routes').then(m => m.PERSONA_ROUTES),
  canActivate: [AuthGuard]
}
```
*This keeps initial load bundles small and optimized.*
