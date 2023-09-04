import { Entrypoint } from '@modern-js/types/cli';
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
