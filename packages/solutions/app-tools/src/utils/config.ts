import * as path from 'path';
import type { ServerConfig } from '@modern-js/server-core';
import {
  fs,
  CONFIG_FILE_EXTENSIONS,
  OUTPUT_CONFIG_FILE,
  ensureAbsolutePath,
  getServerConfig,
} from '@modern-js/utils';
import { stringify } from 'flatted';
import type { AppNormalizedConfig } from '../types';

export const emitResolvedConfig = async (
  appDirectory: string,
  resolvedConfig: AppNormalizedConfig,
) => {
  const outputPath = ensureAbsolutePath(
    appDirectory,
    path.join(
      resolvedConfig.output.distPath?.root || './dist',
      OUTPUT_CONFIG_FILE,
    ),
  );

  const output: string = stringify(resolvedConfig);

  await fs.writeFile(outputPath, output, {
    encoding: 'utf-8',
  });
};
