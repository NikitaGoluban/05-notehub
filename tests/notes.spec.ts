import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const endpoint = 'https://notehub-public.goit.study/api/notes';
const note = (id: string, title = `Note ${id}`) => ({
  id,
  title,
  content: 'A useful note',
  tag: 'Todo',
  createdAt: '2026-11-09T12:00:00.000Z',
  updatedAt: '2026-11-09T12:00:00.000Z',
});

async function openForm(page: Page) {
  await page.getByRole('button', { name: 'Create note +' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
}

test('paginates and sends one debounced search from page one', async ({
  page,
}) => {
  const searches: URL[] = [];
  await page.route(`${endpoint}**`, async (route) => {
    const url = new URL(route.request().url());
    expect(route.request().headers().authorization).toBe(
      'Bearer e2e-test-token',
    );
    expect(url.searchParams.get('perPage')).toBe('12');
    if (url.searchParams.has('search')) searches.push(url);
    await route.fulfill({
      json: {
        notes: [
          note(
            '1',
            url.searchParams.get('search') ||
              `Page ${url.searchParams.get('page')}`,
          ),
        ],
        totalPages: url.searchParams.has('search') ? 1 : 4,
      },
    });
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Page 1' })).toBeVisible();
  await page.getByRole('button', { name: 'Page 3', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Page 3' })).toBeVisible();
  await page
    .getByRole('textbox', { name: 'Search notes' })
    .pressSequentially('project', { delay: 25 });
  await expect(
    page.getByRole('heading', { name: 'project', exact: true }),
  ).toBeVisible();
  expect(searches).toHaveLength(1);
  expect(searches[0].searchParams.get('page')).toBe('1');
  await expect(page.getByRole('navigation')).toHaveCount(0);
});

test('validates title and content boundaries before creating a note', async ({
  page,
}) => {
  let created = false;
  await page.route(`${endpoint}**`, async (route) => {
    if (route.request().method() === 'POST') {
      expect(route.request().postDataJSON()).toEqual({
        title: 'abc',
        content: '',
        tag: 'Work',
      });
      created = true;
      await route.fulfill({ status: 201, json: note('new', 'abc') });
    } else {
      await route.fulfill({
        json: { notes: created ? [note('new', 'abc')] : [], totalPages: 1 },
      });
    }
  });
  await page.goto('/');
  await openForm(page);
  const submit = page.getByRole('button', { name: 'Create note', exact: true });
  await submit.click();
  await expect(page.getByText('Title is required')).toBeVisible();
  await page.getByLabel('Title', { exact: true }).fill('ab');
  await submit.click();
  await expect(
    page.getByText('Title must be at least 3 characters'),
  ).toBeVisible();
  await page.getByLabel('Title', { exact: true }).fill('a'.repeat(51));
  await submit.click();
  await expect(
    page.getByText('Title must be at most 50 characters'),
  ).toBeVisible();
  await page.getByLabel('Title', { exact: true }).fill('abc');
  await page.getByLabel('Content', { exact: true }).fill('a'.repeat(501));
  await submit.click();
  await expect(
    page.getByText('Content must be at most 500 characters'),
  ).toBeVisible();
  expect(created).toBe(false);
  await page.getByLabel('Content', { exact: true }).fill('');
  await page.getByLabel('Tag', { exact: true }).selectOption('Work');
  await submit.click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'abc' })).toBeVisible();
});

test('modal uses a portal, traps focus, and closes with Escape, backdrop, or Cancel', async ({
  page,
}) => {
  await page.route(`${endpoint}**`, (route) =>
    route.fulfill({ json: { notes: [], totalPages: 0 } }),
  );
  await page.goto('/');
  await openForm(page);
  await expect(page.locator('#root [role="dialog"]')).toHaveCount(0);
  await expect(page.getByLabel('Title', { exact: true })).toBeFocused();
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
  await page.keyboard.press('Shift+Tab');
  await expect(
    page.getByRole('button', { name: 'Create note', exact: true }),
  ).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Title', { exact: true })).toBeFocused();
  await page.getByLabel('Content', { exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Create note +' }),
  ).toBeFocused();
  await openForm(page);
  await page.getByRole('dialog').click({ position: { x: 5, y: 5 } });
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await openForm(page);
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
});

test('deletes the last note on the last page and returns to the previous page', async ({
  page,
}) => {
  let deleted = false;
  await page.route(`${endpoint}**`, async (route) => {
    if (route.request().method() === 'DELETE') {
      expect(route.request().url()).toBe(`${endpoint}/last`);
      deleted = true;
      await route.fulfill({ json: note('last') });
    } else {
      const secondPage =
        new URL(route.request().url()).searchParams.get('page') === '2';
      await route.fulfill({
        json: {
          notes: secondPage ? (deleted ? [] : [note('last')]) : [note('first')],
          totalPages: deleted ? 1 : 2,
        },
      });
    }
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Page 2', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Note last' })).toBeVisible();
  await page.getByRole('button', { name: 'Delete Note last' }).click();
  await expect(page.getByRole('heading', { name: 'Note first' })).toBeVisible();
  await expect(page.getByRole('navigation')).toHaveCount(0);
  expect(deleted).toBe(true);
});

test('keeps pagination valid when deleting reduces three pages to two', async ({
  page,
}) => {
  let deleted = false;
  const browserErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'warning' || message.type() === 'error') {
      browserErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));

  await page.route(`${endpoint}**`, async (route) => {
    if (route.request().method() === 'DELETE') {
      deleted = true;
      await route.fulfill({ json: note('last') });
      return;
    }

    const requestedPage = Number(
      new URL(route.request().url()).searchParams.get('page'),
    );
    await route.fulfill({
      json: {
        notes:
          requestedPage === 3
            ? deleted
              ? []
              : [note('last')]
            : [note(String(requestedPage), `Page ${requestedPage}`)],
        totalPages: deleted ? 2 : 3,
      },
    });
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'Page 3', exact: true }).click();
  await page.getByRole('button', { name: 'Delete Note last' }).click();
  await expect(page.getByRole('heading', { name: 'Page 2' })).toBeVisible();
  await expect(
    page.getByRole('navigation').locator('[aria-current="page"]'),
  ).toHaveText('2');
  expect(browserErrors).toEqual([]);
});

test('disables deletion while pending and invalidates previously cached pages', async ({
  page,
}) => {
  let deleted = false;
  let deleteRequests = 0;
  let completeDelete: (() => void) | undefined;
  const deletion = new Promise<void>((resolve) => {
    completeDelete = resolve;
  });

  await page.route(`${endpoint}**`, async (route) => {
    if (route.request().method() === 'DELETE') {
      deleteRequests += 1;
      await deletion;
      deleted = true;
      await route.fulfill({ json: note('target') });
      return;
    }

    const secondPage =
      new URL(route.request().url()).searchParams.get('page') === '2';
    await route.fulfill({
      json: {
        notes: secondPage
          ? [note('other', deleted ? 'Refreshed page 2' : 'Cached page 2')]
          : deleted
            ? [note('keep')]
            : [note('target'), note('keep')],
        totalPages: 2,
      },
    });
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'Page 2', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Cached page 2' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Page 1', exact: true }).click();
  await page.getByRole('button', { name: 'Delete Note target' }).click();
  await expect(
    page.getByRole('button', { name: 'Delete Note target' }),
  ).toHaveText('Deleting...');
  await expect(
    page.getByRole('button', { name: 'Delete Note keep' }),
  ).toBeDisabled();
  expect(deleteRequests).toBe(1);

  completeDelete?.();
  await expect(page.getByRole('heading', { name: 'Note target' })).toHaveCount(
    0,
  );
  await page.getByRole('button', { name: 'Page 2', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Refreshed page 2' }),
  ).toBeVisible();
});

test('shows loading, request errors with retry, and an empty search', async ({
  page,
}) => {
  let fail = true;
  await page.route(`${endpoint}**`, async (route) => {
    if (fail)
      await route.fulfill({ status: 500, json: { message: 'Test error' } });
    else await route.fulfill({ json: { notes: [], totalPages: 0 } });
  });
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('Could not load notes');
  fail = false;
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('status')).toContainText('No notes yet');
  await page.getByRole('textbox', { name: 'Search notes' }).fill('absent');
  await expect(page.getByRole('status')).toContainText('No notes found');
  await expect(page.getByRole('list')).toHaveCount(0);
  await expect(page.getByRole('navigation')).toHaveCount(0);
});

test('keeps form values and notes when mutations fail', async ({ page }) => {
  await page.route(`${endpoint}**`, async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: { notes: [note('1')], totalPages: 1 } });
    } else
      await route.fulfill({ status: 500, json: { message: 'Test error' } });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Delete Note 1' }).click();
  await expect(page.getByRole('alert')).toContainText('Could not delete');
  await expect(page.getByRole('heading', { name: 'Note 1' })).toBeVisible();
  await openForm(page);
  await page.getByLabel('Title', { exact: true }).fill('Keep this title');
  await page.getByRole('button', { name: 'Create note', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText(
    'Could not create',
  );
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue(
    'Keep this title',
  );
});

test('fits a 320px mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.route(`${endpoint}**`, (route) =>
    route.fulfill({ json: { notes: [note('1')], totalPages: 4 } }),
  );
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Note 1' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    320,
  );
  await openForm(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    320,
  );
  await expect(
    page.getByRole('button', { name: 'Create note', exact: true }),
  ).toBeInViewport();
});
