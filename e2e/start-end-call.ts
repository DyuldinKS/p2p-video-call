import { test, expect } from './fixtures';

test('full flow: start a call, join, hang up', async ({ connectedCall }) => {
  const { callerPage } = connectedCall;

  await callerPage.getByRole('button', { name: 'Hang up' }).click();
  await expect(
    callerPage.getByRole('button', { name: 'Start a call' }),
  ).toBeVisible();
});
