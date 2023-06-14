import { isBeyondReact17 } from '@modern-js/utils';
import { NormalizedConfig } from '@modern-js/builder-webpack-provider';
import { PluginSwcOptions } from './types';

/**
 * Determin react runtime mode based on react version
 */
export function determinePresetReact(
  root: string,
  pluginConfig: PluginSwcOptions,
) {
  const presetReact =
    pluginConfig.presetReact || (pluginConfig.presetReact = {});

  presetReact.runtime ??= isBeyondReact17(root) ? 'automatic' : 'classic';
}

const BUILDER_SWC_DEBUG_MODE = 'BUILDER_SWC_DEBUG_MODE';
export function isDebugMode(): boolean {
  return process.env[BUILDER_SWC_DEBUG_MODE] !== undefined;
}

export function checkUseMinify(
  options: PluginSwcOptions,
  config: NormalizedConfig,
  isProd: boolean,
) {
  return (
    isProd &&
    !config.output.disableMinimize &&
    (options.jsMinify !== false || options.cssMinify !== false)
  );
}
