import type { INodePackageJson } from '@rushstack/node-core-library';

export class Package {
  json: INodePackageJson;

  configPath: string;

  rootPath: string;

  constructor(
    packageJson: INodePackageJson,
    packageConfigPath: string,
    rootPath: string,
  ) {
    this.configPath = packageConfigPath;
    this.rootPath = rootPath;
    this.json = packageJson;
  }

  get name() {
    return this.json.name;
  }

  get path() {
    return this.configPath;
  }

  get(key: keyof INodePackageJson) {
    return this.json[key];
  }
}
