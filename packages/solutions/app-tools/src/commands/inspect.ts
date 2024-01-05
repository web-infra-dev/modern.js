import { join } from 'path';
import type { RsbuildMode } from '@rsbuild/shared';
import type { PluginAPI } from '@modern-js/core';
import type { InspectOptions } from '../utils/types';
import type { AppTools } from '../types';

export const inspect = async (
  api: PluginAPI<AppTools<'shared'>>,
  options: InspectOptions,
) => {
  const appContext = api.useAppContext();
  if (!appContext.builder) {
    throw new Error(
      'Expect the Builder to have been initialized, But the appContext.builder received `undefined`',
    );
  }
  return appContext.builder.inspectConfig({
    env: options.env as RsbuildMode,
    verbose: options.verbose,
    outputPath: join(appContext?.builder.context.distPath, options.output),
    writeToDisk: true,
  });
};
