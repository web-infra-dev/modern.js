import { describe, it, expect } from 'vitest';
import { createStubBuilder } from '@/stub';
import { PluginProgress } from '@/plugins/progress';
import { createFriendlyPercentage } from '@/webpackPlugins/ProgressPlugin/helpers';

describe('plugins/progress', () => {
  it('should register webpackbar by default', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginProgress()],
    });

    const matched = await builder.matchWebpackPlugin('ProgressPlugin');
    expect(matched).toBeTruthy();
  });

  it('should not register webpackbar if dev.progressBar is false', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginProgress()],
      builderConfig: {
        dev: {
          progressBar: false,
        },
      },
    });

    const matched = await builder.matchWebpackPlugin('ProgressPlugin');
    expect(matched).toBeFalsy();
  });
});

describe('createFriendlyPercentage', () => {
  it('should format percentage correctly', () => {
    const friendlyPercentage = createFriendlyPercentage();

    expect(friendlyPercentage(0)).toBe(0);
    expect(friendlyPercentage(0.01)).toBe(0.01);
    expect(friendlyPercentage(0.01)).toBe(0.011);
    expect(friendlyPercentage(0.4)).toBe(0.4);
    expect(friendlyPercentage(0.7)).toBe(0.7);
    expect(friendlyPercentage(0.7)).toBe(0.704);
    expect(friendlyPercentage(0.9)).toBe(0.9);
    expect(friendlyPercentage(0.9)).toBe(0.902);
    expect(friendlyPercentage(1)).toBe(1);
    expect(friendlyPercentage(0)).toBe(0);
  });
});
