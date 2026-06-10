import { expect, test } from '@playwright/test';

test('book happy path scaffold', async ({ page }) => {
  await page.goto('/login');
  await page.evaluate(() => {
    localStorage.setItem(
      'aibook.mock-auth-session',
      JSON.stringify({
        id: 'demo-user',
        email: 'test@example.com',
        name: 'Test Parent',
      })
    );
  });
  await page.goto('/books/new');
  await expect(page.getByText('Create New Book')).toBeVisible();

  // Baseline scaffold: verifies flow entrypoint and stable page shell.
  // Full create->generate->status assertions will be expanded when e2e test data orchestration is in place.
  await expect(page.getByText('Select child profile')).toBeVisible();
});
