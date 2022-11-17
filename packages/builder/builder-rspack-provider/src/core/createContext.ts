import {
  deepFreezed,
  createCommonContext,
  type CreateBuilderOptions,
  NormalizedSharedOutputConfig,
} from '@modern-js/builder-shared';
import { initHooks } from './initHooks';
// import { ConfigValidator } from '../config/validate';
import { withDefaultConfig } from '../config/defaults';
import type { Context, BuilderConfig } from '../types';

/**
 * Generate the actual context used in the build,
 * which can have a lot of overhead and take some side effects.
 */
export function createContext(
  options: Required<CreateBuilderOptions>,
  userBuilderConfig: BuilderConfig,
): Context {
  const builderConfig = withDefaultConfig(userBuilderConfig);
  const context = createCommonContext(
    options,
    builderConfig.output as NormalizedSharedOutputConfig,
  );
  const configValidatingTask = Promise.resolve();
  // TODO: validator
  // const configValidatingTask =  ConfigValidator.create().then(validator => {
  //   // interrupt build if config is invalid.
  //   validator.validate(builderConfig, false);
  // });

  return {
    ...context,
    hooks: initHooks(),
    configValidatingTask,
    config: { ...builderConfig },
    originalConfig: deepFreezed(userBuilderConfig),
  };
}
