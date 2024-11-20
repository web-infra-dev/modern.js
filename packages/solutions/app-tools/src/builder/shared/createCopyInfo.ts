import path from 'path';
import type { AppToolsContext } from '../../new/types';
import type { AppNormalizedConfig } from '../../types';

export function createCopyInfo(
  appContext: AppToolsContext<'shared'>,
  config: AppNormalizedConfig<'shared'>,
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
