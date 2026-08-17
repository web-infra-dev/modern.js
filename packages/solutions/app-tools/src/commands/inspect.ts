import type { CLIPluginAPI } from '@modern-js/plugin';
import type { RsbuildMode } from '@rsbuild/core';
import type { AppTools } from '../types';
import { releaseCommandLock } from '../utils/devLock';
import type { InspectOptions } from '../utils/types';

export const inspect = async (
  api: CLIPluginAPI<AppTools>,
  options: InspectOptions,
) => {
  const appContext = api.getAppContext();
  try {
    if (!appContext.builder) {
      throw new Error(
        'Expect the Builder to have been initialized, But the appContext.builder received `undefined`',
      );
    }
    const metaName =
      appContext.metaName === 'modern-js' ? 'modern.js' : appContext.metaName;

    return await appContext.builder.inspectConfig({
      mode: options.env as RsbuildMode,
      verbose: options.verbose,
      outputPath: options.output,
      writeToDisk: true,
      extraConfigs: {
        [metaName]: api.getNormalizedConfig(),
      },
    });
  } finally {
    // inspect empties internalDirectory on startup, so it holds a short
    // exclusive lock taken in `onPrepare`.
    releaseCommandLock(appContext.appDirectory, appContext.metaName, 'inspect');
  }
};
