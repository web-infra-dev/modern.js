import { mergeConfig } from '../src/utils/mergeConfig';
import { assignPkgConfig } from '../src/config';
import { UserConfig, UserConfigExport } from '../src/types';

describe('merge config', () => {
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

  test(`should set value when property value is not undefined `, () => {
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

  test(`should ignore undefined property`, () => {
    const config = mergeConfig([
      { source: { entries: { app: './App.tsx' } } },
      { source: { entries: undefined } },
      { tools: { webpack: () => ({}) } },
      { tools: { webpack: undefined } },
    ]);
    expect(config.source).toEqual({
      entries: {
        app: './App.tsx',
      },
    });
    expect(Array.isArray(config.tools.webpack)).toBe(false);
    expect(typeof config.tools.webpack).toBe('function');
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

    expect(
      mergeConfig([
        { source: { envVars: ['a', 'b'] } },
        { source: { envVars: undefined } },
      ]),
    ).toEqual({
      source: { envVars: ['a', 'b'] },
    });
  });

  test(`should keep single function value`, () => {
    const config = mergeConfig([
      { tools: { webpack: undefined } },
      { tools: { webpack: () => ({}) } },
    ]);
    expect(typeof config.tools.webpack).toEqual('function');
  });

  test(`should merge function and object value`, () => {
    const config = mergeConfig([
      { source: { alias: { a: 'b' } } },
      { source: { alias: () => ({ c: 'd' }) } },
      { tools: { webpack: () => ({}) } },
      { tools: { webpack: { name: 'test' } } },
      { tools: { webpack: () => ({}) } },
    ]);
    expect(Array.isArray(config.source.alias)).toBe(true);
    expect(config?.source?.alias?.length).toBe(2);
    expect(typeof (config.source.alias as Array<any>)[1]).toBe('function');
    expect(Array.isArray(config.tools.webpack)).toBe(true);
    expect(config.tools.webpack.length).toBe(3);
    expect(typeof (config.tools.webpack as Array<any>)[0]).toBe('function');
    expect(typeof (config.tools.webpack as Array<any>)[2]).toBe('function');
  });
});

// TODO: move into app-tools
describe('assign pkg config', () => {
  test('should preserve symbol of plugins', () => {
    expect(
      assignPkgConfig(
        {
          plugins: [
            {
              [Symbol.for('test')]: 'test',
            },
          ],
        },
        {
          runtime: {
            router: true,
          },
        } as UserConfigExport,
      ),
    ).toMatchSnapshot();
  });

  test('should merge properties deeply', () => {
    expect(
      assignPkgConfig(
        {
          runtime: {
            state: true,
          },
        } as UserConfig,
        {
          runtime: {
            router: true,
          },
        } as UserConfigExport,
      ),
    ).toMatchSnapshot();
  });
});
