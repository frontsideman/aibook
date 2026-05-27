# CI Quality Gate Design (Core Gate)

Date: 2026-05-27
Status: Approved for spec write
Scope: Sub-project 4 from stability roadmap

## 1. Goal and Success Criteria

Define a mandatory CI quality gate for the workspace before merge.

Success criteria:
1. CI contract explicitly requires `lint`, `typecheck`, `test`, and `build` checks.
2. Merge is blocked when any required check fails or is missing.
3. Root workspace commands are the canonical entrypoint for quality checks.

## 2. Scope

In scope:
- Functional CI gate contract definition
- Required-check policy for pull requests
- Merge blocking behavior definition

Out of scope:
- Editing CI YAML files
- Runtime optimization of job graph (parallelization, caching, timeout tuning)
- Docker profile checks

## 3. CI Gate Contract

Required quality checks:
- `lint`
- `typecheck`
- `test`
- `build`

Policy:
- All required checks must succeed before merge.
- A failed required check blocks merge.
- A missing required check configuration is treated as contract violation and must be fixed before merge policy is considered complete.

Execution source of truth:
- Workspace root scripts (`npm run ...`) are canonical and should be invoked by CI.

## 4. Error Flow

- If any check exits non-zero, CI status is failed and merge is blocked.
- If one required stage is absent, merge policy is considered incomplete; remediation is required.
- If flaky behavior appears later, it will be addressed in a dedicated optimization phase, not in this contract definition pass.

## 5. Risks and Mitigations

Risk: CI runtime may increase once all gates are enforced.
- Mitigation: accept initial latency for correctness, optimize in a later pass.

Risk: Existing scripts may not yet fully support `typecheck` in all workspaces.
- Mitigation: this spec defines target contract first; implementation phase will close script gaps.

## 6. Acceptance Checklist

- [ ] Contract defines 4 required checks: lint, typecheck, test, build.
- [ ] Contract defines merge-blocking behavior on any failed required check.
- [ ] Contract states root workspace scripts as canonical CI entrypoint.
- [ ] Contract explicitly excludes CI YAML implementation details from this cycle.
