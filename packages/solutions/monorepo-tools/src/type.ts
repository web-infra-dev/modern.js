import { PackageManagerType } from './parse-config';
import { hooks } from './hooks';

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
