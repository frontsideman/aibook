# Docs & Git Conventions

## Documentation Location

Planning and design artifacts live under `docs/superpowers/`:

- `specs/` — design docs
- `plans/` — implementation plans

Recent docs cover auth, the book creation flow, settings, and code-quality
hardening. Check them before inventing new patterns for the same area.

Architecture diagrams live in `docs/architecture/project-directories.mmd.md`.

### Backlog

Future work is tracked in [`AGENTS-backlog.md`](./AGENTS-backlog.md).

## Git Conventions

Always use Conventional Commits format for git commit messages:

**Format:** `<type>(<scope>): <description>`

### Allowed Types

- `feat` — new feature
- `fix` — bug fix
- `docs` — documentation only
- `style` — code style changes (formatting, missing semicolons, etc.)
- `refactor` — code change that neither fixes a bug nor adds a feature
- `perf` — performance improvement
- `test` — adding missing tests
- `chore` — changes to build process or auxiliary tools

### Examples

- `feat(auth): add login functionality`
- `fix(api): handle null response`
- `docs(readme): update installation guide`

### Rules

- Always write commit messages in English
- Keep the first line under 72 characters
- Group logically related changes together
- Avoid mixing unrelated frontend, backend, and docs work in the same commit unless
  they are part of one cohesive change

## Analytics Reports

Track system metrics over time in `docs/analytics/`:

- **Naming:** `YYYY-MM-DD-<feature-name>.md`
- **When to create:** Build-affecting changes, major version updates of key packages
- **Content:** Version changes, performance metrics, bundle size, test coverage,
  dependencies, CI/CD results, security status
- **Language:** English (like all documentation)
- **Template:** See `docs/analytics/README.md`

## Code Review Standards

Before any git commit:

1. Verify the commit message follows Conventional Commits format
2. If the format is incorrect, suggest the correct format
3. Ask the user to confirm or rewrite the message

## Git Workflow

When asked to commit changes:

1. Review the changes first
2. Generate a conventional commit message
3. Never create commits with non-conventional messages unless explicitly requested

## PR Quality Gates (`.github/workflows/pr-checks.yml`)

Automated checks on every PR:

- **Commitlint**: all commits follow Conventional Commits
- **PR Size**: warning if more than 500 lines changed
- **Labels**: at least one label required

These run via GitHub Actions and block merge if branch protection requires them.
