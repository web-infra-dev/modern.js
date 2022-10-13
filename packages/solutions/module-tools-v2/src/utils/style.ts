import type { AcceptedPlugin } from 'postcss';
import type { PluginAPI } from '@modern-js/core';
import type { PostcssOptions } from '@modern-js/libuild';
import type {
  UserConfig,
  PostCSSConfigUtils,
  LessOptions,
  SassOptions,
} from '../types';
import type { ModuleToolsHooks } from '../types/hooks';

export const getLessConfig = async (config: UserConfig) => {
  const { applyOptionsChain } = await import('@modern-js/utils');
  const mergedOptions = applyOptionsChain<LessOptions, never>(
    { javascriptEnabled: true },
    config?.tools?.less || {},
  );

  return mergedOptions;
};

export const getSassConfig = async (config: UserConfig) => {
  const { applyOptionsChain } = await import('@modern-js/utils');
  const mergedOptions = applyOptionsChain<SassOptions, never>(
    {},
    config.tools?.sass || {},
  );

  return mergedOptions;
};

export const getPostcssConfig = async (config: UserConfig) => {
  const { applyOptionsChain } = await import('@modern-js/utils');
  const { getCompiledPath } = await import('./path');
  const extraPlugins: AcceptedPlugin[] = [];

  const utils = {
    addPlugins(plugins: AcceptedPlugin | AcceptedPlugin[]) {
      if (Array.isArray(plugins)) {
        extraPlugins.push(...plugins);
      } else {
        extraPlugins.push(plugins);
      }
    },
  };

  const mergedConfig = applyOptionsChain<PostcssOptions, PostCSSConfigUtils>(
    {
      plugins: [
        require(getCompiledPath('postcss-flexbugs-fixes')),
        require(getCompiledPath('postcss-custom-properties')),
        require(getCompiledPath('postcss-initial')),
        require(getCompiledPath('postcss-page-break')),
        require(getCompiledPath('postcss-font-variant')),
        require(getCompiledPath('postcss-media-minmax')),
        require(getCompiledPath('postcss-nesting')),
      ].filter(Boolean),
    },
    (config?.tools?.postcss as any) || {},
    utils,
  );
  if (extraPlugins.length) {
    mergedConfig.plugins!.push(...extraPlugins);
  }

  return mergedConfig;
};

export const getStyleConfig = async (api: PluginAPI<ModuleToolsHooks>) => {
  const config = api.useResolvedConfigContext() as unknown as UserConfig;
  const postcssConfig = await getPostcssConfig(config);
  const lessConfig = await getLessConfig(config);
  const sassConfig = await getSassConfig(config);

  const runner = api.useHookRunners();
  const tailwindPlugin = await runner.addTailwindCssConfig(undefined, {
    onLast: async (_: any) => undefined,
  });
  if (tailwindPlugin) {
    postcssConfig.plugins?.push(tailwindPlugin);
  }

  return {
    less: lessConfig,
    sass: sassConfig,
    postcss: postcssConfig,
  };
};
