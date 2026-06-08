
    export type RemoteKeys = 'useNavigateBlankProvider/export-app';
    type PackageType<T> = T extends 'useNavigateBlankProvider/export-app' ? typeof import('useNavigateBlankProvider/export-app') :any;