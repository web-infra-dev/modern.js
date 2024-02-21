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

  it('should insert babel plugin correctly in some edge case', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'production';

    const rsbuild = await createUniBuilder({
      bundlerType: 'webpack',
      config: {
        tools: {
          tsLoader: {},
          babel: {
            plugins: [
              [
                'babel-plugin-import',
                {
                  libraryName: 'xxx-components',
                  libraryDirectory: 'es',
                  style: true,
                },
              ],
            ],
          },
          webpackChain: (chain, { CHAIN_ID }) => {
            const withBabelPlugin = (babelOptions: any) => {
              if (typeof babelOptions !== 'object' || !babelOptions) {
                return babelOptions;
              }

              babelOptions.plugins = babelOptions.plugins || [];
              babelOptions.plugins.unshift(['babel-plugin-xxx']);
              return babelOptions;
            };

            if (chain.module.rules.has(CHAIN_ID.RULE.JS)) {
              chain.module
                .rule(CHAIN_ID.RULE.JS)
                .use(CHAIN_ID.USE.BABEL)
                .tap(withBabelPlugin);
            }
            if (chain.module.rules.has(CHAIN_ID.RULE.TS)) {
              chain.module
                .rule(CHAIN_ID.RULE.TS)
                .use(CHAIN_ID.USE.BABEL)
                .tap(withBabelPlugin);
            }
          },
        },
      },
      cwd: '',
    });

    const {
      origin: { bundlerConfigs },
    } = await rsbuild.inspectConfig();

    expect(
      matchRules({ config: bundlerConfigs[0], testFile: 'a.js' }),
    ).toMatchSnapshot();
    expect(
      matchRules({ config: bundlerConfigs[0], testFile: 'a.ts' }),
    ).toMatchSnapshot();

    process.env.NODE_ENV = NODE_ENV;
  });
});
