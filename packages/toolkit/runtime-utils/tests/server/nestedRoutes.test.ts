import type { ServerRoute } from '@modern-js/types';
import { matchEntry } from '../../src/server/nestedRoutes';

const route = (urlPath: string, entryName = urlPath): ServerRoute => ({
  urlPath,
  entryName,
  entryPath: `html/${entryName}/index.html`,
});

describe('matchEntry', () => {
  const createEntries = () => [
    route('/', 'main'),
    route('/shop'),
    route('/shop/cart'),
    route('/admin'),
  ];

  it('should match the entry with the longest urlPath', () => {
    const entries = createEntries();
    expect(matchEntry('/shop/cart/1', entries)?.urlPath).toBe('/shop/cart');
    expect(matchEntry('/shop/list', entries)?.urlPath).toBe('/shop');
    expect(matchEntry('/user', entries)?.urlPath).toBe('/');
    expect(matchEntry('/user', createEntries().slice(1))).toBeUndefined();
  });

  it('should match the first entry when urlPaths are the same', () => {
    const duplicated = [route('/a', 'first'), route('/a', 'second')];
    expect(matchEntry('/a/b', duplicated)?.entryName).toBe('first');
  });

  it('should not reorder the entries', () => {
    const entries = createEntries();
    const copy = [...entries];
    matchEntry('/shop/cart', entries);
    expect(entries).toEqual(copy);
  });
});
