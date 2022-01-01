import { createBistate, freeze, isSubArray } from '../src/index';

describe('createBistate', () => {
  describe('isSubArray', () => {
    it('truth case', () => {
      expect(isSubArray(['a'], ['a'])).toBeTruthy();

      expect(isSubArray(['a', 'b'], ['a'])).toBeTruthy();

      expect(isSubArray(['a', 'b'], ['a', 'b'])).toBeTruthy();
    });

    it('falsy case', () => {
      expect(isSubArray(['a', 'b', 'c'], ['a', 'b', 'd'])).toBeFalsy();
    });
  });

  it('could change value', () => {
    const state = createBistate({ foo: { bar: { baz: { count: 0 } } } });

    state.foo.bar.baz.count = 1;

    expect(state.foo.bar.baz.count).toBe(1);
  });

  it('could get reference with another value', () => {
    const state = createBistate({ foo: { bar: { baz: { count: 0 } } } });

    const a = state.foo.bar.baz;

    a.count = 1;

    expect(a.count).toBe(1);
    expect(state.foo.bar.baz.count).toBe(1);
  });

  it('could freeze', () => {
    const state = createBistate({ foo: { bar: { baz: { count: 0 } } } });

    freeze(state.foo.bar.baz, 'count');
  });

  it('freezed value can not been changed', () => {
    const state = createBistate({ foo: { bar: { baz: { count: 0 } } } });

    freeze(state.foo.bar.baz, 'count');

    expect(() => (state.foo.bar.baz.count = 1)).toThrowError();

    expect(state.foo.bar.baz.count).toBe(0);
  });

  it('unfreezed value can been changed', () => {
    const state = createBistate({
      foo: { bar: { baz: { count: 0, count1: 0 } } },
    });

    freeze(state.foo.bar.baz, 'count');

    expect(() => (state.foo.bar.baz.count = 1)).toThrowError();

    expect(state.foo.bar.baz.count).toBe(0);

    expect(() => (state.foo.bar.baz.count1 = 1)).not.toThrowError();

    expect(state.foo.bar.baz.count1).toBe(1);
  });

  it('freezed can not been changed with correct scope in bottom scope', () => {
    const state = createBistate({
      foo: { bar: { baz: { count: 0, count1: 0 } } },
    });

    freeze(state.foo.bar.baz, 'count');

    expect(() => (state.foo.bar.baz = { count: 1, count1: 1 })).toThrowError();
  });

  it('freezed can not been changed with correct scope in higher scope', () => {
    const state = createBistate({
      foo: { bar: { baz: { count: 0, count1: 0 } } },
    });

    freeze(state.foo.bar, 'baz');

    expect(() => (state.foo.bar.baz.count = 1)).toThrowError();
  });
});
