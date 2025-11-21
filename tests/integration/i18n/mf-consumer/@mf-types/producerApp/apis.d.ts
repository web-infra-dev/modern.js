
    export type RemoteKeys = 'producerApp/export-app';
    type PackageType<T> = T extends 'producerApp/export-app' ? typeof import('producerApp/export-app') :any;