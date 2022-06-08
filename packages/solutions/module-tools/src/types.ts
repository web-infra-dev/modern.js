import type { ImportStyleType } from '@modern-js/babel-preset-module';
import type { LoggerText } from './features/build/logger/logText';
import type { Platform } from './features/build/build-platform';
import type {
  BuildPreset,
  PackageModeType,
  PackageFields,
} from './schema/types';

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
  sourceDir: string;
  tsconfigName: string;
  clear?: boolean;
  styleOnly?: boolean;
  outputPath: string;
}

export interface IPackageModeValue {
  type: 'module' | 'commonjs';
  syntax: 'es5' | 'es6+';
  outDir: 'node' | 'treeshaking' | 'modern';
  copyDirs?: ('node' | 'treeshaking' | 'modern')[];
}

declare module '@modern-js/core' {
  interface OutputConfig {
    assetsPath?: string;
    buildPreset?: BuildPreset;
    enableSourceMap?: boolean;
    importStyle?: ImportStyleType;
    packageMode?: PackageModeType;
    packageFields?: PackageFields;
  }
  interface SourceConfig {
    jsxTransformRuntime?: 'automatic' | 'classic';
  }
}
