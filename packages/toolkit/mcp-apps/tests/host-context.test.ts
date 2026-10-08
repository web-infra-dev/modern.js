import type { McpUiHostContext } from '@modelcontextprotocol/ext-apps';
import { expect, it } from '@rstest/core';
import {
  canRequestDisplayMode,
  subscribeHostContext,
} from '../src/runtime/host-context';

it('requests only modes advertised by the host', () => {
  expect(canRequestDisplayMode(undefined, 'fullscreen')).toBe(false);
  expect(
    canRequestDisplayMode({ availableDisplayModes: ['inline'] }, 'fullscreen'),
  ).toBe(false);
  expect(
    canRequestDisplayMode(
      { availableDisplayModes: ['inline', 'fullscreen'] },
      'fullscreen',
    ),
  ).toBe(true);
});

it('synchronizes initial context and cleans up only its own listener', () => {
  type Listener = (context: McpUiHostContext) => void;
  const listeners = new Set<Listener>();
  const remoteListener: Listener = () => {};
  listeners.add(remoteListener);
  const received: McpUiHostContext[] = [];
  const cleanup = subscribeHostContext(
    {
      getHostContext: () => ({ displayMode: 'fullscreen' }),
      addEventListener: (_event, listener) => {
        listeners.add(listener);
      },
      removeEventListener: (_event, listener) => {
        listeners.delete(listener);
      },
    },
    context => received.push(context),
  );
  expect(received).toEqual([{ displayMode: 'fullscreen' }]);
  for (const listener of listeners) listener({ displayMode: 'inline' });
  expect(received[1]).toEqual({ displayMode: 'inline' });
  cleanup();
  expect([...listeners]).toEqual([remoteListener]);
});
