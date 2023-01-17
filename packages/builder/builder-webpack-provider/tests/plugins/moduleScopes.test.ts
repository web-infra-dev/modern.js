import { expect, describe, it } from 'vitest';
import {
  builderPluginModuleScopes,
  isPrimitiveScope,
  applyScopeChain,
} from '@/plugins/moduleScopes';
import { createStubBuilder } from '@/stub';

describe('plugins/moduleScopes', () => {
  it('should set entry correctly', async () => {
    const builder = await createStubBuilder({
      plugins: [builderPluginModuleScopes()],
      builderConfig: {
        source: {
          moduleScopes: ['./src/foo.ts', './src/bar.ts'],
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });
});

describe('isPrimitiveScope', () => {
  it('should return true if only contains string or RegExp', () => {
    expect(isPrimitiveScope([/bar/])).toBe(true);
    expect(isPrimitiveScope(['./foo.ts'])).toBe(true);
    expect(isPrimitiveScope(['./foo.ts', /bar/])).toBe(true);
  });

  it('should return false if contains function', () => {
    expect(isPrimitiveScope(['./foo.ts', /bar/, () => ['baz']])).toBe(false);
  });
});

describe('applyScopeChain', () => {
  it('should merge scopes correctly', () => {
    expect(applyScopeChain([], () => ['baz'])).toEqual(['baz']);

    expect(applyScopeChain(['foo'], input => [...input, 'baz'])).toEqual([
      'foo',
      'baz',
    ]);

    expect(applyScopeChain([], ['foo', /bar/])).toEqual(['foo', /bar/]);

    expect(
      applyScopeChain(['foo'], [[/bar/], input => [...input, 'baz']]),
    ).toEqual(['foo', /bar/, 'baz']);

    expect(
      applyScopeChain(['foo'], [[/bar/], input => [...input, 'baz'], ['qux']]),
    ).toEqual(['foo', /bar/, 'baz', 'qux']);

    expect(
      applyScopeChain(
        ['foo'],
        [
          [/bar/],
          input => {
            input.push('baz');
          },
          ['qux'],
        ],
      ),
    ).toEqual(['foo', /bar/, 'baz', 'qux']);
  });
});
