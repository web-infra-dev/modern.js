import { it, expect } from '@rstest/core';
import type { App } from '@modelcontextprotocol/ext-apps';
import { observeViewSize } from '../src/ui/sizing';

it('observes inline content only and cleans up across display modes and teardown', () => {
  let mode: string | undefined;
  let starts = 0;
  let stops = 0;
  const listeners = new Set<() => void>();
  const app = {
    getHostContext: () => ({ displayMode: mode }),
    addEventListener: (_: string, listener: () => void) =>
      listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) =>
      listeners.delete(listener),
    setupSizeChangedNotifications: () => {
      starts++;
      return () => {
        stops++;
      };
    },
  } as unknown as App;
  const stop = observeViewSize(app);
  const change = (next: string) => {
    mode = next;
    listeners.forEach(listener => listener());
  };
  expect(starts).toBe(0);
  change('fullscreen');
  expect(starts).toBe(0);
  change('inline');
  change('inline'); // Theme/size updates must not create duplicate observers.
  expect(starts).toBe(1);
  change('fullscreen');
  expect(stops).toBe(1);
  change('inline');
  stop();
  expect(starts).toBe(2);
  expect(stops).toBe(2);
  expect(listeners.size).toBe(0);
});

it('respects explicit low-level autoResize overrides', () => {
  let starts = 0;
  const app = {
    getHostContext: () => ({ displayMode: 'fullscreen' }),
    addEventListener() {},
    removeEventListener() {},
    setupSizeChangedNotifications: () => {
      starts++;
      return () => {};
    },
  } as unknown as App;
  observeViewSize(app, false)();
  expect(starts).toBe(0);
  observeViewSize(app, true)();
  expect(starts).toBe(1);
});
