# AGENTS.md

Guidance for AI coding agents working in this repository. Human-oriented docs live in [README.md](README.md).

## Overview

This is a moon v2 monorepo. Tool versions are pinned in `.prototools` (moon, node, pnpm, go) and installed with `proto install`.

```
apps/api         Go 1.27 + Gin HTTP API; Postgres via pgx (optional)
apps/web         Vite + React 19 + TypeScript + Tailwind v4 + Vitest
packages/shared  TS types for the API contract (source-only, no build)
.moon/           workspace.yml, toolchains.yml, tasks/{go,node}.yml (inherited tasks)
```

## Commands

Always run tasks through moon, so caching, dependency ordering and toolchain setup apply:

```sh
moon run :dev                 # api (:8080) + web (:5173, proxies /api)
moon run api:test             # one task
moon check --all              # everything CI checks: fmt, vet, test, typecheck, build
moon ci                       # affected tasks only
moon query tasks              # inspect task config as JSON
```

- Install JS deps with `pnpm` (workspace root lockfile). Never use npm or yarn.
- Add Go deps with `go get` inside `apps/api`, then run `go mod tidy`.
- Docker:
  - `pnpm docker:dev` starts the hot-reload stack.
  - `pnpm docker:up` starts the prod-like stack.
  - `pnpm db:up` starts Postgres only.

## Conventions

- **API contract**: the Go response structs in `apps/api/internal/server/router.go` and the types in `packages/shared/src/index.ts` must stay in sync. Change both in the same commit.
- **Go**:
  - Code must be gofmt-clean; `moon run api:fmt` fails otherwise.
  - Keep business logic under `internal/`.
  - Handlers get their dependencies through `server.Deps`.
  - The DB is optional: code must handle `Deps.DB == nil`.
- **Go tests**: table-driven, using `httptest` against `server.NewRouter`. Don't require a live database. Use a fake `Pinger`, or an interface like it.
- **TypeScript**:
  - Strict mode with `noUncheckedIndexedAccess`.
  - Use relative imports with an explicit `.ts`/`.tsx` extension.
  - Use `import type` for type-only imports (`verbatimModuleSyntax`).
- **Web**:
  - Style with Tailwind utility classes; there is no CSS-in-JS.
  - Components are tested with Testing Library, and `fetch` is stubbed with `vi.stubGlobal`.
  - API calls go through `src/api.ts` using relative `/api/...` paths.
- **Config**: runtime config comes only from env vars (`internal/config`). Document new vars in `.env.example`.

## moon specifics (v2)

- Projects are discovered from `apps/*` and `packages/*`. Every project has a `moon.yml` with `language`, `layer` and `stack`.
- Shared tasks live in `.moon/tasks/*.yml` and are scoped with `inheritedBy.toolchains`. Put project-specific tasks in the project's `moon.yml`.
- Long-running tasks use `preset: 'server'`.
- Tasks that shouldn't run in `moon check`/`moon ci` (e.g. `docker`) use `type: 'run'` and `options.runInCI: false`.
- JS tasks whose command is `tsc` need `toolchains: ['javascript', 'node', 'pnpm', 'typescript']`. Without it, `node_modules/.bin` isn't on PATH.
- moon needs at least one git commit to run (it resolves `HEAD`).

## Before you finish

1. `moon check --all` passes.
2. If you touched Dockerfiles or compose files, also run `docker compose config -q` and `docker compose -f docker-compose.dev.yml config -q`.
3. If you touched workflows, also run `actionlint`.
4. Use Conventional Commits (`feat(api): …`, `fix(web): …`, `build(docker): …`, `ci: …`, `docs: …`), one commit per scope.
