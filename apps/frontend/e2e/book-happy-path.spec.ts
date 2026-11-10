import { expect, test } from '@playwright/test';

test('create-book form becomes ready with a profile, story, and style', async ({ page }) => {
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());

    if (url.pathname === '/api/child-profiles') {
      await route.fulfill({
        json: [{ id: 'profile-1', name: 'Nina', age: 7, gender: 'female', interests: ['stars'] }],
      });
      return;
    }

    if (url.pathname === '/api/stories') {
      await route.fulfill({ json: [{ title: 'Cinderella' }] });
      return;
    }

    if (url.pathname === '/api/books') {
      await route.fulfill({
        json: {
          books: [],
          total: 0,
          page: 1,
          totalPages: 1,
          statusCounts: {},
        },
      });
      return;
    }

    await route.fulfill({ status: 404, json: { message: 'Not stubbed' } });
  });

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
  await expect(page.getByText('Select child profile')).toBeVisible();

  await page.getByRole('button', { name: 'Select Nina, 7 years old' }).click();
  await page.getByRole('textbox', { name: 'Story' }).fill('Cinderella');
  await page.getByRole('button', { name: 'Watercolor' }).click();

  await expect(page.getByRole('button', { name: 'Create Book' })).toBeEnabled();
});
