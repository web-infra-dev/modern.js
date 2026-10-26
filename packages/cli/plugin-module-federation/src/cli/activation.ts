import fs from 'node:fs';
import path from 'node:path';
import type { ModuleFederationConfig, PluginOptions } from '../types';

export const LEGACY_PLUGINS = [
  '@modern-js/plugin-module-federation',
  '@modern-js/plugin-module-federation-config',
  '@modern-js/plugin-module-federation-ssr',
];

export function resolveActivation(
  value: ModuleFederationConfig | undefined,
  appDirectory: string,
  isPluginExists: (name: string) => boolean,
): { enabled: boolean; config: PluginOptions; watchPath: string } {
  const config = value && typeof value === 'object' ? { ...value } : {};
  const watchPath = path.resolve(
    appDirectory,
    config.configPath || 'module-federation.config.ts',
  );
  const enabled =
    value !== false && (value !== undefined || fs.existsSync(watchPath));
  if (!enabled) return { enabled, config, watchPath };
  const legacy = LEGACY_PLUGINS.find(isPluginExists);
  if (legacy) {
    throw new Error(
      `[Modern.js Module Federation] Built-in Module Federation and the legacy plugin (${legacy}) cannot be enabled together. Remove the legacy plugin, or set moduleFederation: false to continue using it.`,
    );
  }
  if (!config.config && !fs.existsSync(watchPath)) {
    throw new Error(
      `[Modern.js Module Federation] Configuration file not found: ${watchPath}`,
    );
  }
  if (!config.config) config.configPath = watchPath;
  return { enabled, config, watchPath };
}
