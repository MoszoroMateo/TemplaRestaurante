# Migration Checklist — Templa Frontend V2

This checklist outlines how to safely port business logic and assets from the old codebase (`C:\A PROGRAMACION\TemplaFront`) to the modern, clean `TemplaFrontV2`.

---

## 1. Migration Protocol (The "Port-and-Upgrade" Rule)

Do NOT copy-paste whole files. Port elements systematically:

1. **Copy the Model** first, convert field names to English if they are in Spanish (e.g. `UsuarioModel` -> `auth.model.ts`).
2. **Port the Service**:
   - Rewrite any standard RxJS state to Angular **Signals**.
   - Convert old Promise/Callback functions into Observable/Signal patterns.
3. **Port the HTML template**:
   - Strip all Bootstrap classes (`col-md-6`, `btn-primary`, `d-flex`, etc.).
   - Replace with modern Tailwind classes (`grid grid-cols-2`, `bg-primary`, `flex`, etc.).
   - Replace old Structural Directives (`*ngIf`, `*ngFor`) with new Angular `@if`, `@for` syntax.
4. **Port the Component TS**:
   - Mark the component as `standalone: true`.
   - Use `inject(Service)` instead of constructor injection for a cleaner class outline.
   - Upgrade variables to `signal()` or `computed()`.

---

## 2. Feature Migration Mapping

Here is your migration checklist per module:

### [ ] Phase 1: Personas & Usuarios
- [ ] Port `PersonaService` and port/combine logic with `UserService`.
- [ ] Port `PersonasComponent` template to a modern list layout using `app-data-table`.
- [ ] Migrate modals (add/edit employees) into standalone child components with Reactive Forms.

### [ ] Phase 2: Productos & Platos
- [ ] Port S3 file upload logic to Cloudflare R2 (see [R2 Guide](cloudflare-r2-guide.md)).
- [ ] Migrate table views to standard grid tables.

### [ ] Phase 3: Menús & Notificaciones
- [ ] Port `menu.service.ts` to Signals.
- [ ] Implement Real-time SSE service for stocks or menu updates (see [SSE Guide](sse-guide.md)).

### [ ] Phase 4: Mesas & Pedidos
- [ ] Migrate `mapa-mesas.component` to SVG-based clean layout. Ensure WebSocket/SSE syncs free/occupied states instantly.

### [ ] Phase 5: Reservas & Pasarela de Pago
- [ ] Port pública booking form (reserva-publica). Ensure it has zero authentication dependencies.
- [ ] Port Mercado Pago logic. Store response outcomes via `mp-resultado`.

### [ ] Phase 6: Reportes
- [ ] Replace `google-charts` with modern lightweight `Chart.js` via `ng2-charts`.
- [ ] Keep `jsPDF` and `xlsx` exporters but rewrite data mapping to fit new English types.
