import { describe, it, expect } from 'vitest';
import { createUniBuilder } from '../src';
import { unwrapConfig } from './helper';

describe('plugin-main-fields', () => {
  it('should support custom webpack resolve.mainFields', async () => {
    const mainFieldsOption = ['main', 'test', 'browser', ['module', 'exports']];

    const rsbuild = await createUniBuilder({
      bundlerType: 'webpack',
      cwd: '',
      config: {
        source: {
          resolveMainFields: mainFieldsOption,
        },
      },
    });

    const config = await unwrapConfig(rsbuild);

    const mainFieldsResult = ['main', 'test', 'browser', 'module', 'exports'];
    expect(config.resolve?.mainFields).toEqual(mainFieldsResult);
  });

  it('should support custom webpack resolve.mainFields by target', async () => {
    const mainFieldsOption = {
      web: ['main', 'browser'],
      node: ['main', 'node'],
    };

    const rsbuild = await createUniBuilder({
      bundlerType: 'webpack',
      cwd: '',
      config: {
        source: {
          resolveMainFields: mainFieldsOption,
        },
      },
    });

    const config = await unwrapConfig(rsbuild);

    expect(config.resolve?.mainFields).toEqual(mainFieldsOption.web);
  });
});
