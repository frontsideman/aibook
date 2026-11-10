# Analytics: Node 26 and Major Dependency Upgrades

**Date:** 2026-11-11
**Type:** Infrastructure / Dependency Update
**Author:** Maintenance pass

## Summary

Moved the repository to Node.js 26 and upgraded all compatible direct
dependencies to their latest stable major versions, including NestJS 12, Jest 30,
Vitest 5, React 19.3, and the AWS SDK. The full unit test suite, production builds,
Docker images, and the live book lifecycle pass on the new toolchain.

## Version Changes

| Component | Before | After |
|-----------|--------|-------|
| Node.js | 24.4.1 | 26.13.0 |
| NestJS | 10.4.22 | 12.4.2 |
| `@nestjs/config` | 4.0.4 | 12.1.1 |
| `@nestjs/cli` | 10.4.9 | 12.0.12 |
| BullMQ | 5.78.0 | 6.7.3 |
| `@nestjs/bullmq` | 11.0.4 | 12.0.1 |
| ioredis | 5.10.1 | 6.0.0 |
| Jest | 29.7.0 | 30.5.2 |
| ts-jest | 29.4.9 | 29.4.15 |
| TypeScript (backend) | 5.9.3 | 6.0.3 |
| TypeScript (frontend/database) | 5.9.3 | 7.0.2 |
| Vitest | 4.1.12 | 5.1.0 |
| jsdom | 29.1.1 | 31.0.0 |
| React / React DOM | 19.2.7 | 19.3.1 |
| PDFKit | 0.18.0 | 0.20.2 |
| Playwright | 1.60.0 | 1.65.0 |
| Turbo | 2.9.18 | 2.11.10 |
| oxlint | 1.69.0 | 1.93.0 |

## CI/CD Results

| Check | Status |
|-------|--------|
| `npm run format:check` | Pass |
| `npm run lint` | Pass, 0 warnings |
| `npm run typecheck` | Pass |
| `npm run test` | Pass (backend 139, frontend 88) |
| `npm run build` | Pass |
| `docker build -f Dockerfile.backend` | Pass; container `/health` returns ok |
| `docker build -f Dockerfile.frontend` | Pass |
| Opt-in live lifecycle test | Pass on Node 26 |

## Security

| Metric | Before | After |
|--------|--------|-------|
| Critical advisories | 0 | 0 |
| High advisories | 8 | 0 |
| Moderate advisories | 14 | 21 |
| Low advisories | 12 | 2 |
| Total advisories | 34 | 23 |

The NestJS 12 upgrade removed the high-severity platform-express/body-parser,
multer, and CLI tooling findings. Remaining moderate findings are transitive
tooling dependencies.

## Compatibility Notes

- **Backend TypeScript stays on 6.0.3.** `@nestjs/cli` 12 requires the TypeScript 6
  compiler API; TypeScript 7 currently ships only the `tsc` executable. Frontend and
  database use TypeScript 7.0.2.
- **Prisma stays on 7.10.1.** Prisma 8 is only available as `8.0.0-rc.33`; the
  stable client is still 7.10.1.
- **Jest runs with `NODE_OPTIONS=--experimental-vm-modules`.** NestJS 12 packages
  are ESM-only, so Jest uses Node's native `require(esm)` support.
- **Backend uses ESM-only Nest packages.** `@nestjs/platform-express` is declared at
  the workspace root so the hoisted Nest core can resolve the HTTP adapter; the
  Docker runner now copies workspace manifests before `npm prune`.
- **Vitest 5 + jsdom 31 require Node 24.15+/26**, which is why the repository moved
  to Node 26.

## Follow-up

- Adopt TypeScript 7 for the backend when Nest CLI exposes the TS 7 compiler API.
- Adopt Prisma 8 after a stable release.
- Re-run the opt-in live lifecycle test after any further major upgrade.
