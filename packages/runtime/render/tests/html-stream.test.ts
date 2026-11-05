import { runInNewContext } from 'node:vm';
import { PassThrough, Readable } from 'node:stream';
import { describe, expect, it } from '@rstest/core';
import { createElement } from 'react';
import {
  createDeferredBootstrapScript,
  createDeferredResultScript,
  createRenderDataStore,
} from '../src/html';
import type { RenderDataStore } from '../src/html';
import {
  createDocumentStream,
  createDocumentStreamController,
} from '../src/html/stream';
import { renderPipeableElement } from '../src/html/node';

const encoder = new TextEncoder();
const marker = '__SHELL_END__';
const shell = { marker, before: '<html><body>', after: '</body></html>' };
const textStream = (chunks: Array<string | Uint8Array>) =>
  new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks)
        controller.enqueue(
          typeof chunk === 'string' ? encoder.encode(chunk) : chunk,
        );
      controller.close();
    },
  });

describe('shared deferred data', () => {
  it('isolates identical result keys by source and by request', async () => {
    const first = createRenderDataStore();
    const second = createRenderDataStore();
    const router = first.read('router', 'same');
    const prefetch = first.read('prefetch', 'same');
    const otherRequest = second.read('router', 'same');
    first.resolve('router', 'same', 0);
    first.resolve('prefetch', 'same', false);
    second.resolve('router', 'same', 'another request');
    await expect(router).resolves.toBe(0);
    await expect(prefetch).resolves.toBe(false);
    await expect(otherRequest).resolves.toBe('another request');
  });

  it('restores early and late values including null, undefined and prototype-like keys', async () => {
    const store = createRenderDataStore();
    store.resolve('__proto__', 'constructor', null);
    expect(store.get('__proto__', 'constructor')).toBe(null);
    await expect(store.read('__proto__', 'constructor')).resolves.toBe(null);
    const late = store.read('prefetch', 'missing-value');
    store.resolve('prefetch', 'missing-value', undefined);
    await expect(late).resolves.toBeUndefined();
    store.resolve('prefetch', 'empty', '');
    expect(store.get('prefetch', 'empty')).toBe('');
  });

  it('retains a rejected result until a late client reads it and ignores duplicate completion', async () => {
    const store = createRenderDataStore();
    store.resolve('prefetch', 'stock', undefined, { message: 'out of stock' });
    await expect(store.read('prefetch', 'stock')).rejects.toEqual({
      message: 'out of stock',
    });
    store.resolve('prefetch', 'stock', 'late value');
    await expect(store.read('prefetch', 'stock')).rejects.toEqual({
      message: 'out of stock',
    });
  });

  it('uses the same store from inline bootstrap and completion scripts before application code loads', async () => {
    const window: { __MODERN_RENDER_DATA__?: RenderDataStore } = {};
    const evaluate = (html: string) =>
      runInNewContext(
        html.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, ''),
        { window },
      );
    evaluate(
      createDeferredBootstrapScript([{ source: 'prefetch', key: 'stock' }]),
    );
    evaluate(
      createDeferredResultScript({
        source: 'prefetch',
        key: 'stock',
        status: 'fulfilled',
        value: '</script>中文',
      }),
    );
    expect(window.__MODERN_RENDER_DATA__?.get('prefetch', 'stock')).toBe(
      '</script>中文',
    );
    await expect(
      window.__MODERN_RENDER_DATA__?.read('prefetch', 'stock'),
    ).resolves.toBe('</script>中文');
  });
});

describe('external React stream assembly', () => {
  it('stops waiting for provider results on fallback and drains the React continuation', async () => {
    let resolve!: (value: string) => void;
    const result = new Promise<string>(yes => {
      resolve = yes;
    });
    const output = createDocumentStreamController(
      textStream([`shell${marker}`, '<script>reactFallback()</script>']),
      {
        shell,
        canEnqueueScripts: true,
        results: [{ source: 'prefetch', key: 'slow', value: result }],
      },
    );
    output.enqueueScript('<script>fallback()</script>');
    output.stopResults();
    const html = await new Response(output.stream).text();
    resolve('late provider result');
    await result;
    expect(html).toBe(
      '<html><body>shell</body></html><script>fallback()</script><script>reactFallback()</script>',
    );
  });

  it('coordinates declared framework control scripts and rejects unregistered late producers', async () => {
    const output = createDocumentStreamController(
      textStream([`shell${marker}`]),
      {
        shell,
        canEnqueueScripts: true,
      },
    );
    output.enqueueScript('<script>fallback()</script>');
    expect(await new Response(output.stream).text()).toBe(
      '<html><body>shell</body></html><script>fallback()</script>',
    );
    const raw = createDocumentStreamController(textStream([`shell${marker}`]), {
      shell,
    });
    expect(() => raw.enqueueScript('<script>late()</script>')).toThrow(
      'registered before streaming',
    );
    expect(await new Response(raw.stream).text()).toBe(
      '<html><body>shell</body></html>',
    );
  });

  it('reports shell and all-ready once from actual Node React execution', async () => {
    const phases: string[] = [];
    const html = await new Promise<string>((resolve, reject) => {
      const body = new PassThrough();
      const rendered = renderPipeableElement(createElement('p', null, 'node'), {
        onTiming: (phase, duration) => {
          phases.push(phase);
          expect(duration).toBeGreaterThanOrEqual(0);
        },
        onShellReady() {
          rendered.pipe(body);
          resolve(
            new Response(createDocumentStream(Readable.toWeb(body))).text(),
          );
        },
        onShellError: reject,
      });
    });
    expect(html).toBe('<p>node</p>');
    expect(phases).toEqual(['shell', 'all']);
  });

  it('preserves the document and UTF-8 for every two-chunk byte boundary', async () => {
    const bytes = encoder.encode(`<p>中文🚀</p>${marker}🎉<p>continuation</p>`);
    for (let index = 1; index < bytes.length; index++) {
      const stream = createDocumentStream(
        textStream([bytes.subarray(0, index), bytes.subarray(index)]),
        { shell },
      );
      expect(await new Response(stream).text()).toBe(
        '<html><body><p>中文🚀</p></body></html>🎉<p>continuation</p>',
      );
    }
  });

  it('forwards post-shell bytes without copying when registration confirms no deferred results', async () => {
    const original = encoder.encode('<p>raw continuation</p>');
    const output = createDocumentStream(
      textStream([`shell${marker}`, original]),
      { shell },
    );
    const reader = output.getReader();
    expect(new TextDecoder().decode((await reader.read()).value)).toBe(
      '<html><body>shell</body></html>',
    );
    expect((await reader.read()).value).toBe(original);
    expect((await reader.read()).done).toBe(true);
    reader.releaseLock();
  });

  it('keeps a quickly completed result behind a partial React continuation in the marker chunk', async () => {
    const continuation =
      '<div hidden id="S:0"><span title="中文">value</span></div><script>$RC("B:0","S:0")</script>';
    const output = createDocumentStream(
      textStream([
        `shell${marker}<div hidden id="S:0"><span title="`,
        '中文">value</span></div><script>$RC("B:0","S:0")</script>',
      ]),
      {
        shell,
        results: [
          { source: 'prefetch', key: 'stock', value: Promise.resolve(0) },
        ],
        serializeResult: () => '<script>resolved(0)</script>',
      },
    );
    expect(await new Response(output).text()).toBe(
      `<html><body>shell</body></html>${continuation}<script>resolved(0)</script>`,
    );
  });

  it('cancels and releases an external reader while a deferred result is still pending', async () => {
    let cancelled = false;
    const input = textStream([`shell${marker}`]);
    const output = createDocumentStream(input, {
      shell,
      results: [
        { source: 'prefetch', key: 'stock', value: new Promise(() => {}) },
      ],
      onCancel: () => {
        cancelled = true;
      },
    });
    const reader = output.getReader();
    await reader.read();
    await reader.cancel('client disconnected');
    expect(cancelled).toBe(true);
    expect(input.locked).toBe(false);
    reader.releaseLock();
  });

  it('propagates serialization failures and releases the external stream', async () => {
    const circular: { self?: unknown } = {};
    circular.self = circular;
    const input = textStream([`shell${marker}`]);
    const output = createDocumentStream(input, {
      shell,
      results: [
        { source: 'prefetch', key: 'stock', value: Promise.resolve(circular) },
      ],
    });
    await expect(new Response(output).text()).rejects.toThrow();
    expect(input.locked).toBe(false);
  });
});
