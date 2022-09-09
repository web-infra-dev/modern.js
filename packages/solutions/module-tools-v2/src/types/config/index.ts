import type { UserConfig as UserConfig_ } from '@modern-js/core';

export interface BaseBuildConfig {
  buildType: 'bundle' | 'bundleless';
}
export type BuildConfig = BaseBuildConfig | BaseBuildConfig[];

export interface DevConfig {
  name?: string;
}

export interface UserConfig {
  source: {
    alias: any;
    envVars: any;
    globalVars: any;
    designSystem: any;
  };

  buildConfig: BuildConfig;

  buildPreset:
    | string
    | ((options: { preset: Record<string, string> }) => BuildConfig);

  dev: {
    [devToolName: string]: DevConfig;
  };

  tools: {
    babel: any;
    lodash: any;
    less: any;
    postcss: any;
    sass: any;
    tailwindcss: any;
    terser: any;
    jest: any;
  };

  plugins: [];

  testing: Pick<UserConfig_, 'testing'>;
}
