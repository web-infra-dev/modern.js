import path from 'path';
import { createRenderHandler } from '../src/libs/render';
import { render as renderSSR } from '../src/libs/render/ssr';
import { handleDirectory } from '../src/libs/render/static';
import { LruReader } from '../src/libs/render/reader';
import { supportModern } from '../src/libs/render/modern';
import { createLogger, createMetrics } from '../src/libs/render/measure';

describe('test render function', () => {
  test('should return content correctly ', async () => {
    const renderResult = await renderSSR(
      {
        params: {},
        pathname: '/foo',
        host: 'localhost:8080',
        query: {},
        url: 'localhost:8080/foo',
        cookieMap: {},
        headers: {},
      } as any,
      {
        urlPath: '/foo',
        bundle: 'bundle.js',
        distDir: path.join(__dirname, 'fixtures', 'ssr'),
        template: 'tpl.html',
        entryName: 'foo',
        staticGenerate: false,
      } as any,
      {
        extendSSRContext: () => {
          // empty
        },
      } as any,
    );

    expect(renderResult.content).toMatch('Modern.js');
    expect(renderResult.contentType).toMatch('text/html; charset=utf-8');
  });

  test('should handle directory for .html correctly', async () => {
    const entryPath = path.join(__dirname, 'fixtures', 'static-dir');

    const res1 = await handleDirectory(
      {
        path: '/modern/bar',
      } as any,
      entryPath,
      '/modern',
    );

    expect(res1?.content.toString()).toMatch('bar');
  });

  test('should handle directory for index.html correctly', async () => {
    const entryPath = path.join(__dirname, 'fixtures', 'static-dir');

    const res1 = await handleDirectory(
      {
        path: '/modern/foo',
      } as any,
      entryPath,
      '/modern',
    );

    expect(res1?.content.toString()).toMatch('foo');
  });

  test('should handle directory for /index.html correctly', async () => {
    const entryPath = path.join(__dirname, 'fixtures', 'static-dir');

    const res1 = await handleDirectory(
      {
        path: '/modern/baz/',
      } as any,
      entryPath,
      '/modern',
    );

    expect(res1?.content.toString()).toMatch('baz');
  });

  test('should reader work correctly', async () => {
    const reader = new LruReader();
    const dir = path.join(__dirname, 'fixtures', 'reader');

    const nullRes = await reader.read(path.join(dir, 'foo.ts'));
    expect(nullRes).toBeNull();

    const dirRes = await reader.read(path.join(dir, 'test-dir'));
    expect(dirRes).toBeNull();

    const res = await reader.read(path.join(dir, 'index.ts'));
    expect(res).not.toBeNull();
    expect(res?.content.toString()).toMatch('modern');

    const res1 = await reader.read(path.join(dir, 'index.ts'));
    expect(res1).not.toBeNull();
    expect(res1?.content.toString()).toMatch('modern');

    reader.update();
    const res2 = await reader.read(path.join(dir, 'index.ts'));
    expect(res2).not.toBeNull();
    expect(res2?.content.toString()).toMatch('modern');
  });

  test('should entry render fn work correctly', async () => {
    const render = createRenderHandler({
      distDir: path.join(__dirname, 'fixtures', 'ssr'),
      staticGenerate: false,
    });
    const renderResult = await render({
      ctx: {
        params: {},
        pathname: '/foo',
        host: 'localhost:8080',
        query: {},
        url: 'localhost:8080/foo',
        cookieMap: {},
        headers: {},
        resHasHandled: () => false,
      } as any,
      route: {
        urlPath: '/foo',
        bundle: 'bundle.js',
        entryPath: 'tpl.html',
        entryName: 'foo',
        isSSR: true,
        isSPA: true,
      } as any,
      runner: {
        extendSSRContext: () => {
          // empty
        },
      } as any,
    });
    expect(renderResult!.content).toMatch('Modern.js');
    expect(renderResult!.contentType).toMatch('text/html; charset=utf-8');
  });

  test('should entry render fn fallback work correctly', async () => {
    const render = createRenderHandler({
      distDir: path.join(__dirname, 'fixtures', 'ssr'),
      staticGenerate: false,
    });
    const renderResult = await render({
      ctx: {
        params: {},
        pathname: '/foo',
        host: 'localhost:8080',
        query: {},
        url: 'localhost:8080/foo',
        cookieMap: {},
        headers: {},
        res: {
          setHeader: () => false,
        },
        error: () => false,
        resHasHandled: () => false,
      } as any,
      route: {
        urlPath: '/foo',
        bundle: 'bundle-error.js',
        entryPath: 'tpl.html',
        entryName: 'foo',
        isSSR: true,
        isSPA: true,
      } as any,
      runner: {
        extendSSRContext: () => {
          // empty
        },
      } as any,
    });
    expect(renderResult!.content.toString()).toMatch('csr');
    expect(renderResult!.contentType).toMatch('text/html; charset=utf-8');
  });
});

describe('test modern render', () => {
  test('should return true if has target query', () => {
    const res = supportModern({ query: { modern_es6: true } } as any);
    expect(res).toBeTruthy();
  });

  test('should return false if no ua', () => {
    const res = supportModern({ headers: {} } as any);
    expect(res).toBeFalsy();
  });

  test('should return false if ua is not string', () => {
    const res = supportModern({ headers: { 'user-agent': true } } as any);
    expect(res).toBeFalsy();
  });

  test('should return false if ua no browser version', () => {
    const res = supportModern({ headers: { 'user-agent': 'mock' } } as any);
    expect(res).toBeFalsy();
  });

  test('should return false if ua no match name', () => {
    const ua =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.99 Safari/537.36';

    const res = supportModern({ headers: { 'user-agent': ua } } as any);
    expect(res).toBeTruthy();
  });
});

describe('test measure', () => {
  it('should logger work correctly', () => {
    let code = -1;
    const logger = createLogger(
      {
        entryName: '',
        request: {
          pathname: '/',
        },
      } as any,
      {
        error() {
          code = 0;
        },
        info() {
          code = 2;
        },
        debug() {
          code = 3;
        },
      } as any,
    );

    logger.error('msg', 'error');
    expect(code).toBe(0);
    logger.info('msg', 'info');
    expect(code).toBe(2);
    logger.debug('msg', 'debug');
    expect(code).toBe(3);
  });

  it('should metrics work correctly', () => {
    let code = -1;
    const metrics = createMetrics(
      {
        entryName: '',
        request: {
          pathname: '/',
        },
      } as any,
      {
        emitCounter() {
          code = 0;
        },
        emitTimer() {
          code = 2;
        },
      } as any,
    );

    metrics.emitCounter('msg', 1);
    expect(code).toBe(0);
    metrics.emitTimer('msg', 1);
    expect(code).toBe(2);
  });
});
