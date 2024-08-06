import { generateBaseConfig } from './base';
import type { BabelConfig, NodePresetOptions } from './types';

export const getBabelConfigForNode = (
  options: NodePresetOptions = {},
): BabelConfig => {
  if (options.presetEnv !== false) {
    options.presetEnv ??= {};
    options.presetEnv.targets ??= ['node >= 16'];
  }

  const config = generateBaseConfig(options);

  config.plugins?.push(require.resolve('babel-plugin-dynamic-import-node'));

  return config;
};

export default function (
  api: { cache: (flag: boolean) => void },
  options: NodePresetOptions = {},
): BabelConfig {
  api.cache(true);
  return getBabelConfigForNode(options);
}
