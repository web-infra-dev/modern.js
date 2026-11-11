import { expect, it, rs } from '@rstest/core';
import { configureServiceRuntimePlugins } from './serviceRuntimePlugins';

const { build } = rs.hoisted(() => ({ build: rs.fn() }));
rs.mock('@rsbuild/core', () => ({ createRsbuild: async () => ({ build }) }));
rs.mock('./utils', () => ({ isDev: () => true }));

it('waits for the matching private plugin build regardless of compile hook order and retries the next compilation', async () => {
  let completed!: () => void;
  let entered!: () => void;
  const started = new Promise<void>(resolve => {
    entered = resolve;
  });
  build.mockImplementationOnce(() => {
    entered();
    return new Promise<void>(resolve => {
      completed = resolve;
    });
  });
  let compile!: (input: { stats: { hasErrors(): boolean } }) => Promise<void>;
  const plugin = configureServiceRuntimePlugins(
    {
      getAppContext: () => ({
        appDirectory: '/app',
        distDirectory: '/app/dist',
      }),
      getConfig: () => ({}),
      onAfterBuild: rs.fn(),
      onDevCompileDone: (callback: typeof compile) => {
        compile = callback;
      },
      _internalServerPlugins: rs.fn(),
    } as any,
    ['./private-plugin.ts'],
  )!;
  const stats = { hasErrors: () => false };
  let published = false;
  // Publication can be registered before the private-plugin compilation hook.
  const publication = plugin.waitForBuild!(stats).then(() => {
    published = true;
  });
  await started;
  const hook = compile({ stats });
  await Promise.resolve();
  expect(published).toBe(false);
  expect(build).toHaveBeenCalledTimes(1);
  completed();
  await Promise.all([publication, hook]);
  expect(published).toBe(true);
  expect(build).toHaveBeenCalledTimes(1);

  build.mockRejectedValueOnce(new Error('Private plugin compilation failed'));
  const failed = { hasErrors: () => false };
  await expect(plugin.waitForBuild!(failed)).rejects.toThrow(
    'Private plugin compilation failed',
  );
  await expect(compile({ stats: failed })).rejects.toThrow(
    'Private plugin compilation failed',
  );
  expect(build).toHaveBeenCalledTimes(2);

  build.mockResolvedValueOnce(undefined);
  const repaired = { hasErrors: () => false };
  await compile({ stats: repaired });
  await plugin.waitForBuild!(repaired);
  expect(build).toHaveBeenCalledTimes(3);
});
