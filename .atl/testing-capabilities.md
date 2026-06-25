## Testing Capabilities — TemplaRestaurante

**Strict TDD Mode**: enabled
**Detected**: 2026-06-24

---

### Frontend — `TemplaFrontV2`

**Test Runner**
- Command: `npm test` (Angular CLI → `ng test` → `@angular/build:unit-test` → Vitest)
- Framework: Vitest v4
- Config: Via `angular.json` + `tsconfig.spec.json` (includes `vitest/globals`)

**Test Layers**

| Layer | Available | Tool |
|---|---|---|
| Unit | ✅ | Vitest |
| Integration | ✅ | Vitest + jsdom v28 |
| E2E | ❌ | — |

**Coverage**
- Available: ✅ (Vitest CLI `--coverage`)
- Command: `npx vitest --coverage`

**Quality Tools**

| Tool | Available | Command |
|---|---|---|
| Linter | ❌ | — |
| Type checker | ✅ | `npx tsc --noEmit` |
| Formatter | ✅ | `npx prettier --check` |

---

### Backend — `BackEnd/TemplaRestaurant`

**Test Runner**
- Command: `./mvnw test`
- Framework: JUnit 5 (via `spring-boot-starter-test`)

**Test Layers**

| Layer | Available | Tool |
|---|---|---|
| Unit | ✅ | JUnit 5 + Mockito |
| Integration | ✅ | Spring Boot Test + H2 (MockMvc) |
| E2E | ❌ | — |

**Coverage**
- Available: ❌ (no jacoco or coverage plugin in `pom.xml`)
- Command: —

**Quality Tools**

| Tool | Available | Command |
|---|---|---|
| Linter | ❌ | — |
| Type checker | ✅ | Java compiler |
| Formatter | ❌ | — |

---

### Combined Summary

| Capability | Frontend | Backend |
|---|---|---|
| Test runner | Vitest v4 | JUnit 5 (Mockito) |
| Unit tests | ✅ 4 existing specs | ✅ 3 existing test classes |
| Integration tests | ✅ (Vitest + jsdom) | ✅ (Spring Boot Test + H2) |
| E2E | ❌ | ❌ |
| Coverage | ✅ Vitest --coverage | ❌ |
| Linter | ❌ | ❌ |
| Type checker | ✅ TypeScript | ✅ Java compiler |
| Formatter | ✅ Prettier | ❌ |
