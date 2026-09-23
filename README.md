# dummyapps

A base template for a monorepo with a **Go (Gin) API** and a **Vite + React + Tailwind** web app, managed with [moon](https://moonrepo.dev) and [proto](https://moonrepo.dev/proto).

| Project | Path | Stack |
| --- | --- | --- |
| `api` | [apps/api](apps/api) | Go 1.27, Gin, pgx (Postgres, optional) |
| `web` | [apps/web](apps/web) | Vite, React 19, TypeScript, Tailwind v4, Vitest |
| `shared` | [packages/shared](packages/shared) | TypeScript types for the API contract |

## Prerequisites

- [proto](https://moonrepo.dev/docs/proto/install): `curl -fsSL https://moonrepo.dev/install/proto.sh | bash`
- Docker (only needed for the compose workflows)

Tool versions (moon, node, pnpm, go) are pinned in [.prototools](.prototools):

```sh
proto install     # installs moon, node, pnpm, go at the pinned versions
pnpm install
```

## Development

### On the host

```sh
moon run :dev                 # api on :8080 + web on :5173 (proxies /api → :8080)
moon run api:dev              # just one project
```

The API runs **without a database** unless `DATABASE_URL` is set. To use Postgres:

```sh
pnpm db:up                    # starts postgres from docker-compose.yml
DATABASE_URL=postgres://app:app@localhost:5432/app?sslmode=disable moon run :dev
```

If port 8080 is taken, set `PORT` for the API and `API_PROXY_TARGET` for Vite:

```sh
PORT=18080 API_PROXY_TARGET=http://localhost:18080 moon run :dev
```

### In Docker (hot reload)

```sh
pnpm docker:dev               # docker compose -f docker-compose.dev.yml up --build
```

- `api` runs under [air](https://github.com/air-verse/air), which rebuilds when a `.go` file changes.
- `web` runs the Vite dev server with polling enabled, so HMR works over bind mounts.
- Open http://localhost:5173.

## Checks

```sh
moon check --all              # gofmt, go vet, go test, tsc, vitest, builds
moon ci                       # only tasks affected by your changes (what CI runs)
```

| Task | Projects | Command |
| --- | --- | --- |
| `fmt` / `vet` / `test` | api | `gofmt -l`, `go vet`, `go test` (inherited from [.moon/tasks/go.yml](.moon/tasks/go.yml)) |
| `typecheck` | web, shared | `tsc --noEmit` (inherited from [.moon/tasks/node.yml](.moon/tasks/node.yml)) |
| `build` | api, web | `go build` → `apps/api/bin/api`, `vite build` → `apps/web/dist` |
| `test` | web | `vitest run` |
| `docker` | api, web | build the production image locally (not run by `check`/`ci`) |

## Production images

```sh
pnpm docker:up                # docker compose up --build → http://localhost:5173
```

- **api**: a static binary on `distroless/static:nonroot` (~30 MB). `/api -healthcheck` is used as the container healthcheck.
- **web**: static assets served by nginx, which proxies `/api/` to `$API_UPSTREAM` (default `http://api:8080`).
- **postgres**: `postgres:18-alpine`, stored in the `pgdata` volume.

Host ports and credentials can be overridden in `.env` (see [.env.example](.env.example)).

## CI/CD

- [ci.yml](.github/workflows/ci.yml) runs on PRs and pushes to `main`. It runs `moon ci` (affected tasks only) and posts a run report on the PR, then checks that both Docker images build.
- [release.yml](.github/workflows/release.yml) runs on pushes to `main` and `v*.*.*` tags. It pushes multi-arch images to GHCR:
  - `ghcr.io/<owner>/<repo>-api`
  - `ghcr.io/<owner>/<repo>-web`

  Images are tagged with the branch, semver, `sha-…` and `latest`.
- [dependabot.yml](.github/dependabot.yml) sends weekly updates for Go modules, npm, Actions and Docker base images.

## Using this as a template

1. Replace the module path `github.com/zekhoi/dummyapps/apps/api` in [apps/api/go.mod](apps/api/go.mod) and in its imports.
2. Rename `@dummyapps/shared` and the `dummyapps` compose project names.
3. Add a project by creating `apps/<name>` or `packages/<name>` with a `moon.yml`. moon picks it up through the globs in [.moon/workspace.yml](.moon/workspace.yml).
