# SDD Project Context — TemplaRestaurante

**Initialized**: 2026-06-24
**Persistence Mode**: engram (B2)
**Detected by**: sdd-init

## Project Overview

A restaurant management system (TemplaRestaurante) with a modern Angular frontend (V2 migration) and a Spring Boot Java backend.

---

## Frontend — `TemplaFrontV2/`

| Property | Value |
|---|---|
| Framework | Angular 21 (Standalone, no NgModules) |
| Language | TypeScript ~5.9.2 |
| Package Manager | npm@11.12.1 |
| State Management | Angular Signals (signal(), input(), output(), computed()) |
| Styling | Tailwind CSS v4 (`@import 'tailwindcss'`) |
| Design Tokens | Custom `@theme` in `styles.css` (primary, surface, deep, etc.) |
| Icons | Lucide Angular |
| Alerts | SweetAlert2 |
| HTTP | Angular `HttpClient` |
| Architecture | Standalone components, lazy-loaded feature routes |
| Test Runner | Vitest v4 (`@angular/build:unit-test` builder) |
| Coverage | ✅ Vitest `--coverage` (implied by vitest) |
| Formatter | Prettier v3.8.1 (single quotes, 100 width, angular HTML parser) |
| Linter | ❌ Not detected |
| Type Checker | TypeScript (via `@angular/compiler-cli`) |

### Folder Structure

```
TemplaFrontV2/
├── src/
│   ├── app/
│   │   ├── core/        (services, models, interceptors, layout)
│   │   ├── shared/      (components: data-table, filter-group)
│   │   └── features/    (dashboard, login, personas, profile — lazy-loaded)
│   ├── environments/
│   └── styles.css
├── angular.json
├── tsconfig.json / tsconfig.app.json / tsconfig.spec.json
└── .prettierrc
```

### Existing Spec Files (4)

- `src/app/app.spec.ts`
- `src/app/core/services/auth-service.spec.ts`
- `src/app/features/login/login.spec.ts`
- `src/app/features/personas/services/persona.service.spec.ts`

---

## Backend — `BackEnd/TemplaRestaurant/`

| Property | Value |
|---|---|
| Framework | Spring Boot 3.4.2 |
| Language | Java 17 |
| Build Tool | Maven (Wrapper: `mvnw`) |
| Database | MySQL (JPA/Hibernate), H2 (testing) |
| Security | Spring Security + JWT (jjwt 0.11.5) |
| API Docs | SpringDoc OpenAPI (Swagger) v2.7.0 |
| Test Runner | JUnit 5 (via `spring-boot-starter-test`) |
| Test Libraries | JUnit 5, Mockito, Spring Test, MockMvc |
| Coverage | ❌ Not configured (no jacoco/surefire coverage plugin) |
| Testing DB | H2 (runtime scope) |
| Code Gen | Lombok 1.18.38 |
| Mapper | ModelMapper 3.1.1 |
| Integrations | MercadoPago SDK 2.5.0, AWS S3 SDK 2.35.4, Spring Mail, WebSocket |

### Existing Test Files (4)

- `.../servicies/impl/UsuarioServiceImplTest.java`
- `.../servicies/impl/ProductoServiceImplTest.java`
- `.../servicies/impl/PersonaServiceImplTest.java`
- `.../Application.java` (test application context)

---

## Architecture Layers

```
TemplaFrontV2 (Angular 21 SPA)
    ↕ HTTP / WebSocket
BackEnd/TemplaRestaurant (Spring Boot REST API)
    ↕ JPA
MySQL Database
```

External integrations: MercadoPago (payments), AWS S3 (images), Spring Mail (notifications).

---

## Project Conventions

- **EditorConfig**: 2-space indent, UTF-8, single quotes for TS
- **.gitignore**: env files, IDE dirs, OS files, application.properties
- **GGA (Gentle Guardian Angel)**: Configured for OpenCode, reviewing *.ts/*.tsx/*.js/*.jsx, excludes test files
- **Skill**: `templa-frontend-v2` project skill (Angular 21 + Signals + Tailwind v4 + Vitest TDD)

## Strict TDD

- **Resolved**: `true`
- **Reason**: Test runner exists in both frontend (Vitest) and backend (JUnit 5). Project skill mandates test-first approach.

---

**Note**: Engram persistence MCP tools not available in this session. Context written to local `.atl/sdd-project-context.md` as fallback.
