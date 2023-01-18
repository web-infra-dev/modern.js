import { BuilderProvider } from '@modern-js/builder-shared';
import { createBuilder } from '@modern-js/builder';
import {
  BuilderOptions,
  ModifyBuilderConfig,
  ModifyBuilderInstance,
} from '../shared';
import { createBuilderProviderConfig } from './createBuilderProviderConfig';
import { getBuilderTargets } from './getBuilderTargets';
import { createBuilderOptions } from './createBuilderOptions';
import { Bundler } from '@/types';

export type GenerateProvider = (o: { builderConfig: any }) => BuilderProvider;

export async function generateBuilder<B extends Bundler>(
  options: BuilderOptions<B>,
  generateProvider: GenerateProvider,
  utils: {
    modifyBuilderConfig?: ModifyBuilderConfig<B>;
    modifyBuilderInstance?: ModifyBuilderInstance;
  },
) {
  const { normalizedConfig, appContext } = options;
  const { modifyBuilderConfig, modifyBuilderInstance } = utils;
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

  await modifyBuilderInstance?.(builder);

  return builder;
}
