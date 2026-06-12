# Analytics

Track system metrics over time after major changes.

## When to Create a Report

Create a report when a change affects:
- Build system or pipeline
- Major version updates of key packages (Next.js, NestJS, Prisma, React, etc.)
- Performance characteristics
- Security posture
- Dependency count significantly

**Do not** create reports for:
- Minor bug fixes
- Small feature additions
- Documentation-only changes
- Code style/refactoring

## Naming Convention

```
YYYY-MM-DD-<feature-name>.md
```

Examples:
- `2026-06-12-turbo-v2-migration.md`
- `2026-07-01-nextjs-17-upgrade.md`
- `2026-08-15-bundle-optimization.md`

## Report Template

Each report follows this structure (sections can be added or removed as needed):

```markdown
# Analytics: <Feature Name>

**Date:** YYYY-MM-DD
**Type:** <Infrastructure | Feature | Dependency Update>
**Author:** <who>

## Summary
<1-2 sentences describing the change>

## Version Changes
| Component | Before | After |

## Performance Metrics
| Metric | Value |

## Bundle Size
| Package | Before | After |

## Test Coverage
| Workspace | Before | After |

## Dependencies
| Metric | Before | After |

## Files Changed
| File | Change |

## CI/CD Results
| Check | Status |

## Security
| Metric | Value |

## Benefits
- <improvements>

## Notes
<optional observations>
```

## Reports

| Date | Report | Type |
|------|--------|------|
| 2026-06-12 | [Turborepo v1 → v2](./2026-06-12-turbo-v2-migration.md) | Infrastructure |
