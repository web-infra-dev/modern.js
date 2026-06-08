
    export type RemoteKeys = 'garfishProvider/RemotePanel';
    type PackageType<T> = T extends 'garfishProvider/RemotePanel' ? typeof import('garfishProvider/RemotePanel') :any;