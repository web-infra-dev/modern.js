
    export type RemoteKeys = 'reactMultiVersionProvider/RemotePanel';
    type PackageType<T> = T extends 'reactMultiVersionProvider/RemotePanel' ? typeof import('reactMultiVersionProvider/RemotePanel') :any;