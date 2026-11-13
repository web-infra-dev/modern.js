import type { ServerRoute } from '@modern-js/types';
import { createCSRRender } from '../../src/plugins/render/render';
import { uniqueKeyByRoute } from '../../src/utils';

const route: ServerRoute = {
  urlPath: '/weather',
  entryName: 'weather',
  entryPath: 'weather.html',
  isSSR: true,
  responseHeaders: { 'x-route': 'weather', 'cache-control': 'max-age=60' },
};
const html =
  '<html><head><script type="application/json" data-modern-mf-release>{"revision":7}</script></head><body><div id="root"></div><script src="/main.js"></script></body></html>';
const options = {
  templates: { [uniqueKeyByRoute(route)]: html },
  entryScope: ['weather'],
};

it('serves the published client release and assets without an SSR manifest or handler', async () => {
  const render = createCSRRender([route]);
  const response = render(new Request('http://localhost/weather'), options);
  expect(response.status).toBe(200);
  expect(response.headers.get('x-route')).toBe('weather');
  expect(response.headers.get('x-modernjs-render')).toBe('client');
  expect(response.headers.get('x-modern-ssr-fallback')).toBe(
    '1;reason=updating',
  );
  expect(response.headers.get('cache-control')).toBe('no-store');
  const result = await response.text();
  expect(result).toContain('"revision":7');
  expect(result).toContain('src="/main.js"');
  expect(result).toContain('"reason":"updating"');
  expect(options.templates[uniqueKeyByRoute(route)]).toBe(html);
  const head = render(
    new Request('http://localhost/weather', { method: 'HEAD' }),
    options,
  );
  expect(head.status).toBe(200);
  expect(head.body).toBeNull();
});

it('rejects loader, non-HTML, mutation, unknown, API, RSC and cross-scope requests', () => {
  const render = createCSRRender([route]);
  const requests = [
    new Request('http://localhost/weather?__loader=weather'),
    new Request('http://localhost/weather', { method: 'POST' }),
    new Request('http://localhost/weather', {
      headers: { accept: 'application/json' },
    }),
    new Request('http://localhost/weather', {
      headers: { 'x-rsc-tree': '1' },
    }),
    new Request('http://localhost/missing'),
  ];
  for (const request of requests) {
    const response = render(request, options);
    expect(response.status).toBe(503);
    expect(response.headers.get('retry-after')).toBe('1');
  }
  const request = new Request('http://localhost/weather');
  expect(render(request, { ...options, entryScope: ['another'] }).status).toBe(
    503,
  );
  expect(render(request, { templates: {} }).status).toBe(503);
  expect(
    createCSRRender([{ ...route, isApi: true }])(request, options).status,
  ).toBe(503);
  expect(
    createCSRRender([{ ...route, isRSC: true }])(request, options).status,
  ).toBe(503);
});
