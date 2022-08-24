import { RouterConfig } from './plugins/router';
import { RenderLevel, SSRServerContext } from './plugins/ssr/serverRender/type';
import { StateConfig } from './plugins/state';
import { LoaderResult } from './runtime/loader/loaderManager';

export const isBrowser = () =>
  typeof window !== 'undefined' && window.name !== 'nodejs';

export interface AppConfig {
  router?: RouterConfig | boolean;
  state?: StateConfig | boolean;
  [key: string]: any;
}

export interface SSRData {
  loadersData: Record<string, LoaderResult | undefined>;
  initialData?: Record<string, unknown>;
  storeState: any;
}

export interface SSRContainer {
  data?: SSRData;
  renderLevel: RenderLevel;
  context?: SSRServerContext;
}
