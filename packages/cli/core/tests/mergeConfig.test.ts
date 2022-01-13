import { mergeConfig } from '../src/config/mergeConfig';

describe('load plugins', () => {
  test('should replace property deeply', () => {
    expect(
      mergeConfig([
        {
          source: { disableDefaultEntries: false },
          output: { polyfill: 'usage' },
        },
        {
          source: { disableDefaultEntries: true },
          output: { polyfill: 'entry' },
        },
      ]),
    ).toEqual({
      source: { disableDefaultEntries: true },
      output: { polyfill: 'entry' },
    });
  });

  test(`should set value when property value is undefined `, () => {
    expect(
      mergeConfig([
        { source: { entries: { app: './App.tsx' } } },
        { source: { entries: { app2: './src/App2.tsx' } } },
        { server: { baseUrl: './a' } },
      ]),
    ).toEqual({
      source: {
        entries: {
          app: './App.tsx',
          app2: './src/App2.tsx',
        },
      },
      server: { baseUrl: './a' },
    });
  });

  test(`should merge array value`, () => {
    expect(
      mergeConfig([
        { source: { envVars: ['a', 'b'] } },
        { source: { globalVars: { A: '1' } } },
        {
          source: {
            disableDefaultEntries: true,
            envVars: ['c', 'd'],
            globalVars: { B: '2' },
          },
        },
      ]),
    ).toEqual({
      source: {
        disableDefaultEntries: true,
        envVars: ['a', 'b', 'c', 'd'],
        globalVars: {
          A: '1',
          B: '2',
        },
      },
    });
  });

  test(`should merge function and object value`, () => {
    const config = mergeConfig([
      { source: { alias: { a: 'b' } } },
      { source: { alias: () => ({ c: 'd' }) } },
      { tools: { webpack: () => ({}) } },
    ]);
    expect(Array.isArray(config.source.alias)).toBe(true);
    expect(config?.source?.alias?.length).toBe(2);
    expect(typeof (config.source.alias as Array<any>)[1]).toBe('function');

    expect(Array.isArray(config.tools.webpack)).toBe(true);
    expect(config.tools.webpack?.length).toBe(1);
  });
});
