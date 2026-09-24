import type {
  RouteObject,
  createMemoryRouter,
} from '@modern-js/runtime-utils/router';
import type { RouterSSRData } from '../core/types';

/** Serializable state for one independently rendered Modern application. */
export interface ApplicationSnapshot {
  protocol: 'modern-application/1';
  reactVersion: string;
  identifierPrefix: string;
  url: string;
  basename: string;
  props: Record<string, unknown>;
  initialData?: Record<string, unknown>;
  routerData?: RouterSSRData;
}

export interface ApplicationOptions {
  url: string;
  basename?: string;
  identifierPrefix?: string;
  props?: Record<string, unknown>;
  signal?: AbortSignal;
  onRecoverableError?: (error: unknown) => void;
}

/** Internal instance state, intentionally never stored on window. */
export interface ApplicationRuntime {
  url: string;
  props?: Record<string, unknown>;
  hydrationData?: RouterSSRData;
  routes?: RouteObject[];
  router?: ReturnType<typeof createMemoryRouter>;
}
