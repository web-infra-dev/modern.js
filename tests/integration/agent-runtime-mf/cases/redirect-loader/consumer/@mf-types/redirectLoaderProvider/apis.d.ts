
    export type RemoteKeys = 'redirectLoaderProvider/RemotePanel';
    type PackageType<T> = T extends 'redirectLoaderProvider/RemotePanel' ? typeof import('redirectLoaderProvider/RemotePanel') :any;