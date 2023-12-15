import { describe, it, expect } from 'vitest';
import { createUniBuilder } from '../src';
import { matchRules, unwrapConfig } from './helper';

describe('plugin-ts-loader', () => {
  it('should set ts-loader', async () => {
    const rsbuild = await createUniBuilder({
      bundlerType: 'webpack',
      cwd: '',
      config: {
        tools: {
          tsLoader: {},
        },
      },
    });
    const config = await unwrapConfig(rsbuild);

    expect(matchRules({ config, testFile: 'a.ts' })).toMatchSnapshot();
  });

  it('should set include/exclude', async () => {
    const rsbuild = await createUniBuilder({
      bundlerType: 'webpack',
      cwd: '',
      config: {
        tools: {
          tsLoader: (options, { addIncludes, addExcludes }) => {
            addIncludes(['src/**/*.ts']);
            addExcludes(['src/**/*.js']);
            return options;
          },
        },
      },
    });
    const config = await unwrapConfig(rsbuild);

    expect(matchRules({ config, testFile: 'a.ts' })).toMatchSnapshot();
  });
});
