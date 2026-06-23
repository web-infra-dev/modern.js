
    export type RemoteKeys = 'nestedRouterTreeProvider/RemotePanel';
    type PackageType<T> = T extends 'nestedRouterTreeProvider/RemotePanel' ? typeof import('nestedRouterTreeProvider/RemotePanel') :any;