import path from 'path';
import type { AppNormalizedConfig } from '../../types';
import type { AppToolsContext } from '../../types/new';

export function createCopyInfo(
  appContext: AppToolsContext,
  config: AppNormalizedConfig,
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
