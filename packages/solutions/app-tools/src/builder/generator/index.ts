import type {
  BuilderProvider,
  BuilderInstance,
} from '@modern-js/builder-shared';
import { createBuilder } from '@modern-js/builder';
import {
  BuilderOptions,
  ModifyBuilderConfig,
  ModifyBuilderInstance,
} from '../shared';
import { Bundler } from '../../types';
import { createBuilderProviderConfig } from './createBuilderProviderConfig';
import { getBuilderTargets } from './getBuilderTargets';
import { createBuilderOptions } from './createBuilderOptions';

export type GenerateProvider = (c: { builderConfig: any }) => BuilderProvider;

/**
 * @param options BuilderOptions
 * @param generateProvider GenerateProvider
 * @param utils - ModifyBuilderConfig, ModifyBuilderInstance
 * @returns BuilderInstance
 */
export async function generateBuilder<B extends Bundler>(
  options: BuilderOptions<B>,
  generateProvider: GenerateProvider,
  utils?: {
    modifyBuilderConfig?: ModifyBuilderConfig<B>;
    modifyBuilderInstance?: ModifyBuilderInstance;
  },
) {
  const { normalizedConfig, appContext } = options;
  const { modifyBuilderConfig, modifyBuilderInstance } = utils || {};

  // create provider
  const builderConfig = createBuilderProviderConfig<B>(
    normalizedConfig,
    appContext,
    modifyBuilderConfig,
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
  const { builderPluginAdapterModern } = await import(
    '../shared/builderPlugins/adapterModern'
  );
  builder.addPlugins([builderPluginAdapterModern(options)]);
}
