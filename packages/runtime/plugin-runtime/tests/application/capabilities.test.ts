import { createApplicationInstance } from '../../src/core/application/instance';
import { cancellationPlugin } from '../../src/core/application/cancellation';
import { createRuntime, type RuntimePlugin } from '../../src/core/plugin';
import { contractGate } from './pluginContract';

const application = (plugins: RuntimePlugin[]) => ({
  App: () => null,
  createRuntime: (context: any, capabilities?: RuntimePlugin[]) =>
    createRuntime(plugins, undefined, context, capabilities),
});

it('prepares ordinary applications without fragment or cancellation capabilities', async () => {
  const gate = contractGate();
  const events: string[] = [];
  const instance = createApplicationInstance(
    application([
      {
        name: 'ordinary',
        async setup(api) {
          events.push('setup');
          await gate.promise;
          api.onBeforeRender(() => {
            events.push('before');
          });
          api.wrapRoot(App => {
            events.push('wrap');
            return App;
          });
          api.onDispose(() => events.push('dispose'));
        },
      },
    ]),
    { isBrowser: true, output: 'document', initialUrl: 'https://app.example/' },
  );
  expect(events).toEqual([]);
  const preparing = instance.prepare();
  expect(instance.runtime.hooks.wrapPreparation).toBeUndefined();
  expect(instance.context.application).not.toHaveProperty('memory');
  expect(instance.context.application).not.toHaveProperty('getDataUrl');
  expect(instance.context.application?.config).toBeUndefined();
  expect(events).toEqual(['setup']);
  gate.release();
  await preparing;
  expect(events).toEqual(['setup', 'before', 'wrap']);
  expect(instance.prepare()).toBe(preparing);
  instance.dispose();
  instance.dispose();
  expect(events).toEqual(['setup', 'before', 'wrap', 'dispose']);
});

it('installs cancellation before async setup and preserves another active instance', async () => {
  const gate = contractGate();
  const events: string[] = [];
  const definition = application([
    {
      name: 'async-consumer',
      async setup(api) {
        const url = api.getRuntimeContext().application!.initialUrl;
        expect(api.getRuntimeContext().requestContext).toBeDefined();
        api.onDispose(() => events.push(`dispose:${url}`));
        await gate.promise;
        api.onBeforeRender(() => {
          events.push(`before:${url}`);
        });
      },
    },
    {
      name: 'ordered-consumer',
      pre: ['async-consumer'],
      setup(api) {
        events.push(`setup:${api.getRuntimeContext().application!.initialUrl}`);
      },
    },
  ]);
  const controller = new AbortController();
  const stopped = createApplicationInstance(definition, {
    isBrowser: false,
    output: 'document',
    initialUrl: 'stopped',
    plugins: [cancellationPlugin(controller.signal)],
  });
  const active = createApplicationInstance(definition, {
    isBrowser: false,
    output: 'document',
    initialUrl: 'active',
    plugins: [cancellationPlugin()],
  });
  const cancelled = stopped.prepare();
  const ready = active.prepare();
  const failure = new Error('disconnected during setup');
  controller.abort(failure);
  await expect(cancelled).rejects.toBe(failure);
  expect(events).toEqual(['dispose:stopped']);
  gate.release();
  await ready;
  expect(events).toEqual(['dispose:stopped', 'setup:active', 'before:active']);
  expect(active.runtime.disposed).toBe(false);
  active.dispose();
  expect(events).toEqual([
    'dispose:stopped',
    'setup:active',
    'before:active',
    'dispose:active',
  ]);
});

it('preserves immediate disposal before the first initialization hook', async () => {
  const before = rstest.fn();
  const instance = createApplicationInstance(
    application([
      {
        name: 'hook',
        setup(api) {
          api.onBeforeRender(before);
        },
      },
    ]),
    {
      isBrowser: false,
      output: 'document',
      initialUrl: '/',
      plugins: [cancellationPlugin()],
    },
  );
  const preparing = instance.prepare();
  instance.dispose();
  await expect(preparing).rejects.toThrow('disposed');
  expect(before).not.toHaveBeenCalled();
});
