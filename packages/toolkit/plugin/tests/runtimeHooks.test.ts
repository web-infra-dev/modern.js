import { initHooks } from '../src/runtime/hooks';

describe('runtime hooks', () => {
  test('supports hydration lifecycle hook', () => {
    const hooks = initHooks();
    const events: unknown[] = [];
    const context = {
      isBrowser: true,
    };

    hooks.onHydration.tap(event => {
      events.push(event);
    });

    hooks.onHydration.call({
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
