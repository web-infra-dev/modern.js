import type { Options } from '@storybook/types';
import { CHAIN_ID, logger } from '@modern-js/utils';
import { RspackConfig } from '@modern-js/builder-rspack-provider';
import { WebpackChain } from '@modern-js/builder-webpack-provider';

export type DocgenOptions = {
  reactDocgen?: 'react-docgen' | 'react-docgen-typescript' | false;
  reactDocgenTypescriptOptions?: any;
};

export async function applyDocgenWebpack(
  chain: WebpackChain,
  options: Options,
) {
  const typescriptOptions: DocgenOptions = await options.presets.apply(
    'typescript',
    {},
  );

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
  }

  const babelUse = chain.module.rule(CHAIN_ID.RULE.JS).use(CHAIN_ID.USE.BABEL);
  const babelOptions = babelUse.get('options');

  // uses babel
  if (babelOptions) {
    babelUse.set('options', {
      ...babelOptions,
      overrides: [
        ...(babelOptions.overrides || []),
        {
          test:
            reactDocgen === 'react-docgen'
              ? /\.(cjs|mjs|tsx?|jsx?)$/
              : /\.(cjs|mjs|jsx?)$/,
          plugins: [[require.resolve('babel-plugin-react-docgen')]],
        },
      ],
    });
    return;
  }

  // uses SWC or other transpilers
  chain.module
    .rule(CHAIN_ID.RULE.JS)
    .use('docgen')
    .loader(require.resolve('./loader'))
    .options({
      resolveOptions: chain.toConfig().resolve,
    });

  chain.module
    .rule(CHAIN_ID.RULE.TS)
    .use('docgen')
    .loader(require.resolve('./loader'))
    .options({
      resolveOptions: chain.toConfig().resolve,
    });
}

export async function applyDocgenRspack(
  config: RspackConfig,
  options: Options,
) {
  const typescriptOptions: { reactDocgen?: 'react-docgen' } =
    await options.presets.apply('typescript', {});

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
