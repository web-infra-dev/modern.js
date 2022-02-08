import { compile } from 'path-to-regexp';
import {
  noop,
  mergeExtension,
  toMessage,
  createErrorDocument,
  createMiddlewareCollecter,
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

  describe('test some case by toMessage func', () => {
    test('should get message from error like object', () => {
      const error = new Error('some error happened');
      const message = toMessage('error info', error);
      expect(message).toBe('error info: some error happened');
    });

    test('should get message from error message', () => {
      const errorMsg = 'some error happened';
      const message = toMessage('error info', errorMsg);
      expect(message).toBe('error info: some error happened');
    });
  });

  test('should return document text', () => {
    const doc = createErrorDocument(302, 'redirect');
    expect(doc).toMatch('302');
    expect(doc).toMatch('redirect');
    expect(doc).toMatch('302: redirect');
  });

  describe('test middleware collector', () => {
    test('shoule return web middleware correctly', () => {
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

    test('shoule return api middleware correctly', () => {
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
});
