import path from 'path';
import { render } from '../src/libs/render/ssr';
import { handleDirectory } from '../src/libs/render/static';

describe('test render function', () => {
  test('should return content correctly ', async () => {
    const renderResult = await render(
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
});
