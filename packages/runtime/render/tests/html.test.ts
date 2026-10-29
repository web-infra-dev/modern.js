import { describe, expect, it } from '@rstest/core';
import { createElement, useId } from 'react';
import {
  applyDocumentHelmet,
  createDataScript,
  readDataScript,
  renderDocument,
  serializeRenderData,
} from '../src/html';
import type { DocumentHelmet } from '../src/html';
import { renderStringElement } from '../src/html/server';

const helmet = (title: string): DocumentHelmet => ({
  bodyAttributes: '',
  htmlAttributes: '',
  base: '',
  link: '',
  meta: '',
  noscript: '',
  script: '',
  style: '',
  title,
});

describe('shared HTML rendering', () => {
  it('keeps application and data payloads verbatim after template edits', () => {
    const app = '<p>$& <!--data--> <!--app--> 中文</p>';
    const data = '<script>"<!--app-->"</script>';
    expect(
      renderDocument(
        '<html><head><!--css--></head><body><!--app--><!--data--></body></html>',
        {
          app: { placeholder: '<!--app-->', content: app },
          data: [{ placeholder: '<!--data-->', content: data }],
          assets: [
            { placeholder: '<!--css-->', content: '<style>a{}</style>' },
          ],
        },
      ),
    ).toBe(
      `<html><head><style>a{}</style></head><body>${app}${data}</body></html>`,
    );
  });

  it('preserves both template-first and application-first title contracts', () => {
    const template = '<html><head></head><body><!--app--></body></html>';
    const options = {
      app: {
        placeholder: '<!--app-->',
        content: '<svg><title>icon</title></svg>',
      },
      helmet: (html: string) =>
        applyDocumentHelmet(html, helmet('<title>page</title>')),
    };
    expect(renderDocument(template, options)).toBe(
      '<html><head>  <title>page</title>\n</head><body><svg><title>icon</title></svg></body></html>',
    );
    expect(renderDocument(template, { ...options, appFirst: true })).toBe(
      '<html><head></head><body><svg><title>page</title></svg></body></html>',
    );
  });

  it('keeps legacy replacement patterns only when the integration requests them', () => {
    const template = '<head><title>old</title></head>';
    const title = helmet('<title>$$</title>');
    expect(applyDocumentHelmet(template, title)).toBe(
      '<head><title>$$</title></head>',
    );
    expect(
      applyDocumentHelmet(template, title, {
        format: 'lines',
        replacement: 'pattern',
      }),
    ).toBe('<head><title>$</title></head>');
  });

  it('does not expose unescaped data or nonce attributes to the HTML parser', () => {
    const data = {
      text: '</script><script>alert(1)</script>\u2028\u2029',
      zero: 0,
      flag: false,
    };
    const json = serializeRenderData(data);
    expect(json).not.toContain('<');
    expect(JSON.parse(json)).toEqual(data);
    expect(
      createDataScript({ data: null, global: '_SSR_DATA', nonce: '\"<&' }),
    ).toBe('<script nonce="&quot;&lt;&amp;">window._SSR_DATA = null</script>');
    expect(createDataScript({ data: 0, id: 'initial' })).toBe(
      '<script type="application/json" id="initial">0</script>',
    );
  });

  it('reads falsy JSON values and distinguishes a missing script', () => {
    const document = {
      getElementById: (id: string) =>
        id === 'value' ? { textContent: 'false' } : null,
      getElementsByName: () => [{ textContent: 'null' }],
    };
    expect(readDataScript(document, { id: 'value' })).toBe(false);
    expect(readDataScript(document, { name: 'data' })).toBe(null);
    expect(readDataScript(document, { id: 'missing' })).toBeUndefined();
  });

  it('surfaces serialization errors for the framework to handle', () => {
    const circular: { self?: unknown } = {};
    circular.self = circular;
    expect(() => createDataScript({ data: circular, id: 'data' })).toThrow();
    expect(() => createDataScript({ data: {}, global: 'alert(1)' })).toThrow(
      'Invalid render data global',
    );
  });

  it('keeps the last duplicate JSON script and rejects malformed or empty JSON', () => {
    const document = {
      getElementById: () => ({ textContent: '1' }),
      getElementsByName: () => [],
      querySelectorAll: () => [{ textContent: '1' }, { textContent: '2' }],
    };
    expect(readDataScript(document, { id: 'data', last: true })).toBe(2);
    expect(readDataScript(document, { id: 'data' })).toBe(1);
    expect(() =>
      readDataScript(
        { ...document, getElementById: () => ({ textContent: '' }) },
        { id: 'data' },
      ),
    ).toThrow();
  });

  it('renders with the caller hydration prefix and collects within the measured render', () => {
    const App = () => createElement('label', { htmlFor: useId() }, 'item');
    const timings: number[] = [];
    const result = renderStringElement(createElement(App), {
      identifierPrefix: 'consumer-',
      collect: () => ({ title: 'Item' }),
      onTiming: duration => timings.push(duration),
    });
    expect(result.html).toContain('consumer-');
    expect(result.collected).toEqual({ title: 'Item' });
    expect(timings).toHaveLength(1);
    expect(timings[0]).toBeGreaterThanOrEqual(0);
  });

  it('leaves render failures to the framework without reporting a successful timing', () => {
    const timings: number[] = [];
    const App = () => {
      throw new Error('render failed');
    };
    expect(() =>
      renderStringElement(createElement(App), {
        onTiming: duration => timings.push(duration),
      }),
    ).toThrow('render failed');
    expect(timings).toEqual([]);
  });
});
