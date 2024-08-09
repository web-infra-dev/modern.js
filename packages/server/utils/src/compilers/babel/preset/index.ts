import { getBabelConfigForNode } from '@modern-js/babel-preset/node';
import { ILibPresetOption } from './types';
import { aliasPlugin } from './alias';

export const getBabelConfig = (libPresetOption: ILibPresetOption) => {
  const { isEsm } = libPresetOption;
  const config = getBabelConfigForNode({
    presetEnv: {
      loose: true,
      modules: isEsm ? false : 'commonjs',
      targets: ['node >= 14'],
    },
    pluginDecorators: {
      version: 'legacy',
    },
  });

  config.presets?.push([
    require.resolve('@babel/preset-react'),
    {
      runtime: 'automatic',
    },
  ]);

  if (libPresetOption.alias) {
    config.plugins?.push(aliasPlugin(libPresetOption.alias));
  }

  config.plugins?.push(
    require.resolve('babel-plugin-transform-typescript-metadata'),
  );

  return config;
};

export * from './types';

export { applyUserBabelConfig } from '@modern-js/utils';
