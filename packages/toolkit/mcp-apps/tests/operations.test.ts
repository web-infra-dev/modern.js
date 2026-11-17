import { it, expect } from '@rstest/core';
import type { App } from '@modelcontextprotocol/ext-apps';
import { createMcpOperationScope } from '../src/ui/operations';

function fixture() {
  const listeners = new Set<() => void>();
  let key = 'account-a/thread-a';
  const app = {
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
  } as unknown as App;
  const scope = createMcpOperationScope(app, () => key);
  return {
    scope,
    listeners,
    change(next: string) {
      key = next;
      for (const listener of listeners) listener();
    },
  };
}
it('aborts old scope requests and rejects late results, allowing the new scope to run', async () => {
  const f = fixture();
  const dispose = f.scope.listen();
  let release!: (value: string) => void;
  let signal!: AbortSignal;
  const result = f.scope.run(options => {
    signal = options.signal;
    return new Promise<string>(resolve => {
      release = resolve;
    });
  });
  f.change('account-a/thread-b');
  expect(signal.aborted).toBe(true);
  release('old');
  await expect(result).rejects.toThrow('expired scope');
  await expect(f.scope.run(async () => 'new')).resolves.toBe('new');
  dispose();
  expect(f.listeners.size).toBe(0);
  await expect(f.scope.run(async () => 'disposed')).rejects.toThrow('disposed');
});
it('ignores unrelated Host updates and handles effect cleanup and reattachment', async () => {
  const f = fixture();
  const dispose = f.scope.listen();
  await expect(
    f.scope.run(async ({ signal }) => {
      f.change('account-a/thread-a');
      expect(signal.aborted).toBe(false);
      return 1;
    }),
  ).resolves.toBe(1);
  dispose();
  const cleanup = f.scope.listen();
  await expect(f.scope.run(async () => 2)).resolves.toBe(2);
  cleanup();
});
