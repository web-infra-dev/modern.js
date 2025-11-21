
    export type RemoteKeys = 'componentRemote/Text';
    type PackageType<T> = T extends 'componentRemote/Text' ? typeof import('componentRemote/Text') :any;