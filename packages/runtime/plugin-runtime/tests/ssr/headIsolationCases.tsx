import { storage } from '@modern-js/runtime-utils/node';
import type { ReactNode } from 'react';
import { Suspense } from 'react';
import {
  getGlobalInternalRuntimeContext,
  setGlobalInternalRuntimeContext,
} from '../../src/core/context';
import type { RenderOptions } from '../../src/core/server/shared';
import type { CreateReadableStreamFromElement } from '../../src/core/server/stream/shared';
import { createRenderStreaming } from '../../src/core/server/stream/shared';
import { renderString } from '../../src/core/server/string';
import { SSRErrors } from '../../src/core/server/tracer';
import { Helmet } from '../../src/exports/head';

const template =
  '<html><head><title>Default</title></head><body><div id="root"><!--<?- html ?>--></div><!--<?- SSRDataScript ?>--></body></html>';
const request = (allReady = false) =>
  new Request('http://localhost/', {
    headers: {
      'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      ...(allReady ? { 'x-should-stream-all': 'true' } : {}),
    },
  });
const options = (): RenderOptions =>
  ({
    resource: { htmlTemplate: template, entryName: 'main', route: {} },
    runtimeContext: {
      isBrowser: false,
      ssrContext: {
        request: {
          params: {},
          query: {},
          pathname: '/',
          host: 'localhost',
          url: 'http://localhost/',
          headers: {},
        },
        htmlModifiers: [],
      },
    },
    config: { ssr: true },
    onError: rstest.fn(),
    onTiming: rstest.fn(),
  }) as RenderOptions;

function deferred() {
  let resolve = () => {};
  const promise = new Promise<void>(done => {
    resolve = done;
  });
  return { promise, resolve };
}

function suspended() {
  const started = deferred();
  const ready = deferred();
  let resolved = false;
  return {
    started: started.promise,
    resolve() {
      resolved = true;
      ready.resolve();
    },
    Component({ children }: { children?: ReactNode }) {
      started.resolve();
      if (!resolved) throw ready.promise;
      return (
        <>
          {children}
          <p>Resolved body</p>
        </>
      );
    },
  };
}

function Page({ name }: { name: string }) {
  return (
    <>
      <Helmet htmlAttributes={{ lang: name }}>
        <title>{name}</title>
        <link rel="canonical" href={`https://example.com/${name}`} />
        <script type="application/ld+json">{JSON.stringify({ name })}</script>
      </Helmet>
      <main>{name}</main>
    </>
  );
}

function expectHead(html: string, name: string) {
  expect(html).toContain(`<html lang="${name}">`);
  expect(html).toContain(`<title data-rh="true">${name}</title>`);
  expect(html).toContain(`href="https://example.com/${name}"`);
  expect(html).toContain(`{"name":"${name}"}`);
  expect(html).not.toContain('helmetInstances');
}

export function headIsolationCases(renderer: CreateReadableStreamFromElement) {
  describe('head isolation', () => {
    const renderStreaming = createRenderStreaming(Promise.resolve(renderer));
    const render: typeof renderStreaming = (request, root, options) =>
      storage.run({}, () =>
        renderStreaming(request, <div>{root}</div>, options),
      );
    const previousContext = getGlobalInternalRuntimeContext();

    beforeAll(() => {
      setGlobalInternalRuntimeContext({
        hooks: {
          extendStreamSSR: { call: () => [] },
          extendStringSSRCollectors: { call: () => [] },
        },
      } as unknown as ReturnType<typeof getGlobalInternalRuntimeContext>);
    });
    afterAll(() => {
      setGlobalInternalRuntimeContext(previousContext);
    });

    it('finishes a second render while the first is suspended without draining its head', async () => {
      const gate = suspended();
      const first = render(
        request(true),
        <>
          <Page name="first" />
          <Suspense fallback="Loading">
            <gate.Component />
          </Suspense>
        </>,
        options(),
      );
      try {
        await gate.started;
        const second = await render(
          request(),
          <Page name="second" />,
          options(),
        );
        expectHead(await new Response(second).text(), 'second');
      } finally {
        gate.resolve();
      }
      expectHead(await new Response(await first).text(), 'first');
    });

    it('isolates string renders from a suspended stream in the same process', async () => {
      const gate = suspended();
      const first = render(
        request(true),
        <>
          <Page name="stream" />
          <Suspense fallback="Loading">
            <gate.Component />
          </Suspense>
        </>,
        options(),
      );
      try {
        await gate.started;
        expectHead(
          await renderString(request(), <Page name="string" />, options()),
          'string',
        );
      } finally {
        gate.resolve();
      }
      expectHead(await new Response(await first).text(), 'stream');
    });

    it('takes the shell snapshot without waiting for late Helmet and does not leak it', async () => {
      const gate = suspended();
      let stream: ReadableStream | undefined;
      try {
        stream = await render(
          request(),
          <>
            <Page name="shell" />
            <Suspense fallback="Loading">
              <gate.Component>
                <Helmet title="Late title" />
              </gate.Component>
            </Suspense>
          </>,
          options(),
        );
        const reader = stream.getReader();
        const shell = await reader.read();
        expectHead(new TextDecoder().decode(shell.value), 'shell');
        gate.resolve();
        let html = '';
        const decoder = new TextDecoder();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          html += decoder.decode(value, { stream: true });
        }
        expect(html + decoder.decode()).not.toContain(
          '<title data-rh="true">Late title</title>',
        );
        const next = await render(request(), <Page name="next" />, options());
        const nextHtml = await new Response(next).text();
        expectHead(nextHtml, 'next');
        expect(nextHtml).not.toContain('Late title');
      } finally {
        gate.resolve();
      }
    });

    it('reads late head updates when the existing mode waits for all-ready', async () => {
      const gate = suspended();
      const pending = render(
        request(true),
        <Suspense fallback="Loading">
          <gate.Component>
            <Page name="complete" />
          </gate.Component>
        </Suspense>,
        options(),
      );
      await gate.started;
      gate.resolve();
      expectHead(await new Response(await pending).text(), 'complete');
    });

    it('does not block the next render when a shell stream is cancelled', async () => {
      const gate = suspended();
      const first = await render(
        request(),
        <>
          <Page name="cancelled" />
          <Suspense fallback="Loading">
            <gate.Component />
          </Suspense>
        </>,
        options(),
      );
      try {
        await first.cancel();
        const second = await render(
          request(),
          <Page name="after-cancel" />,
          options(),
        );
        expectHead(await new Response(second).text(), 'after-cancel');
      } finally {
        gate.resolve();
      }
    });

    it('keeps another render isolated after a suspended segment errors', async () => {
      const gate = suspended();
      const error = new Error('segment failed');
      const current = options();
      function Failure(): never {
        throw error;
      }
      const stream = await render(
        request(),
        <>
          <Page name="errored" />
          <Suspense fallback="Loading">
            <gate.Component>
              <Failure />
            </gate.Component>
          </Suspense>
        </>,
        current,
      );
      try {
        const reading = new Response(stream).text();
        gate.resolve();
        await reading;
        expect(current.onError).toHaveBeenCalledWith(
          error,
          SSRErrors.RENDER_STREAM,
        );
        const next = await render(
          request(),
          <Page name="after-error" />,
          options(),
        );
        expectHead(await new Response(next).text(), 'after-error');
      } finally {
        gate.resolve();
      }
    });

    it('discards a failed string render without contaminating the next render', async () => {
      const error = new Error('render failed');
      function Failure(): never {
        throw error;
      }
      const failedOptions = options();
      await renderString(
        request(),
        <>
          <Page name="failed" />
          <Failure />
        </>,
        failedOptions,
      );
      expect(failedOptions.onError).toHaveBeenCalledWith(
        error,
        SSRErrors.RENDER_HTML,
      );
      expectHead(
        await renderString(request(), <Page name="recovered" />, options()),
        'recovered',
      );
    });
  });
}
