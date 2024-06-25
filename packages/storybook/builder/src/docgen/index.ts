import type { Options } from '@storybook/types';
import { logger } from '@modern-js/utils';
import { CHAIN_ID } from '@rsbuild/shared';
import type { RspackConfig, RspackChain } from '@rsbuild/shared';

export type DocgenOptions = {
  reactDocgen?: 'react-docgen' | 'react-docgen-typescript' | false;
  reactDocgenTypescriptOptions?: any;
};

export async function applyDocgenWebpack(chain: RspackChain, options: Options) {
  const typescriptOptions = (await options.presets.apply(
    'typescript',
    {},
  )) as DocgenOptions;

  const { reactDocgen, reactDocgenTypescriptOptions } = typescriptOptions || {};

  if (typeof reactDocgen !== 'string') {
    return;
  }

  if (reactDocgen === 'react-docgen-typescript') {
    const { ReactDocgenTypeScriptPlugin } = await import(
      '@storybook/react-docgen-typescript-plugin'
    );
    chain.plugin('Storybook-docgen').use(ReactDocgenTypeScriptPlugin, [
      {
        ...reactDocgenTypescriptOptions,
        savePropValueAsString: true,
      },
    ]);
  } else if (reactDocgen === 'react-docgen') {
    // use babel react-docgen, its faster
    const loader = require.resolve('./loader');
    const resolveOptions = chain.toConfig().resolve;

    chain.module
      .rule(CHAIN_ID.RULE.JS)
      .use('react-docgen')
      .loader(loader)
      .options({
        resolveOptions,
      })
      .after(CHAIN_ID.USE.BABEL)
      .after('esbuild')
      .after(CHAIN_ID.USE.SWC)
      .end();

    const tsRuls = chain.module.rule(CHAIN_ID.RULE.TS);
    if (tsRuls.uses.values().length !== 0) {
      tsRuls
        .use('react-docgen')
        .loader(loader)
        .options({
          resolveOptions,
        })
        .after(CHAIN_ID.USE.TS)
        .after('esbuild')
        .after(CHAIN_ID.USE.SWC)
        .end();
    }
  }
}

export async function applyDocgenRspack(
  config: RspackConfig,
  options: Options,
) {
  const typescriptOptions = (await options.presets.apply('typescript', {})) as {
    reactDocgen?: 'react-docgen';
  };

  const { reactDocgen } = typescriptOptions || {};

  if (reactDocgen !== 'react-docgen') {
    if (reactDocgen !== false && reactDocgen !== undefined) {
      logger.warn(
        `Rspack currently only support 'typescript.reactDocgen: react-docgen' for auto docs generation, but you specified ${reactDocgen}`,
      );
    }
    return;
  }

  // For rspack, just add a new rule
  config.module ??= {};
  config.module.rules ??= [];
  config.module.rules.push({
    test: /\.(tsx?|jsx?)$/,
    exclude: /node_modules/,
    use: {
      loader: require.resolve('./loader'),
      options: {
        resolveOptions: config.resolve,
      },
    },
  });
}
