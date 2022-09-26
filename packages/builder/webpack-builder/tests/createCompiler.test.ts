import { describe, expect, test, vi } from 'vitest';
import { createStubBuilder } from '../src/stub';

describe('build hooks', () => {
  test('should call onBeforeBuild hook before build', async () => {
    const fn = vi.fn();
    const builder = await createStubBuilder({
      plugins: [
        {
          name: 'foo',
          setup(api) {
            api.onBeforeBuild(fn);
          },
        },
      ],
    });

    await builder.build();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('should call onBeforeBuild hook before build in watch mode', async () => {
    const fn = vi.fn();
    const builder = await createStubBuilder({
      plugins: [
        {
          name: 'foo',
          setup(api) {
            api.onBeforeBuild(fn);
          },
        },
      ],
      buildOptions: {
        watch: true,
      },
    });

    await builder.build();
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
