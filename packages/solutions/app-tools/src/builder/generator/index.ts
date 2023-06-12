import type {
  BuilderProvider,
  BuilderInstance,
} from '@modern-js/builder-shared';
import { createBuilder } from '@modern-js/builder';
import { BuilderOptions } from '../shared';
import { Bundler } from '../../types';
import { createBuilderProviderConfig } from './createBuilderProviderConfig';
import { getBuilderTargets } from './getBuilderTargets';
import { createBuilderOptions } from './createBuilderOptions';

export type GenerateProvider = (c: { builderConfig: any }) => BuilderProvider;

/**
 * @param options BuilderOptions
 * @param generateProvider GenerateProvider
 * @returns BuilderInstance
 */
export async function generateBuilder<B extends Bundler>(
  options: BuilderOptions<B>,
  generateProvider: GenerateProvider,
) {
  const { normalizedConfig, appContext } = options;

  // create provider
  const builderConfig = createBuilderProviderConfig<B>(
    normalizedConfig,
    appContext,
  );

  const provider = generateProvider({
    builderConfig,
  });

  const target = getBuilderTargets(normalizedConfig);
  const builderOptions = createBuilderOptions(target, appContext);
  const builder = await createBuilder(provider, builderOptions);

  await applyBuilderPlugins(builder, options);

  return builder;
}

async function applyBuilderPlugins<B extends Bundler>(
  builder: BuilderInstance,
  options: BuilderOptions<B>,
) {
  const {
    builderPluginAdapterBasic,
    builderPluginAdapterHtml,
    builderPluginAdapterSSR,
  } = await import('../shared/builderPlugins');
  const { builderPluginSourceBuild } = await import(
    '@modern-js/builder-plugin-source-build'
  );

  builder.addPlugins([
    builderPluginAdapterBasic(),
    builderPluginAdapterSSR(options),
    builderPluginAdapterHtml(options),
    builderPluginSourceBuild({
      sourceField: 'source',
      projectName: options.appContext.packageName,
    }),
  ]);

  const { normalizedConfig } = options;
  if (!normalizedConfig.output.disableNodePolyfill) {
    const { builderPluginNodePolyfill } = await import(
      '@modern-js/builder-plugin-node-polyfill'
    );
    builder.addPlugins([builderPluginNodePolyfill()]);
  }
}
