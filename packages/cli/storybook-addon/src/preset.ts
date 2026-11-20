import { resolveModernRsbuildConfig } from '@modern-js/app-tools';
import { type RsbuildConfig, mergeRsbuildConfig } from '@rsbuild/core';
import { stripInheritedConfig } from 'storybook-builder-rsbuild';
import type { AddonOptions } from './index';

export async function rsbuildFinal(
  config: RsbuildConfig,
  { configPath }: AddonOptions,
): Promise<RsbuildConfig> {
  const { rsbuildConfig } = await resolveModernRsbuildConfig({
    command: 'storybook',
    configPath,
  });
  const { environments, ...shared } = rsbuildConfig;
  const inherited = mergeRsbuildConfig(shared, environments?.client ?? {});
  stripInheritedConfig(inherited, 'the loaded Modern.js config');
  return mergeRsbuildConfig(config, inherited);
}
