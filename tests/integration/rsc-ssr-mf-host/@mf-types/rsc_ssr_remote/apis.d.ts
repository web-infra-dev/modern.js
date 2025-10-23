export type RemoteKeys =
  | 'rsc_ssr_remote/Counter'
  | 'rsc_ssr_remote/DynamicMessage';
type PackageType<T> = T extends 'rsc_ssr_remote/DynamicMessage'
  ? typeof import('rsc_ssr_remote/DynamicMessage')
  : T extends 'rsc_ssr_remote/Counter'
    ? typeof import('rsc_ssr_remote/Counter')
    : any;
