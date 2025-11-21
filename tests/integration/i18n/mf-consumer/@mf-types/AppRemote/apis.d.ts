
    export type RemoteKeys = 'AppRemote/export-app';
    type PackageType<T> = T extends 'AppRemote/export-app' ? typeof import('AppRemote/export-app') :any;