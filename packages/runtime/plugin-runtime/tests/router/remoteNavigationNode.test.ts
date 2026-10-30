import { addBasename, removeBasename } from '../../src/mf/navigation';

it('preserves query, hash and encoded segments while matching basename at a segment boundary', () => {
  expect(removeBasename('/inventory/a%2Fb?tab=a/b#part', '/inventory/')).toBe(
    '/a%2Fb?tab=a/b#part',
  );
  expect(removeBasename('/inventory?tab=stock#part', '/inventory')).toBe(
    '/?tab=stock#part',
  );
  expect(removeBasename('/inventory-other', '/inventory')).toBeUndefined();
  expect(removeBasename('/INVENTORY/a%2Fb?tab=A/B#Part', '/inventory')).toBe(
    '/a%2Fb?tab=A/B#Part',
  );
  expect(removeBasename('/INVENTORY-other', '/inventory')).toBeUndefined();
  expect(removeBasename('/inventory%2Fdetail', '/inventory')).toBeUndefined();
  expect(addBasename('/detail/42?tab=stock#part', '/inventory/')).toBe(
    '/inventory/detail/42?tab=stock#part',
  );
  expect(addBasename('/detail', '/')).toBe('/detail');
});

it('treats source-like path segments as ordinary local routes without implicit selection mapping', () => {
  expect(addBasename('/product/detail/a%2Fb?tab=a/b#chart', '/inventory')).toBe(
    '/inventory/product/detail/a%2Fb?tab=a/b#chart',
  );
  expect(removeBasename('/inventory/product/detail/42', '/inventory')).toBe(
    '/product/detail/42',
  );
  expect(addBasename('/?tab=stock#summary', '/inventory')).toBe(
    '/inventory?tab=stock#summary',
  );
  expect(addBasename('/', '/inventory')).toBe('/inventory');
});
