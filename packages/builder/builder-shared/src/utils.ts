import { BuilderOptions } from './types';

export function applyDefaultBuilderOptions(options?: BuilderOptions) {
  return {
    cwd: process.cwd(),
    entry: {},
    target: ['web'],
    configPath: null,
    framework: 'modern-js',
    ...options,
  } as Required<BuilderOptions>;
}
