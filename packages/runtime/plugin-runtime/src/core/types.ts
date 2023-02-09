import type { RouteData } from '@remix-run/router/dist/utils';
import type { LoaderResult } from './loader/loaderManager';

declare global {
  interface Window {
    _SSR_DATA?: SSRContainer;
  }
}

export interface SSRData {
  loadersData: Record<string, LoaderResult | undefined>;
  initialData?: Record<string, unknown>;
  storeState?: any;
}

export interface RouterSSRData {
  loaderData: RouteData;
  //   errors: RouteData | null;
}

export interface SSRContainer {
  data?: SSRData; // string ssr data
  routerData?: RouterSSRData; // react router ssr data
}
