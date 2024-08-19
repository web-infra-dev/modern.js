import type { PackageManagerType } from './parse-config';
import type { hooks } from './hooks';

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
