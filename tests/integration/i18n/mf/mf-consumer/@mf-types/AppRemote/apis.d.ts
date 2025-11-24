
    export type RemoteKeys = 'AppRemote/export-app' | 'AppRemote/export-app-custom';
    type PackageType<T> = T extends 'AppRemote/export-app-custom' ? typeof import('AppRemote/export-app-custom') :T extends 'AppRemote/export-app' ? typeof import('AppRemote/export-app') :any;