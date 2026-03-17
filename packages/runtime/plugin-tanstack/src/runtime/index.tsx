export * from '@tanstack/react-router';
export { useMatch } from '@tanstack/react-router';
export { Link, NavLink } from './prefetchLink';
export {
  Form,
  RouteActionResponseError,
  useFetcher,
} from './dataMutation';
export { tanstackRouterPlugin } from './plugin';
export type {
  LinkProps,
  NavLinkProps,
  PrefetchBehavior,
} from './prefetchLink';
export type {
  Fetcher,
  FetcherState,
  FetcherSubmitOptions,
  FormProps,
  SubmitOptions,
} from './dataMutation';
export type {
  TanstackRouterExtendsHooks,
} from './hooks';
export type { TanstackRouterRuntimeConfig } from './plugin';
