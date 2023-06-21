import type {
  BuilderProvider,
  BuilderInstance,
} from '@modern-js/builder-shared';
import { createBuilder } from '@modern-js/builder';
import { BuilderOptions, ModifyBuilderInstance } from '../shared';
import { Bundler } from '../../types';
import { createBuilderProviderConfig } from './createBuilderProviderConfig';
import { getBuilderTargets } from './getBuilderTargets';
import { createBuilderOptions } from './createBuilderOptions';

export type GenerateProvider = (c: { builderConfig: any }) => BuilderProvider;

/**
 * @param options BuilderOptions
 * @param generateProvider GenerateProvider
 * @param utils - ModifyBuilderInstance
 * @returns BuilderInstance
 */
export async function generateBuilder<B extends Bundler>(
  options: BuilderOptions<B>,
  generateProvider: GenerateProvider,
  utils?: {
    modifyBuilderInstance?: ModifyBuilderInstance;
  },
) {
  const { normalizedConfig, appContext } = options;
  const { modifyBuilderInstance } = utils || {};

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

  await modifyBuilderInstance?.(builder);

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

  builder.addPlugins([
    builderPluginAdapterBasic(),
    builderPluginAdapterSSR(options),
    builderPluginAdapterHtml(options),
  ]);

  const { normalizedConfig } = options;
  if (!normalizedConfig.output.disableNodePolyfill) {
    const { builderPluginNodePolyfill } = await import(
      '@modern-js/builder-plugin-node-polyfill'
    );
    builder.addPlugins([builderPluginNodePolyfill()]);
  }
}
