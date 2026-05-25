
    export type RemoteKeys = 'asyncChunkRuntimeProvider/RemotePanel';
    type PackageType<T> = T extends 'asyncChunkRuntimeProvider/RemotePanel' ? typeof import('asyncChunkRuntimeProvider/RemotePanel') :any;