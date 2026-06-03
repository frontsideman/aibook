# shadcn/ui usage conventions

- Use semantic tokens only: `bg-background`, `text-foreground`, `border-border`, `text-muted-foreground`, `bg-primary`, `text-primary-foreground`.
- Avoid raw colors (`text-blue-*`, `bg-gray-*`, hex values) in new UI code.
- Prefer primitives from `@/components/ui/*` before creating custom styled wrappers.
- Use `cn()` from `@/lib/utils` for conditional classes.
