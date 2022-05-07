import { applyOptionsChain } from '../src/applyOptionsChain';

describe('apply options chain', () => {
  test(`should return default options`, () => {
    expect(applyOptionsChain({ default: 'a' })).toEqual({ default: 'a' });
  });

  test(`should merge default options`, () => {
    expect(
      applyOptionsChain(
        { name: 'a' },
        {
          name: 'b',
          custom: 'c',
        },
      ),
    ).toEqual({
      name: 'b',
      custom: 'c',
    });
  });

  test(`should support custom merge function`, () => {
    const merge = (target: any, source: any) => {
      for (const key in source) {
        if (target.hasOwnProperty(key)) {
          target[key] += source[key];
        } else {
          target[key] = source[key];
        }
      }
      return target;
    };

    expect(
      applyOptionsChain(
        {
          a: 1,
          b: 'b',
        },
        {
          a: 2,
          b: 'b',
          c: 'c',
        },
        {},
        merge,
      ),
    ).toEqual({
      a: 3,
      b: 'bb',
      c: 'c',
    });
  });

  test(`should support function or object array`, () => {
    const defaults = { a: 'a' };

    const options = [
      { b: 'b' },
      (o: any, { add }: { add: any }) => {
        o.c = add(1, 2);
      },
      (o: any) => ({
        ...o,
        d: 'd',
      }),
      { e: 'e' },
    ];
    expect(
      applyOptionsChain(defaults, options as any, {
        // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
        add: (a: any, b: any) => a + b,
      }),
    ).toEqual({
      a: 'a',
      b: 'b',
      c: 3,
      d: 'd',
      e: 'e',
    });
  });

  test(`should throw error`, () => {
    expect(() => {
      applyOptionsChain(1, 2);
    }).toThrow(/^applyOptionsChain error:/);
  });

  test(`should log warning about function result`, () => {
    let outputs = '';
    /* eslint-disable no-console */
    console.log = jest.fn(input => (outputs += input));
    /* eslint-enable no-console */
    applyOptionsChain({ name: 'a' } as any, [() => 111]);

    expect(outputs).toContain(
      'Function should mutate the config and return nothing, Or return a cloned or merged version of config object.',
    );
  });
});
