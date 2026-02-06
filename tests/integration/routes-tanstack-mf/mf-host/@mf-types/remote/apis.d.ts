
    export type RemoteKeys = 'remote/Widget';
    type PackageType<T> = T extends 'remote/Widget' ? typeof import('remote/Widget') :any;