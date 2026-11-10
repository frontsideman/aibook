import { expect, test } from '@playwright/test';

test.skip(process.env.E2E_REAL_BACKEND !== '1', 'requires a running backend and fake LLM');

test('profile → book → review → approve → PDF with live settings', async ({ page }) => {
  const profileName = `Nina Live ${Date.now()}`;

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

  // Profile creation
  await page.goto('/profiles');
  await page.getByRole('button', { name: 'Add Profile' }).click();
  await page.getByLabel('Name').fill(profileName);
  await page.getByLabel('Age').fill('7');
  await page.getByLabel('Interests').fill('stars, dragons');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText(profileName)).toBeVisible();

  // Live generation settings
  await page.goto('/settings');
  await expect(page.getByText('Generation defaults')).toBeVisible();
  await page.getByLabel('Text model').selectOption('fake-story-model-pro');
  await page.getByLabel('Reasoning effort').selectOption('HIGH');
  await page.getByRole('button', { name: 'Save generation settings' }).click();
  await expect(page.getByRole('status')).toHaveText('Generation settings saved.');

  // Book creation
  await page.goto('/books/new');
  await page.getByRole('button', { name: new RegExp(profileName) }).click();
  await page.getByRole('textbox', { name: 'Story' }).fill('Cinderella');
  await page.getByRole('button', { name: 'Watercolor' }).click();
  await page.getByRole('button', { name: 'Create Book' }).click();

  // Generation → review
  await page.waitForURL(/\/books\/[^/]+\/preview$/, { timeout: 30_000 });
  await expect(page.getByRole('button', { name: '✅ Approve Book' })).toBeVisible();
  await page.getByRole('button', { name: '✅ Approve Book' }).click();

  // Completed detail + PDF
  await page.waitForURL(/\/books\/[^/]+$/, { timeout: 15_000 });
  await expect(page.getByRole('button', { name: 'Download PDF' })).toBeVisible();
  const bookId = new URL(page.url()).pathname.split('/').pop();
  expect(bookId).toBeTruthy();

  const pdfResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' && /\/api\/books\/[^/]+\/pdf$/.test(response.url())
  );

  await page.route('http://localhost:9000/**', (route) => route.abort());
  await page.getByRole('button', { name: 'Download PDF' }).click();

  const pdfResponse = await pdfResponsePromise;
  expect(pdfResponse.ok()).toBe(true);

  const storedPdfResponse = await page.request.get(`/api/books/${bookId}/pdf`);
  expect(storedPdfResponse.ok()).toBe(true);
  const { pdfUrl } = (await storedPdfResponse.json()) as { pdfUrl: string };
  expect(pdfUrl).toContain('/aibook/books/');

  const pdfFile = await page.request.get(pdfUrl);
  expect(pdfFile.ok()).toBe(true);
  expect(pdfFile.headers()['content-type']).toContain('application/pdf');
  expect((await pdfFile.body()).length).toBeGreaterThan(1000);

  // The newly created book must use the settings saved above.
  const llmRequest = await page.request.get('http://127.0.0.1:4010/last');
  const payload = (await llmRequest.json()) as {
    model?: string;
    reasoning_effort?: string;
  };
  expect(payload.model).toBe('fake-story-model-pro');
  expect(payload.reasoning_effort).toBe('high');
});
