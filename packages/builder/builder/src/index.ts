import type { BuilderOptions } from '@modern-js/builder-shared';

function applyDefaultOptions(options?: BuilderOptions) {
  return {
    cwd: process.cwd(),
    entry: {},
    target: ['web'],
    configPath: null,
    framework: 'modern-js',
    ...options,
  } as Required<BuilderOptions>;
}

export function createBuilder<P>(provider: P, options: BuilderOptions) {
  const builderOptions = applyDefaultOptions(options);
  return provider.createBuilder()
}
