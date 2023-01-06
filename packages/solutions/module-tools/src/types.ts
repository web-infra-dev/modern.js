import type { ImportStyleType } from '@modern-js/babel-preset-module';
import type { CLIConfig as SpeedyConfig } from '@speedy-js/speedy-core';
import type { LoggerText } from './features/build/logger/logText';
import type { Platform } from './features/build/build-platform';
import type {
  BuildPreset,
  BuildConfig,
  PackageModeType,
  PackageFields,
} from './schema/types';

export type { UserConfig } from '@modern-js/core';
export type { Platform } from './features/build/build-platform';
export type { ITsconfig } from './utils/tsconfig';

export interface ITaskMapper {
  logger: LoggerText | null;
  taskPath: string;
  params?: string[];
}

export interface IBuildFeatOption {
  platform: boolean | Exclude<Platform, 'all'>;
  enableDtsGen: boolean;
  enableWatchMode?: boolean;
  isTsProject: boolean;
  tsconfigName: string;
  clear?: boolean;
  styleOnly?: boolean;
  outputPath: string;
  legacyTsc: boolean;
}

export interface IPackageModeValue {
  type: 'module' | 'commonjs';
  syntax: 'es5' | 'es6+';
  outDir: 'node' | 'treeshaking' | 'modern';
  copyDirs?: ('node' | 'treeshaking' | 'modern')[];
}

type ToolsSpeedyConfig =
  | SpeedyConfig
  | ((config: SpeedyConfig) => SpeedyConfig);

declare module '@modern-js/core' {
  interface OutputConfig {
    /** @deprecated Use the `buildConfig.bundlelessOptions.static.path` instead . */
    assetsPath?: string;
    /** @deprecated Use the `buildConfig.sourceMap` instead */
    disableSourceMap?: boolean;
    buildPreset?: BuildPreset;
    buildConfig?: BuildConfig;
    importStyle?: ImportStyleType;
    packageMode?: PackageModeType;
    packageFields?: PackageFields;
  }
  interface ToolsConfig {
    speedy?: ToolsSpeedyConfig;
  }
  interface NormalizedToolsConfig {
    speedy: ToolsSpeedyConfig | Array<NonNullable<ToolsSpeedyConfig>>;
  }
  interface SourceConfig {
    jsxTransformRuntime?: 'automatic' | 'classic';
  }
}
