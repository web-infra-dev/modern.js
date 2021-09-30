import { PackageManagerType } from './parse-config';

export interface IPnpmWorkSpace {
  packages: string[];
}

export interface ICommandConfig {
  rootPath: string;
  packageManager: PackageManagerType;
}
