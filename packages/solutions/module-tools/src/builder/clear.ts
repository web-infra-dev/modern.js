import type { BaseBuildConfig } from '../types';

export const clearDtsTemp = async () => {
  const { fs } = await import('@modern-js/utils');
  const { dtsTempDirectory } = await import('../constants/dts');
  await fs.remove(dtsTempDirectory);
};

export const clearBuildConfigPaths = async (
  configs: BaseBuildConfig[],
  noClear: boolean,
) => {
  const { fs } = await import('@modern-js/utils');

  if (noClear) {
    return;
  }

  for (const config of configs) {
    await fs.remove(config.outDir);
  }
};
