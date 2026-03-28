import { test as base, expect, Browser, Page } from '@playwright/test';

type ConnectedCall = {
  callerPage: Page;
  calleePage: Page;
};

const buildConnectedCall = async (browser: Browser) => {
  const callerCtx = await browser.newContext({
    permissions: ['camera', 'microphone'],
  });
  const calleeCtx = await browser.newContext({
    permissions: ['camera', 'microphone'],
  });

  const callerPage = await callerCtx.newPage();
  const calleePage = await calleeCtx.newPage();

  await callerPage.goto('/');
  await callerPage.getByRole('button', { name: 'Start a call' }).click();

  const offerTextarea = callerPage
    .locator('span', { hasText: 'Your offer' })
    .locator('..')
    .locator('textarea');
  await expect(offerTextarea).not.toBeEmpty({ timeout: 15_000 });
  const compressedOffer = await offerTextarea.inputValue();

  await calleePage.goto(`/${compressedOffer}`);

  const answerTextarea = calleePage
    .locator('span', { hasText: 'Your answer' })
    .locator('..')
    .locator('textarea');
  await expect(answerTextarea).not.toBeEmpty({ timeout: 15_000 });
  const compressedAnswer = await answerTextarea.inputValue();

  await callerPage
    .locator('textarea[placeholder="Paste answer"]')
    .fill(compressedAnswer);
  await callerPage.getByRole('button', { name: 'Connect' }).click();

  await expect(callerPage.getByRole('button', { name: 'Hang up' })).toBeVisible(
    { timeout: 20_000 },
  );
  await expect(calleePage.getByRole('button', { name: 'Hang up' })).toBeVisible(
    { timeout: 20_000 },
  );

  return { callerPage, calleePage, callerCtx, calleeCtx };
};

const hangUpIfPresent = async (page: Page) => {
  const hangUp = page.getByRole('button', { name: 'Hang up' });
  if (await hangUp.isVisible().catch(() => false)) {
    await hangUp.click().catch(() => {});
  }
};

export const test = base.extend<{ connectedCall: ConnectedCall }>({
  connectedCall: async ({ browser }, use) => {
    const { callerPage, calleePage, callerCtx, calleeCtx } =
      await buildConnectedCall(browser);

    await use({ callerPage, calleePage });

    await hangUpIfPresent(callerPage);
    await hangUpIfPresent(calleePage);
    await callerCtx.close();
    await calleeCtx.close();
  },
});

export { expect } from '@playwright/test';
