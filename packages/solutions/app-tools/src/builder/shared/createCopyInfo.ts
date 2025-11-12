import path from 'path';
import { resolvePublicDirPaths } from '@modern-js/server-core';
import type { AppNormalizedConfig } from '../../types';
import type { AppToolsContext } from '../../types/plugin';

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

  // Handle custom publicDir: string | string[]
  // Resolve custom public dirs to absolute paths
  const customPublicDirPaths = resolvePublicDirPaths(
    config.server?.publicDir,
    appContext.appDirectory,
  );

  return {
    configDir,
    uploadDir,
    publicDir,
    customPublicDirs: customPublicDirPaths,
  };
}
