import fs from 'fs';
import path from 'path';
import { ServerRoute as ModernRoute } from '@modern-js/types';
import { exist, replaceRoute } from '../src/libs/replace';
import { makeRoute } from '../src/libs/make';

describe('test functional function', () => {
  it('should check route exist correctly', () => {
    const pageRoutes: ModernRoute[] = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'material/lib.route.json'), 'utf-8'),
    ).routes;
    const testRoutes = [
      {
        urlPath: '/lib/entry',
        entryName: 'entry',
        result: 0,
      },
      {
        urlPath: '/lib/home',
        entryName: 'home1',
        result: -1,
      },
      {
        urlPath: '/lib/home1',
        entryName: 'home',
        result: -1,
      },
      {
        urlPath: '/lib/user',
        entryName: 'mobile',
        result: 2,
      },
      {
        urlPath: '/lib/user',
        entryName: 'pc',
        result: 3,
      },
    ];
    testRoutes.forEach(route => {
      expect(exist(route as any, pageRoutes)).toBe(route.result);
    });
  });

  it('should replace route correctly', () => {
    const material = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, 'material/replace.route.json'),
        'utf-8',
      ),
    );

    const { origin, ssg, final } = material;
    const result = replaceRoute(ssg, origin);

    expect(result).toEqual(final);
  });

  it('should generate route correctly', () => {
    const baseRoute: ModernRoute = {
      urlPath: '/foo',
      isSPA: true,
      isSSR: false,
      entryName: 'foo',
      isApi: false,
      bundle: '',
      entryPath: 'html/foo/index.html',
    };

    const route1 = makeRoute(baseRoute, '/baz');
    expect(route1.urlPath).toBe('/foo/baz');
    expect(route1.urlPath).toBe('/foo/baz');

    const route2 = makeRoute(baseRoute, { url: '/baz' });
    expect(route2.urlPath).toBe('/foo/baz');
    expect(route2.output).toBe(path.normalize('html/foo/baz'));

    const route3 = makeRoute(baseRoute, {
      url: '/baz',
      output: 'html/baz.html',
    });
    expect(route3.output).toBe(path.normalize('html/baz.html'));

    const route4 = makeRoute(
      baseRoute,
      {
        url: '/baz',
      },
      { ua: 'mobile' },
    );
    expect(route4.headers).toEqual({ ua: 'mobile' });

    const route5 = makeRoute(
      baseRoute,
      {
        url: '/baz',
        headers: {
          ua: 'pc',
        },
      },
      { ua: 'mobile' },
    );
    expect(route5.headers).toEqual({ ua: 'pc' });
  });
});
