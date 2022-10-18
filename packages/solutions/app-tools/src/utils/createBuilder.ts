import { BuilderTarget, createBuilder } from '@modern-js/builder';
import {
  BuilderConfig,
  builderWebpackProvider,
} from '@modern-js/builder-webpack-provider';
import type { IAppContext, NormalizedConfig } from '@modern-js/core';

export default async ({
  target = 'web',
  normalizedConfig,
  appContext,
}: {
  target?: BuilderTarget | BuilderTarget[];
  normalizedConfig: NormalizedConfig;
  appContext: IAppContext;
}) => {
  const builderConfig = createBuilderProviderConfig(
    target,
    normalizedConfig,
    appContext,
  );
  const provider = builderWebpackProvider({ builderConfig });

  const builderOptions = {
    target,
    configPath: '',
  };
  return createBuilder(provider, builderOptions);
};

function createBuilderProviderConfig(
  _target: BuilderTarget | BuilderTarget[],
  _normalizedConfig: NormalizedConfig,
  _appContext: IAppContext,
): BuilderConfig {
  // TODO: return builderConfig
  return {};
}
