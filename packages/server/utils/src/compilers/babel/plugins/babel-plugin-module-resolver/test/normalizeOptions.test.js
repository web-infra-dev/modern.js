import normalizeOptions from '../src/normalizeOptions';

describe('normalizeOptions', () => {
  beforeEach(() => {
    normalizeOptions.resetRecomputations();
  });

  it('should return the memoized options when the dirnames are the same', () => {
    const options = {};
    const result = normalizeOptions('path/a.js', options);
    const result2 = normalizeOptions('path/b.js', options);

    expect(result).toBe(result2);
    expect(normalizeOptions.recomputations()).toEqual(1);
  });

  it('should return the memoized options when the special paths are the same', () => {
    const options = {};
    const result = normalizeOptions('unknown', options);
    const result2 = normalizeOptions('unknown', options);

    expect(result).toBe(result2);
    expect(normalizeOptions.recomputations()).toEqual(1);
  });

  it('should recompute when the options object is not the same', () => {
    const options = {};
    const options2 = {};
    const result = normalizeOptions('path/to/file.js', options);
    const result2 = normalizeOptions('path/to/file.js', options2);

    expect(result).not.toBe(result2);
    expect(normalizeOptions.recomputations()).toEqual(2);
  });

  it('should correctly normalize alias option if it is an array', () => {
    const options = {
      alias: [
        {
          foo: 'A',
          bar: 'B',
        },
        {
          baz: 'C',
        },
      ],
    };
    const { alias } = normalizeOptions('path/to/file.js', options);

    expect(alias[0][0]).toEqual(/^foo(\/.*|)$/);
    expect(alias[1][0]).toEqual(/^bar(\/.*|)$/);
    expect(alias[2][0]).toEqual(/^baz(\/.*|)$/);
  });
});
