import { vi, describe, expect, test } from 'vitest';
import { initHooks } from '@/core/initHooks';
import { createStubBuilder } from '@/stub';

describe('initHooks', () => {
  test('should init hooks correctly', async () => {
    const hooks = initHooks();
    expect(Object.keys(hooks)).toMatchSnapshot();
  });
});

describe('onExit hook', () => {
  test('should listen to process exit when calling api.onExit', async () => {
    const spy = vi.spyOn(process, 'on');
    spy.mockImplementation((event, cb) => {
      if (event === 'exit') {
        setTimeout(cb, 0);
      }
      return process;
    });

    const onExit = vi.fn();
    const builder = await createStubBuilder({
      plugins: [
        {
          name: 'foo',
          setup(api) {
            api.onExit(onExit);
          },
        },
      ],
    });
    await builder.unwrapWebpackConfig();

    expect(onExit).toHaveBeenCalledTimes(1);
  });
});
