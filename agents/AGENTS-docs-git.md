# Docs & Git Conventions

## Documentation Location

Planning and design artifacts live under `docs/superpowers/`:

- `specs/` — design docs
- `plans/` — implementation plans

Recent docs already cover the current auth and book-creation direction. Check those before inventing new patterns for the same area.

### Backlog
Future work tracked in [`../backlog.md`](../backlog.md) and summarized in [`AGENTS-backlog.md`](./AGENTS-backlog.md).

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
- Avoid mixing unrelated frontend, backend, and docs work in the same commit unless they are part of one cohesive change