import { createUniBuilder, UniBuilderInstance } from '@modern-js/uni-builder';
import { BundlerType } from '@rsbuild/shared';
import { BuilderOptions } from '../shared';
import { Bundler } from '../../types';
import { createBuilderProviderConfig } from './createBuilderProviderConfig';
import { getBuilderTargets } from './getBuilderTargets';
import { createBuilderOptions } from './createBuilderOptions';

/**
 * @param options BuilderOptions
 * @param bundlerType BundlerType
 * @returns BuilderInstance
 */
export async function generateBuilder<B extends Bundler>(
  options: BuilderOptions<B>,
  bundlerType: BundlerType,
) {
  const { normalizedConfig, appContext } = options;

  // create provider
  const builderConfig = createBuilderProviderConfig<B>(
    normalizedConfig,
    appContext,
  );

  const target = getBuilderTargets(normalizedConfig);
  const builderOptions = createBuilderOptions(target, appContext);
  const builder = await createUniBuilder({
    ...builderOptions,
    bundlerType,
    config: builderConfig,
  });

  await applyBuilderPlugins(builder, options);

  return builder;
}

async function applyBuilderPlugins<B extends Bundler>(
  builder: UniBuilderInstance,
  options: BuilderOptions<B>,
) {
  const {
    builderPluginAdapterBasic,
    builderPluginAdapterHtml,
    builderPluginAdapterSSR,
    builderPluginAdapterWorker,
  } = await import('../shared/builderPlugins');

  builder.addPlugins([
    builderPluginAdapterBasic(),
    builderPluginAdapterSSR(options),
    builderPluginAdapterHtml(options),
    builderPluginAdapterWorker(),
  ]);

  const { normalizedConfig } = options;
  if (!normalizedConfig.output.disableNodePolyfill) {
    const { pluginNodePolyfill } = await import(
      '@rsbuild/plugin-node-polyfill'
    );

    builder.addPlugins([pluginNodePolyfill()]);
  }
}
