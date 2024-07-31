import { merge } from '../src/merge';

describe('merge function', () => {
  test('should merge two simple objects', () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { b: 3, c: 4 };
    const result = merge({}, obj1, obj2);
    expect(result).toEqual({ a: 1, b: 3, c: 4 });
  });

  test('should merge nested objects', () => {
    const obj1 = { a: 1, b: { c: 2 } };
    const obj2 = { b: { d: 3 } };
    const result = merge({}, obj1, obj2);
    expect(result).toEqual({ a: 1, b: { c: 2, d: 3 } });
  });

  test('should handle multiple sources', () => {
    const obj1 = { a: 1 };
    const obj2 = { b: 2 };
    const obj3 = { c: 3 };
    const result = merge({}, obj1, obj2, obj3);
    expect(result).toEqual({ a: 1, b: 2, c: 3 });
  });

  test('should handle empty source objects', () => {
    const obj1 = { a: 1 };
    const result = merge({}, obj1, {}, {});
    expect(result).toEqual({ a: 1 });
  });

  test('should not modify the target object', () => {
    const target = { a: 1 };
    const obj1 = { b: 2 };
    const result = merge({}, target, obj1);
    expect(result).toEqual({ a: 1, b: 2 });
    expect(target).toEqual({ a: 1 });
  });

  test('should handle deep nested objects', () => {
    const obj1 = { a: { b: { c: 1 } } };
    const obj2 = { a: { b: { d: 2 } } };
    const result = merge({}, obj1, obj2);
    expect(result).toEqual({ a: { b: { c: 1, d: 2 } } });
  });

  test('should overwrite with later sources', () => {
    const obj1 = { a: 1 };
    const obj2 = { a: 2 };
    const obj3 = { a: 3 };
    const result = merge({}, obj1, obj2, obj3);
    expect(result).toEqual({ a: 3 });
  });
  test('should return right value when item is not object', () => {
    expect(merge({}, true as any, { a: 1 })).toEqual({ a: 1 });
    expect(merge({}, false as any, { a: 1 })).toEqual({ a: 1 });
    expect(merge({}, 1 as any, { a: 1 })).toEqual({ a: 1 });
    expect(merge({}, 'b' as any, { a: 1 })).toEqual({ a: 1 });
  });
});
