/**
 * @jest-environment node
 */
import path from 'path';
import {
  extractAPIHandlers,
  getMethod,
  getRouteName,
} from '../src/server/extract-api-handlers';
import { HttpMethod } from '../src/constant';

const PWD = path.resolve(__dirname, './fixtures/function');

describe('server', () => {
  describe('extractAPIHandlers', () => {
    it('should work', () => {
      const handlers = extractAPIHandlers(PWD);
      expect(handlers.length).toBe(26);
    });
  });

  describe('getMethod', () => {
    it('normal http method', () => {
      expect(getMethod('get')).toBe(HttpMethod.GET);
      expect(getMethod('post')).toBe(HttpMethod.POST);
      expect(getMethod('put')).toBe(HttpMethod.PUT);
      expect(getMethod('delete')).toBe(HttpMethod.DELETE);
      expect(getMethod('connect')).toBe(HttpMethod.CONNECT);
      expect(getMethod('trace')).toBe(HttpMethod.TRACE);
      expect(getMethod('patch')).toBe(HttpMethod.PATCH);
      expect(getMethod('option')).toBe(HttpMethod.OPTION);
    });

    it('del should get DELETE', () => {
      expect(getMethod('del')).toBe(HttpMethod.DELETE);
    });

    it('default should get GET', () => {
      expect(getMethod('default')).toBe(HttpMethod.GET);
    });

    it('others should get uppercase', () => {
      expect(getMethod('foo')).toBe('FOO');
      expect(getMethod('bar')).toBe('BAR');
      expect(getMethod('baz')).toBe('BAZ');
    });
  });

  describe('getRouteName', () => {
    it('normal path', () => {
      expect(getRouteName('', path.normalize('/foo.ts'))).toBe('/foo');
      expect(getRouteName('', path.normalize('/foo/test.ts'))).toBe(
        '/foo/test',
      );
    });

    it('with params', () => {
      expect(getRouteName('', path.normalize('/[id]/foo.ts'))).toBe('/:id/foo');
    });

    it('with index', () => {
      expect(getRouteName('', path.normalize('/foo/index.ts'))).toBe('/foo');
    });
  });
});
