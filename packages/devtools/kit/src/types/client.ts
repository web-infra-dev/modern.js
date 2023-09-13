/* eslint-disable max-classes-per-file */
import { Entrypoint } from '@modern-js/types/cli';
import logo from './logo';
import { FileSystemRoutes } from './server';

export interface ClientFunctions {
  refresh: () => void;
  updateFileSystemRoutes: (param: {
    entrypoint: Entrypoint;
    routes: FileSystemRoutes;
  }) => void;
}

export class NameDefinition {
  formalName: string = 'Modern.js';

  casualName: string = 'modern.js';

  prefixName: string = '_modern_js';
}

export interface ShortenAlias {
  replace: string | RegExp;
  to: string;
}

export class PackageDefinition {
  appTools: string = '@modern-js/app-tools';
}

export class AssetDefinition {
  logo: string = logo;
}

export class ClientDefinition {
  name: NameDefinition = new NameDefinition();

  packages: PackageDefinition = new PackageDefinition();

  assets: AssetDefinition = new AssetDefinition();
}
