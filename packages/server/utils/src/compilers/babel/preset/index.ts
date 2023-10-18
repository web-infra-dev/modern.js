import { getBabelConfigForNode } from '@rsbuild/babel-preset/node';
import { ILibPresetOption } from './types';
import { aliasPlugin } from './alias';

export const getBabelConfig = (libPresetOption: ILibPresetOption) => {
  const config = getBabelConfigForNode({
    presetEnv: {
      loose: true,
      modules: 'commonjs',
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
