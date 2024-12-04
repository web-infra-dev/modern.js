import path from 'path';
import type { AppNormalizedConfig, Bundler } from '../../types';
import type { AppToolsContext } from '../../types/new';

export function createCopyInfo<B extends Bundler>(
  appContext: AppToolsContext<B>,
  config: AppNormalizedConfig<B>,
) {
  const configDir = path.resolve(
    appContext.appDirectory,
    config.source.configDir || './config',
  );
  const uploadDir = path.posix.join(configDir.replace(/\\/g, '/'), 'upload');
  const publicDir = path.posix.join(configDir.replace(/\\/g, '/'), 'public');

  return {
    configDir,
    uploadDir,
    publicDir,
  };
}
