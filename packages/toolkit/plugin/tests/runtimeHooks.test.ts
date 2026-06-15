import { createRuntime } from '../src/runtime/run/create';

describe('runtime hooks', () => {
  test('supports hydration lifecycle hook', () => {
    const runtime = createRuntime();
    const events: unknown[] = [];
    const context = {
      isBrowser: true,
    };
    const { runtimeContext } = runtime.run({
      config: {},
      plugins: [
        {
          name: 'hydration-plugin',
          setup(api) {
            api.onHydration(event => {
              events.push(event);
            });
          },
        },
      ],
    });

    runtimeContext.hooks.onHydration.call({
      type: 'start',
      context,
      renderLevel: 1,
      renderMode: 'string',
    });

    expect(events).toEqual([
      {
        type: 'start',
        context,
        renderLevel: 1,
        renderMode: 'string',
      },
    ]);
  });
});
