import {
  applyDefaultBuilderOptions,
  BuilderOptions,
} from '@modern-js/builder-shared';

export function createBuilder<P>(provider: P, options: BuilderOptions) {
  const builderOptions = applyDefaultBuilderOptions(options);
  return provider.createBuilder();
}
