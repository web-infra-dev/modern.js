import path from 'path';
import { render } from '../src/libs/render/ssr';

describe('test ssr render function', () => {
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
});
