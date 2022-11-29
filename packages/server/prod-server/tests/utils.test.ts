import { compile } from 'path-to-regexp';
import {
  noop,
  mergeExtension,
  createErrorDocument,
  createMiddlewareCollecter,
  getStaticReg,
  headersWithoutCookie,
} from '../src/utils';

describe('test server utils', () => {
  test('should get nothing from noop', async () => {
    const rtn = noop();
    expect(rtn).toBeUndefined();
  });

  test('should merge extension', () => {
    const middleware = ['foo', 'baz'];
    const extension = mergeExtension(middleware);
    expect(extension.middleware).toEqual(middleware);
  });

  test('should return document text', () => {
    const doc = createErrorDocument(302, 'redirect');
    expect(doc).toMatch('302');
    expect(doc).toMatch('redirect');
    expect(doc).toMatch('302: redirect');
  });

  describe('test middleware collector', () => {
    test('should return web middleware correctly', () => {
      const { addWebMiddleware, getMiddlewares } = createMiddlewareCollecter();

      const before = getMiddlewares();
      expect(before.web).toEqual([]);

      const middleware = async () => {
        // empty
      };
      addWebMiddleware(middleware);
      const after = getMiddlewares();
      expect(after.web).toEqual([middleware]);
    });

    test('should return api middleware correctly', () => {
      const { addAPIMiddleware, getMiddlewares } = createMiddlewareCollecter();

      const before = getMiddlewares();
      expect(before.web).toEqual([]);

      const middleware = async () => {
        // empty
      };
      addAPIMiddleware(middleware);
      const after = getMiddlewares();
      expect(after.api).toEqual([middleware]);
    });
  });

  test('should return full path', () => {
    const fn = compile('/home/:id', { encode: encodeURIComponent });
    expect(fn({ id: 2 })).toBe('/home/2');
  });

  describe('test create static reg', () => {
    test('should test static path correctly', () => {
      const reg = getStaticReg();
      expect(reg.test('/static/')).toBeTruthy();
      expect(reg.test('/upload/')).toBeTruthy();
    });

    test('should test custom static path correctly', () => {
      const reg = getStaticReg({
        distPath: {
          css: 'static-css',
        },
      });
      expect(reg.test('/static-css')).toBeTruthy();
    });

    test('should test custom static path correctly', () => {
      const { NODE_ENV } = process.env;
      process.env.NODE_ENV = 'production';

      const reg = getStaticReg({
        assetPrefix: '/foo/',
      });
      expect(reg.test('/foo/static/a.js')).toBeTruthy();
      expect(reg.test('/foo/static/a.css')).toBeTruthy();
      expect(reg.test('/bar/static/a.css')).toBeFalsy();

      process.env.NODE_ENV = NODE_ENV;
    });

    test('should test favicon path correctly', () => {
      const reg = getStaticReg(
        {},
        {
          favicon: 'index.icon',
          faviconByEntries: {
            foo: 'foo.icon',
            baz: 'baz.icon',
          },
        },
      );
      expect(reg.test('/index.icon')).toBeTruthy();
      expect(reg.test('/foo.icon')).toBeTruthy();
      expect(reg.test('/baz.icon')).toBeTruthy();
    });
  });

  test('should remove cookie correctly', () => {
    const headers = headersWithoutCookie({
      cookie: '',
      'content-type': 'text/plain',
    });
    expect(headers.cookie).toBeUndefined();
    expect(headers['content-type']).toBe('text/plain');
  });
});
