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

  test('should handle complex instances like i18next without deep merging', () => {
    // Mock i18next-like instance
    const i18nInstance = {
      language: 'en',
      isInitialized: true,
      init: rs.fn(),
      changeLanguage: rs.fn(),
      t: rs.fn(),
      store: {
        data: { en: { translation: {} } },
      },
    };

    const config1 = { a: 1, i18n: i18nInstance };
    const config2 = { b: 2, i18n: { language: 'zh' } };

    const result = merge({}, config1, config2);

    // Should not deep merge the i18n instance, but replace it entirely
    expect(result.i18n).toBe(config2.i18n);
    expect(result.a).toBe(1);
    expect(result.b).toBe(2);
  });

  test('should handle circular references in complex instances', () => {
    // Create a circular reference
    const circularObj = { name: 'test' };
    circularObj.self = circularObj;

    const i18nInstance = {
      language: 'en',
      isInitialized: true,
      init: rs.fn(),
      changeLanguage: rs.fn(),
      circular: circularObj,
    };

    const config1 = { a: 1 };
    const config2 = { i18n: i18nInstance };

    // This should not throw a stack overflow error
    expect(() => {
      const result = merge({}, config1, config2);
      expect(result.i18n).toBe(i18nInstance);
    }).not.toThrow();
  });
});
