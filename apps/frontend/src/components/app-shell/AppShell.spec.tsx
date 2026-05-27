import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AppShell } from './AppShell';
import { navItems } from './nav-items';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

describe('AppShell', () => {
  it('renders MVP navigation links', () => {
    render(
      <AppShell>
        <div>content</div>
      </AppShell>,
    );

    for (const item of navItems) {
      expect(
        screen.getByRole('link', {
          name: item.label,
        }),
      ).toHaveAttribute('href', item.href);
    }
  });
});
