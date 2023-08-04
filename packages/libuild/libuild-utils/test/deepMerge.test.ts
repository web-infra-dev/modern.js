import { expect } from 'chai';
import { deepMerge } from '../src';

describe('deepMerge', () => {
  it('args are not Object', () => {
    // @ts-ignore
    expect(() => deepMerge(1, {})).Throw(Error);
    // @ts-ignore
    expect(() => deepMerge({}, false)).Throw(Error);
    expect(() => deepMerge([], {})).Throw(Error);
  });

  it('different', () => {
    expect(deepMerge({ a: 1 }, { b: '2' })).deep.equal({ a: 1, b: '2' });
  });

  it('second has higher priortesty', () => {
    expect(deepMerge({ a: 1, b: 2 }, { b: '2' })).deep.equal({ a: 1, b: '2' });
  });

  it('`undefined` or `null` will no cover', () => {
    expect(deepMerge({ a: 1, b: 2 }, { a: undefined, b: '2', c: null })).deep.equal({ a: 1, b: '2' });
  });

  it('do not mutate inputs', () => {
    const x = { a: { b: 1 }, c: 2 };
    const y = { d: 1, c: '2', g: {}, e: [] };
    deepMerge(x, y);
    expect(x).deep.equal({ a: { b: 1 }, c: 2 });
    expect(y).deep.equal({ d: 1, c: '2', g: {}, e: [] });
  });

  it('deep clone', () => {
    expect(deepMerge({}, { a: { b: { c: [1] } } })).deep.equal({ a: { b: { c: [1] } } });
  });

  it('deep replace and merge', () => {
    expect(deepMerge({ a: { b: 1, c: 2 } }, { a: { b: {}, d: [] } })).deep.equal({ a: { b: {}, c: 2, d: [] } });
  });

  it('deep array', () => {
    expect(deepMerge({ a: [1], b: { a: [1] }, c: [1, {}] }, { a: 1, b: { a: [2] }, c: [2] })).deep.equal({
      a: 1,
      b: { a: [1, 2] },
      c: [1, {}, 2],
    });
  });
});
