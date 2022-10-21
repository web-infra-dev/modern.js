import { describe, it } from 'vitest';
import { createStubBuilder } from '@/stub';

describe('getNormalizedConfig', () => {
  it.skip('should return normalized config', async () => {
    const builder = await createStubBuilder();
    // builder.hooks.modifyWebpackChainHook(() => {})
    await builder.build();
  });
});
