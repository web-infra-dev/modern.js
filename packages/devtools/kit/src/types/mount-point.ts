export interface MountPointFunctions {
  getLocation: () => string;
}

export class SetupClientOptions {
  endpoint: string = 'https://modernjs.dev/devtools';

  version: string;

  dataSource: string = '/_modern_js/devtools/rpc';

  constructor() {
    const pkgVersion = require('@modern-js/devtools-kit/package.json').version;
    this.version = pkgVersion;
  }
}
