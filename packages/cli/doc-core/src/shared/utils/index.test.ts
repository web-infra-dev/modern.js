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
  });

  test('replaceLang', () => {
    const langs = ['zh', 'en'];
    expect(replaceLang('/en/guide/', 'zh', 'zh', langs)).toBe('/guide/');
    expect(replaceLang('/en/guide/', 'en', 'zh', langs)).toBe('/en/guide/');
    expect(replaceLang('/guide/', 'zh', 'zh', langs)).toBe('/guide/');
    expect(replaceLang('/guide/', 'en', 'zh', langs)).toBe('/en/guide/');
  });

  test('parseUrl', () => {
    expect(parseUrl('/guide/')).toEqual({
      url: '/guide/',
      query: '',
      hash: '',
    });
    expect(parseUrl('/guide/?a=1')).toEqual({
      url: '/guide/',
      query: 'a=1',
      hash: '',
    });
    expect(parseUrl('/guide/#a=1')).toEqual({
      url: '/guide/',
      query: '',
      hash: 'a=1',
    });
    expect(parseUrl('/guide/?a=1#b=2')).toEqual({
      url: '/guide/',
      query: 'a=1',
      hash: 'b=2',
    });
  });
});
