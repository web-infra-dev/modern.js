import { test, expect, describe } from 'vitest';
import {
  withoutLang,
  withBase,
  withoutBase,
  normalizeHref,
  replaceLang,
  parseUrl,
} from '.';

describe('test shared utils', () => {
  test('withoutLang', () => {
    const langs = ['zh', 'en'];
    expect(withoutLang('/zh/guide/', langs)).toBe('/guide/');
  });

  test('withBase', () => {
    expect(withBase('/guide/', '/zh/')).toBe('/zh/guide/');
    expect(withBase('/guide/', '/')).toBe('/guide/');
    expect(withBase('/guide/', '')).toBe('/guide/');
  });

  test('mutiple withBase', () => {
    const base = '/my-base/';
    const firstResult = withBase('/guide/', base);
    const secondResult = withBase(firstResult, base);
    expect(secondResult).toBe('/my-base/guide/');
  });

  test('withoutBase', () => {
    expect(withoutBase('/zh/guide/', '/zh/')).toBe('/guide/');
    expect(withoutBase('/guide/', '/')).toBe('/guide/');
    expect(withoutBase('/guide/', '')).toBe('/guide/');
  });

  test('normalizeHref', () => {
    expect(normalizeHref('/guide/')).toBe('/guide/index.html');
    expect(normalizeHref('/guide')).toBe('/guide.html');
    expect(normalizeHref('/guide/index.html')).toBe('/guide/index.html');
    expect(normalizeHref('/guide/index')).toBe('/guide/index.html');
    expect(normalizeHref('https://example.com/xxx')).toBe(
      'https://example.com/xxx',
    );
    expect(normalizeHref('mailto:bluth@example.com')).toBe(
      'mailto:bluth@example.com',
    );
    expect(normalizeHref('tel:123456789')).toBe('tel:123456789');
  });

  test('replaceLang', () => {
    const langs = ['zh', 'en'];
    expect(replaceLang('/en/guide/', 'zh', 'zh', langs)).toBe('/guide/');
    expect(replaceLang('/en/guide/', 'en', 'zh', langs)).toBe('/en/guide/');
    expect(replaceLang('/guide/', 'zh', 'zh', langs)).toBe('/guide/');
    expect(replaceLang('/guide/', 'en', 'zh', langs)).toBe('/en/guide/');
    expect(replaceLang('/builder', 'en', 'zh', langs, '/builder')).toBe(
      '/builder/en/index.html',
    );
  });

  test('parseUrl', () => {
    expect(parseUrl('/guide/')).toEqual({
      url: '/guide/',
      hash: '',
    });
    expect(parseUrl('/guide/?a=1')).toEqual({
      url: '/guide/?a=1',
      hash: '',
    });
    expect(parseUrl('/guide/#a=1')).toEqual({
      url: '/guide/',
      hash: 'a=1',
    });
    expect(parseUrl('/guide/?a=1#b=2')).toEqual({
      url: '/guide/?a=1',
      hash: 'b=2',
    });
  });
});
