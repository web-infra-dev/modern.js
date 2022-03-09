import url from 'url';
import { createCache, destroyCache } from '../spr';
import {
  cacheAddition,
  connectFactor,
  fname,
  maybeSync,
  namespaceHash,
  valueFactory,
  withCoalescedInvoke,
} from '../util';

describe('test spr util functions', () => {
  it('should return value correctly', () => {
    expect(connectFactor('bar', 'foo')).toBe('bar-foo');
    expect(fname(1)).toBe('f1');
    expect(namespaceHash('modern', '!@#$%^&')).toBe('modern/!@#$%^&');
  });

  it('should create or destroy instance correctly', () => {
    const ins1 = createCache();
    const ins2 = createCache();
    expect(ins1 === ins2).toBe(true);
    destroyCache();
    const ins3 = createCache();
    expect(ins1 === ins3).toBe(false);
    expect(ins2 === ins3).toBe(false);
  });

  it('should return function correctly', () => {
    const urlParams: any = (() => new url.URLSearchParams())();
    urlParams.set('name', 'modern');
    const getParam = valueFactory(urlParams);
    expect(getParam('name')).toBe('modern');
    const headers: any = { age: '12345' };
    const getHeader = valueFactory(headers);
    expect(getHeader('age')).toBe('12345');
  });

  it('should add target html content', () => {
    const contentNoHead = '<div>123</div>';
    const html = cacheAddition(contentNoHead, Math.random().toString());
    expect(html).toBe(contentNoHead);

    const contentWithHead = '<head></head><div>123</div>';
    const hash = Math.random().toString();
    const htmlWithHead = cacheAddition(contentWithHead, hash);
    expect(htmlWithHead).toBe(
      `<head><meta name="x-moden-spr" content="${hash}"></head><div>123</div>`,
    );
  });

  it('should only invoke func one time', async () => {
    let index = 0;
    const fn = withCoalescedInvoke(
      async () =>
        new Promise(resolve => {
          setTimeout(() => {
            index += 1;
            resolve(index);
          }, 500);
        }),
    );
    const key = 'test';
    const [res1, res2] = await Promise.all([fn(key, []), fn(key, [])]);
    expect(res1.isOrigin && res2.isOrigin).toBe(false);
    expect(res1.isOrigin || res2.isOrigin).toBe(true);
    expect(res1.value).toBe(1);
    expect(res2.value).toBe(1);
  });

  it('should invoke sync or async', async () => {
    const foo = '';
    const async = await maybeSync(
      () =>
        new Promise(resolve => {
          setTimeout(() => {
            resolve(foo);
          }, 100);
        }),
    )(false);
    expect(async).toBeUndefined();

    const sync = await maybeSync(
      () =>
        new Promise(resolve => {
          setTimeout(() => {
            resolve(foo);
          }, 100);
        }),
    )(true);
    expect(sync).toBe(foo);
  });
});
