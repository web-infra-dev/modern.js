import fs from 'fs';
import { path } from '@modern-js/utils';
// import { createInvoker } from '../libs/invoker';
import { ModernRoute } from '@modern-js/server';
import { exist, replaceRoute } from '@/libs/replace';
import {
  AgreedRoute,
  CreatePageListener,
  HookContext,
  SsgRoute,
} from '@/types';
import { createPageFactory } from '@/libs/createPage';
import { invoker } from '@/libs/invoker';

const noop = () => {
  //
};

describe('test functional function', () => {
  it('should listener get arguments correctly', () => {
    const route = { path: '/foo', agreed: false };
    const listener: CreatePageListener = (r: SsgRoute, agreed?: boolean) => {
      expect(r.urlPath).toBe('/foo');
      expect(agreed).toBeFalsy();
    };
    const createPage = createPageFactory(route as any, listener);
    createPage();
  });

  it('should listener get url correctly', () => {
    const route = { path: '/foo', agreed: false };
    const listener: CreatePageListener = (r: SsgRoute, agreed?: boolean) => {
      expect(r.urlPath).toBe('/bar');
      expect(agreed).toBeFalsy();
    };
    const createPage = createPageFactory(route as any, listener);
    createPage({ url: '/bar' });
  });

  it('should listener get output correctly', () => {
    const route = { path: '/foo', agreed: false };
    const listener: CreatePageListener = (r: SsgRoute, agreed?: boolean) => {
      expect(r.output).toBe('./bar');
      expect(agreed).toBeFalsy();
    };
    const createPage = createPageFactory(route as any, listener);
    createPage({ output: './bar' });
  });

  it('should listener get dynamic route correctly', () => {
    const route = { path: '/:foo', agreed: true };
    const listener: CreatePageListener = (r: SsgRoute, agreed?: boolean) => {
      expect(r.urlPath).toBe('/bar');
      expect(agreed).toBeTruthy();
    };
    const createPage = createPageFactory(route as any, listener);
    createPage({ params: { foo: 'bar' } });
  });

  it('should listener get multi route correctly', () => {
    const route = { path: '/foo', agreed: false };
    const urls = ['/a', '/b', '/c'];
    const listener: CreatePageListener = (r: SsgRoute) => {
      expect(urls.includes(r.urlPath)).toBe(true);
    };
    const createPage = createPageFactory(route as any, listener);
    createPage(urls.map(url => ({ url })));
  });

  it('should hook get context correctly', () => {
    const pageRoutes = [
      {
        urlPath: '/foo',
        entryName: 'foo',
      },
      {
        urlPath: '/bar',
        entryName: 'bar',
      },
    ];
    let i = 0;
    const hook = (context: HookContext) => {
      expect(typeof context.createPage).toBe('function');
      expect(context.route.path).toEqual(pageRoutes[i].urlPath);
      i++;
    };

    invoker(pageRoutes as any, {}, hook, () => false, noop);
  });

  it('should hook get context correctly while use appoint', () => {
    const pageRoutes = [
      {
        urlPath: '/foo',
        entryName: 'foo',
      },
    ];
    const appointRouteMap: Record<string, AgreedRoute[]> = {
      foo: [
        {
          path: '/a',
          component: 'a',
          _component: 'a',
          exact: true,
        },
        {
          path: '/b',
          component: 'b',
          _component: 'b',
          exact: true,
        },
      ],
    };

    let i = 0;
    const hook = (context: HookContext) => {
      expect(typeof context.createPage).toBe('function');
      expect(context.route.path).toEqual(`/foo${appointRouteMap.foo[i].path}`);
      i++;
    };

    invoker(
      pageRoutes as any,
      appointRouteMap,
      hook,
      context => {
        expect(['a', 'b'].includes(context.component)).toBeTruthy();
        return true;
      },
      noop,
    );
  });

  it('only static route invoke checker', () => {
    const pageRoutes = [
      {
        urlPath: '/foo',
        entryName: 'foo',
      },
      {
        urlPath: '/:bar',
        entryName: 'bar',
      },
    ];
    const appointRouteMap: Record<string, AgreedRoute[]> = {
      foo: [
        {
          path: '/a',
          component: 'a',
          _component: 'a',
          exact: true,
        },
      ],
      bar: [
        {
          path: '/b',
          component: 'b',
          _component: 'b',
          exact: true,
        },
      ],
    };

    invoker(
      pageRoutes as any,
      appointRouteMap,
      noop,
      context => {
        expect(context.component).toBe('a');
        return true;
      },
      noop,
    );
  });

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
    const matrial = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, 'material/replace.route.json'),
        'utf-8',
      ),
    );

    const { origin, ssg, final } = matrial;
    const result = replaceRoute(ssg, origin);

    expect(result).toEqual(final);
  });
});
