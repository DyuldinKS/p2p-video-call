import { Page } from '@playwright/test';
import { test, expect } from './fixtures';

type VideoStats = { brightness: number; fps: number };

// Samples the remote video over 2 seconds and returns average brightness and fps
const measureRemoteVideo = (page: Page): Promise<VideoStats | null> =>
  page.evaluate(
    () =>
      new Promise<VideoStats | null>((resolve) => {
        const remote = document.querySelector<HTMLVideoElement>(
          '[aria-label="Remote video"]',
        );
        if (!remote || remote.videoWidth === 0) return resolve(null);

        const canvas = document.createElement('canvas');
        canvas.width = remote.videoWidth;
        canvas.height = remote.videoHeight;
        const ctx = canvas.getContext('2d')!;

        const sampleBrightness = () => {
          ctx.drawImage(remote, 0, 0);
          const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
          let sum = 0;
          for (let i = 0; i < data.length; i += 4) {
            sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
          }
          return sum / (data.length / 4);
        };

        const brightnessReadings: number[] = [];
        const startFrames = remote.getVideoPlaybackQuality().totalVideoFrames;
        const startTime = performance.now();

        const interval = setInterval(
          () => brightnessReadings.push(sampleBrightness()),
          200,
        );

        setTimeout(() => {
          clearInterval(interval);
          const endQuality = remote.getVideoPlaybackQuality();
          const elapsed = (performance.now() - startTime) / 1_000;
          const fps = (endQuality.totalVideoFrames - startFrames) / elapsed;
          const brightness =
            brightnessReadings.reduce((a, b) => a + b, 0) /
            brightnessReadings.length;
          resolve({ brightness, fps });
        }, 2_000);
      }),
  );

test('camera toggle: user2 stops seeing user1 when camera off, resumes when on', async ({
  connectedCall,
}) => {
  const { callerPage, calleePage } = connectedCall;

  // Wait for callee to receive active video from caller
  await calleePage.waitForFunction(
    () =>
      (document.querySelector<HTMLVideoElement>('[aria-label="Remote video"]')
        ?.videoWidth ?? 0) > 0,
    { timeout: 10_000 },
  );

  const statsActive = await measureRemoteVideo(calleePage);
  expect(statsActive).not.toBeNull();
  expect(statsActive!.brightness).toBeGreaterThan(5);
  expect(statsActive!.fps).toBeGreaterThan(5);

  // Caller turns camera off — remote should receive black frames
  await callerPage.getByRole('button', { name: 'Camera' }).click();

  const statsOff = await measureRemoteVideo(calleePage);
  expect(statsOff).not.toBeNull();
  expect(statsOff!.brightness).toBeLessThan(5);

  // Caller turns camera back on — remote should return to bright frames
  await callerPage.getByRole('button', { name: 'Camera' }).click();

  const statsRestored = await measureRemoteVideo(calleePage);
  expect(statsRestored).not.toBeNull();
  expect(statsRestored!.brightness).toBeGreaterThan(5);
  expect(statsRestored!.fps).toBeGreaterThan(5);
});
