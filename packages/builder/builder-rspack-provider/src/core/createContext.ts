import { join } from 'path';
import {
  isFileExists,
  createContextByConfig,
  type CreateBuilderOptions,
  NormalizedSharedOutputConfig,
} from '@modern-js/builder-shared';
import { initHooks } from './initHooks';
import { validateBuilderConfig } from '../config/validate';
import { withDefaultConfig } from '../config/defaults';
import type { Context, BuilderConfig } from '../types';

/**
 * Generate the actual context used in the build,
 * which can have a lot of overhead and take some side effects.
 */
export async function createContext(
  options: Required<CreateBuilderOptions>,
  userBuilderConfig: BuilderConfig,
): Promise<Context> {
  const builderConfig = withDefaultConfig(userBuilderConfig);
  const context = createContextByConfig(
    options,
    builderConfig.output as NormalizedSharedOutputConfig,
    'rspack',
  );
  const configValidatingTask = Promise.resolve();

  await validateBuilderConfig(builderConfig);

  const tsconfigPath = join(context.rootPath, 'tsconfig.json');

  return {
    ...context,
    hooks: initHooks(),
    configValidatingTask,
    config: { ...builderConfig },
    originalConfig: userBuilderConfig,
    tsconfigPath: (await isFileExists(tsconfigPath)) ? tsconfigPath : undefined,
  };
}
