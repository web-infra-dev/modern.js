
    export type RemoteKeys = 'remote/Text';
    type PackageType<T> = T extends 'remote/Text' ? typeof import('remote/Text') :any;