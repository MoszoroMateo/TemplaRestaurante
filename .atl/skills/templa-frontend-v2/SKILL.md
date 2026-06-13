---
name: templa-frontend-v2
description: >
  Master guide for building the modern Templa Frontend with Angular 21,
  standalone components, signals, Tailwind v4, and Vitest.
---

# Templa Frontend V2 — Project Skill

## 1. Core Paradigm
- **Framework**: Angular 21 (Standalone, No NgModules)
- **State & Logic**: Fully Signal-driven (Reactive but declarative)
- **Styling**: Tailwind v4 (Zero custom CSS, zero custom border-radius)
- **Testing**: Vitest-first (TDD approach for services and components)
- **Folder Structure**: Core/Shared/Features (Domain-driven lazy loaded routing)

## 2. Directory Map
The skill references supporting guides in this directory:
- [Design Tokens](design-tokens.md) — Spacing, Typography, Theme Colors
- [Component Patterns](component-patterns.md) — Angular + Signals + Tailwind patterns
- [Feature Guide](feature-guide.md) — Steps to build a feature from scratch
- [Testing Guide](testing-guide.md) — Vitest patterns and TDD approach
- [Cloudflare R2 Guide](cloudflare-r2-guide.md) — S3-compatible image upload
- [SSE Guide](sse-guide.md) — Real-time with Server-Sent Events
- [Migration Checklist](migration-checklist.md) — Porting from the old Bootstrap codebase

## 3. The Gold Rules
1. **Never use `NgModel` in new features** unless it's a simple search box. Prefer Reactive Forms (`FormControl` / `FormGroup`) with signals interop.
2. **Never write raw CSS** inside component styles. Use Tailwind v4 util classes only. All design tokens are loaded in `@theme` in `styles.css`.
3. **No custom border-radius**. Use `rounded-none` everywhere to respect the editorial Zen craft identity.
4. **Always declare variables with Signals**. Use `input()`, `output()`, `signal()`, and `computed()`. Do not use normal class fields for reactive state.
5. **Write tests first** for every service method before writing the implementation.
