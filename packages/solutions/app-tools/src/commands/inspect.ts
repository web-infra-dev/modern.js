import { isUseSSRBundle } from '@modern-js/utils';
import type { BuilderTarget } from '@modern-js/builder-shared';
import type { PluginAPI } from '@modern-js/core';
import type { InspectOptions } from '../utils/types';
import createBuilder from '../builder';

export const inspect = async (api: PluginAPI, options: InspectOptions) => {
  const resolvedConfig = api.useResolvedConfigContext();
  const appContext = api.useAppContext();

  const targets: BuilderTarget[] = ['web'];
  if (resolvedConfig.output.enableModernMode) {
    targets.push('modern-web');
  }
  if (isUseSSRBundle(resolvedConfig)) {
    targets.push('node');
  }
  const builder = await createBuilder({
    target: targets,
    appContext,
    normalizedConfig: resolvedConfig,
  });

  const env: any = options.env || process.env.NODE_ENV;
  return builder.inspectConfig({
    env,
    verbose: options.verbose,
    outputPath: options.output,
    writeToDisk: true,
  });
};
