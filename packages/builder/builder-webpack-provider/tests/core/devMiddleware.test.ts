import { describe, expect, test, vi } from 'vitest';
import webpack from 'webpack';
import { getDevMiddleware } from '@/core/devMiddleware';

describe('test dev middleware', () => {
  test('should inject entry and setup hooks', () => {
    const compiler = webpack({});
    const middleware = getDevMiddleware(compiler);

    const onDoneFn = vi.fn();
    const onInvalidFn = vi.fn();

    middleware({
      hmrClientPath: 'http://mock-path',
      callbacks: {
        onDone: onDoneFn,
        onInvalid: onInvalidFn,
      },
    });

    const entryPluginHook = compiler.hooks.compilation.taps.filter(
      tap => tap.name === 'EntryPlugin',
    );

    expect(entryPluginHook.length).toBe(2);

    const isRegistered = compiler.hooks.done.taps.some(
      tap => tap.fn === onDoneFn,
    );

    expect(isRegistered).toBeTruthy();
  });

  test('should not inject entry when hmrClientPath is undefined', () => {
    const compiler = webpack({});
    const middleware = getDevMiddleware(compiler);

    middleware({
      callbacks: {
        onDone: vi.fn(),
        onInvalid: vi.fn(),
      },
    });

    const entryPluginHook = compiler.hooks.compilation.taps.filter(
      tap => tap.name === 'EntryPlugin',
    );
    expect(entryPluginHook.length).toBe(1);
  });
});
