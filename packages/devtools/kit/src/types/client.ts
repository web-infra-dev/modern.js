import { Entrypoint } from '@modern-js/types/cli';
import { FileSystemRoutes } from './server';

export interface ClientFunctions {
  refresh: () => void;
  updateFileSystemRoutes: (param: {
    entrypoint: Entrypoint;
    routes: FileSystemRoutes;
  }) => void;
}
