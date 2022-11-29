import { join } from 'path';
import type { BuilderMode } from '@modern-js/builder-shared';
import type { PluginAPI } from '@modern-js/core';
import type { InspectOptions } from '../utils/types';
import type { AppTools } from '../types';

export const inspect = async (
  api: PluginAPI<AppTools>,
  options: InspectOptions,
) => {
  const appContext = api.useAppContext();
  if (!appContext.builder) {
    throw new Error(
      'Expect the Builder to have been initialized, But the appContext.builder received `undefined`',
    );
  }
  return appContext.builder.inspectConfig({
    env: options.env as BuilderMode,
    verbose: options.verbose,
    outputPath: join(appContext?.builder.context.distPath, options.output),
    writeToDisk: true,
  });
};
