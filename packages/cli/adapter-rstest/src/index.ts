import type { ResolveModernRsbuildConfigOptions } from '@modern-js/app-tools';
import type { ExtendConfigFn } from '@rstest/core';

type AdapterInitOptions = Pick<
  ResolveModernRsbuildConfigOptions,
  'cwd' | 'configPath'
> & {
  /**
   * The environment name in `environments` field to use, will be merged with the common config.
   * Set to a string to use the environment config with matching name.
   * @default 'client'
   */
  environmentName?: string;
};

export function withModernConfig(
  options: AdapterInitOptions = {},
): ExtendConfigFn {
  return async () => {
    const { loadEnv } = await import('@rsbuild/core');
    const cwd = options.cwd || process.cwd();
    loadEnv({
      cwd,
      mode: process.env.MODERN_ENV || process.env.NODE_ENV,
      prefixes: ['MODERN_'],
    });

    const { resolveModernRsbuildConfig } = await import('@modern-js/app-tools');
    const { rsbuildConfig } = await resolveModernRsbuildConfig({
      ...options,
      command: 'rstest',
      modifyModernConfig: async config => {
        if (config.server?.rsc) {
          console.warn(
            'RSC is not fully supported in rstest environment, some features may not work as expected.\n',
          );
          config.server.rsc = false;
        }
        // remove unsupported plugins in rstest environment, such as bff plugin, which may cause errors when running rstest.
        config.plugins = config.plugins?.filter(
          plugin => plugin.name !== '@modern-js/plugin-bff',
        );

        return config;
      },
    }).catch((error: unknown) => {
      if (error instanceof Error) {
        error.message = `Error loading Modern.js config${options.cwd ? ` in ${options.cwd}` : ''}: ${error.message}`;
      }
      throw error;
    });

    const { toRstestConfig } = await import('@rstest/adapter-rsbuild');

    const rstestExtendConfig = toRstestConfig({
      rsbuildConfig,
      environmentName: options.environmentName || 'client',
    });

    return rstestExtendConfig;
  };
}
