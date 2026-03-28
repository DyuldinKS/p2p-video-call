import { Page } from '@playwright/test';
import { test, expect } from './fixtures';

const getRemoteVideoStats = (page: Page) =>
  page.evaluate(async () => {
    const remote = document.querySelector<HTMLVideoElement>(
      '[aria-label="Remote video"]',
    );
    if (!remote) return null;

    const before = remote.getVideoPlaybackQuality();
    await new Promise((r) => setTimeout(r, 1_000));
    const after = remote.getVideoPlaybackQuality();

    return {
      width: remote.videoWidth,
      height: remote.videoHeight,
      frameRate:
        (after.totalVideoFrames - before.totalVideoFrames) /
        ((after.creationTime - before.creationTime) / 1_000),
    };
  });

test('users see each other: video > 360p and frame rate > 5 fps', async ({
  connectedCall,
}) => {
  const { callerPage, calleePage } = connectedCall;

  for (const page of [callerPage, calleePage]) {
    await page.waitForFunction(
      () =>
        (document.querySelector<HTMLVideoElement>('[aria-label="Remote video"]')
          ?.videoWidth ?? 0) > 0,
      { timeout: 10_000 },
    );

    const stats = await getRemoteVideoStats(page);

    expect(stats).not.toBeNull();
    expect(Math.max(stats!.width, stats!.height)).toBeGreaterThan(360);
    expect(stats!.frameRate).toBeGreaterThan(5);
  }
});
