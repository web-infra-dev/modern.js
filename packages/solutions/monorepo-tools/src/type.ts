import type { hooks } from './hooks';
import type { PackageManagerType } from './parse-config';

export interface IPnpmWorkSpace {
  packages: string[];
}

export interface ICommandConfig {
  rootPath: string;
  packageManager: PackageManagerType;
}

export type MonorepoTools = {
  hooks: typeof hooks;
};
