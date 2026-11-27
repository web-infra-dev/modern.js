import { PassThrough } from 'node:stream';
import { storage } from '@modern-js/runtime-utils/node';
import React, { Suspense } from 'react';
import { createRuntime } from '../../src/core/plugin';
import { StreamRoot } from '../../src/core/react/streamRoot';
import { createReadableStreamFromElement } from '../../src/core/server/stream/createReadableStream';

const options = {
  runtimeContext: {
    ssrContext: { request: { pathname: '/', url: 'http://host/' } },
  },
  config: {},
  ssrConfig: {},
  entryName: 'index',
  htmlTemplate: '<html><body><main><!--<?- html ?>--></main></body></html>',
  onError: () => {},
} as any;

function setup() {
  const aborted: unknown[] = [];
  let input: NodeJS.ReadWriteStream | undefined;
  let output: PassThrough | undefined;
  createRuntime(
    [
      {
        name: 'stream-lifecycle-test',
        setup(api) {
          api.extendStreamSSR(() => ({
            processStream(stream) {
              input = stream;
              output = new PassThrough();
              return stream.pipe(output);
            },
            abort(reason) {
              aborted.push(reason);
            },
          }));
        },
      },
    ],
    undefined,
    options.runtimeContext,
  );
  return {
    aborted,
    get input() {
      return input;
    },
    get output() {
      return output;
    },
  };
}

function Never(): React.ReactElement {
  throw new Promise(() => {});
}
function Broken(): React.ReactElement {
  throw new Error('shell failed');
}
const pending = (
  <StreamRoot includeMarker>
    <section>
      <Suspense fallback={<p>waiting</p>}>
        <Never />
      </Suspense>
    </section>
  </StreamRoot>
);
const stream = (request: Request, element: React.ReactElement) =>
  storage.run(
    { activeDeferreds: new Map(), deferredScriptKeys: new Map() },
    () => createReadableStreamFromElement(request, element, options),
  );

it('releases extenders even when the shell fails before processStream runs', async () => {
  const lifecycle = setup();
  const result = await stream(new Request('http://host/'), <Broken />);
  expect(await new Response(result).text()).toBe(
    '<html><body><main></main></body></html>',
  );
  expect(lifecycle.input).toBeUndefined();
  expect(lifecycle.aborted).toHaveLength(1);
  expect(String(lifecycle.aborted[0])).toContain('shell failed');
});

it('cancels React and extenders when the request aborts before the shell exists', async () => {
  const lifecycle = setup();
  const controller = new AbortController();
  const result = stream(
    new Request('http://host/', { signal: controller.signal }),
    <Never />,
  );
  const cancelled = expect(result).rejects.toThrow('request disconnected');
  await Promise.resolve();
  controller.abort(new Error('request disconnected'));
  await cancelled;
  expect(lifecycle.input).toBeUndefined();
  expect(lifecycle.aborted).toHaveLength(1);
});

it.each(['request', 'reader'])(
  'propagates %s cancellation after the shell to every stream and extender',
  async source => {
    const lifecycle = setup();
    const controller = new AbortController();
    const result = await stream(
      new Request('http://host/', { signal: controller.signal }),
      pending,
    );
    const reader = result.getReader();
    expect(new TextDecoder().decode((await reader.read()).value)).toContain(
      'waiting',
    );
    if (source === 'reader') {
      await reader.cancel(new Error('consumer cancelled'));
    } else {
      // React may already have queued its shell timing script after the
      // marker. Drain buffered bytes until the cancelled transport errors.
      const remaining = (async () => {
        while (!(await reader.read()).done) {}
      })();
      const cancelled = expect(remaining).rejects.toThrow('consumer cancelled');
      controller.abort(new Error('consumer cancelled'));
      await cancelled;
    }
    await new Promise(resolve => setImmediate(resolve));
    expect(lifecycle.aborted).toHaveLength(1);
    expect(String(lifecycle.aborted[0])).toContain('consumer cancelled');
    expect((lifecycle.input as PassThrough).destroyed).toBe(true);
    expect(lifecycle.output?.destroyed).toBe(true);
  },
);

it('does not report normal stream completion as cancellation', async () => {
  const lifecycle = setup();
  const controller = new AbortController();
  const result = await stream(
    new Request('http://host/', { signal: controller.signal }),
    <StreamRoot includeMarker>
      <p>complete</p>
    </StreamRoot>,
  );
  expect(await new Response(result).text()).toContain('<p>complete</p>');
  await new Promise(resolve => setImmediate(resolve));
  controller.abort(new Error('after completion'));
  expect(lifecycle.aborted).toEqual([]);
});
