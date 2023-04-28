import { useRouteLoaderData as useRouteData } from 'react-router-dom';
import { routerPlugin } from './plugin';
import type { SingleRouteConfig, RouterConfig } from './types';

export type { SingleRouteConfig, RouterConfig };

export default routerPlugin;

export { modifyRoutes } from './plugin';

export * from './withRouter';

export { Link, NavLink } from './PrefetchLink';
export type { LinkProps, NavLinkProps } from './PrefetchLink';

export const useRouteLoaderData: typeof useRouteData = (routeId: string) => {
  const realRouteId = routeId.replace(/\((.*?)\)/g, '[$1]');
  return useRouteData(realRouteId);
};

// Note: Keep in sync with react-router-dom exports!
export type {
  // below are react-router-dom exports
  FormEncType,
  FormMethod,
  GetScrollRestorationKeyFunction,
  ParamKeyValuePair,
  SubmitOptions,
  URLSearchParamsInit,
  FetcherWithComponents,
  BrowserRouterProps,
  HashRouterProps,
  HistoryRouterProps,
  FormProps,
  ScrollRestorationProps,
  SubmitFunction,

  // below are react-router exports
  ActionFunction,
  ActionFunctionArgs,
  AwaitProps,
  unstable_Blocker,
  unstable_BlockerFunction,
  DataRouteMatch,
  DataRouteObject,
  Fetcher,
  Hash,
  IndexRouteObject,
  IndexRouteProps,
  JsonFunction,
  LayoutRouteProps,
  LoaderFunction,
  LoaderFunctionArgs,
  Location,
  MemoryRouterProps,
  NavigateFunction,
  NavigateOptions,
  NavigateProps,
  Navigation,
  Navigator,
  NonIndexRouteObject,
  OutletProps,
  Params,
  ParamParseKey,
  Path,
  PathMatch,
  Pathname,
  PathPattern,
  PathRouteProps,
  RedirectFunction,
  RelativeRoutingType,
  RouteMatch,
  RouteObject,
  RouteProps,
  RouterProps,
  RouterProviderProps,
  RoutesProps,
  Search,
  ShouldRevalidateFunction,
  To,
} from 'react-router-dom';

// Note: Keep in sync with react-router-dom exports!
export {
  // Routers
  createBrowserRouter,
  createHashRouter,
  createMemoryRouter,
  RouterProvider,

  // Router Components
  BrowserRouter,
  HashRouter,
  MemoryRouter,
  Router,

  // Components
  Await,
  Form,
  Navigate,
  Outlet,
  Route,
  Routes,
  ScrollRestoration,

  // Hooks
  useActionData,
  useAsyncError,
  useAsyncValue,
  useBeforeUnload,
  useFetcher,
  useFetchers,
  useFormAction,
  useHref,
  useInRouterContext,
  useLinkClickHandler,
  useLoaderData,
  useLocation,
  useMatch,
  useMatches,
  useNavigate,
  useNavigation,
  useNavigationType,
  useOutlet,
  useOutletContext,
  useParams,
  useResolvedPath,
  useRevalidator,
  useRouteError,
  useRoutes,
  useSearchParams,
  useSubmit,

  // Utilities
  createRoutesFromChildren,
  createRoutesFromElements,
  createSearchParams,
  generatePath,
  isRouteErrorResponse,
  matchPath,
  matchRoutes,
  renderMatches,
  resolvePath,
  createPath,
  unstable_useBlocker,
  unstable_usePrompt,
} from 'react-router-dom';

// `react-router-dom` has its own dependency: `@remix-run/router`.
// In order to make sure `plugin-data-loader` and user's loaders(mainly `defer` API) depend on the singleton of `@remix-run/router`,
// we export these API from the same package `@modern-js/utils/universal/remix-router`.
export { defer, json, redirect } from '@modern-js/utils/universal/remix-router';
