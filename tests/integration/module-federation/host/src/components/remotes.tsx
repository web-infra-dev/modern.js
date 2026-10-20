import {
  getInstance,
  loadRemote,
  registerRemotes,
} from '@module-federation/modern-js-v3/runtime';
import { lazyLoadComponentPlugin } from '@module-federation/modern-js-v3/react';
async function requiredRemote<T>(id: string): Promise<T> {
  const module = await loadRemote<T>(id);
  if (!module) throw new Error(`Remote ${id} returned no module`);
  return module;
}
getInstance()!.registerPlugins([lazyLoadComponentPlugin()]);
registerRemotes([
  {
    name: 'dynamicNested',
    entry: `${process.env.MF_LAB_NESTED}/static/mf-manifest.json`,
  },
  { name: 'dynamic', entry: `${process.env.MF_LAB_LIBRARY}/mf-manifest.json` },
]);
const loading = (
  <p className="loading" role="status">
    Connecting to the remote…
  </p>
);
const fallback = ({ error }: { error: unknown }) => (
  <p role="alert">
    Remote unavailable: {error instanceof Error ? error.message : String(error)}
  </p>
);
export const DynamicSignal = getInstance()!.createLazyComponent({
  loader: () =>
    requiredRemote<{ default: (props: { id?: string }) => React.JSX.Element }>(
      'dynamic/Signal',
    ),
  loading,
  fallback,
});
export const DynamicNested = getInstance()!.createLazyComponent({
  loader: () =>
    requiredRemote<{ default: () => React.JSX.Element }>(
      'dynamicNested/DynamicRelay',
    ),
  loading,
  fallback,
});
export const Forecast = getInstance()!.createLazyComponent({
  loader: () => import('provider/Forecast'),
  loading,
  fallback,
});
export const ClientForecast = getInstance()!.createLazyComponent({
  noSSR: true,
  loader: () => import('library/Forecast'),
  loading,
  fallback,
});
export const ClientRecovery = getInstance()!.createLazyComponent({
  loader: () => import('provider/ClientRecovery'),
  loading,
  fallback,
});
export const ServerRecovery = getInstance()!.createLazyComponent({
  loader: () => import('provider/ServerRecovery'),
  loading,
  fallback,
});
export const NoData = getInstance()!.createLazyComponent({
  noSSR: true,
  loader: () => {
    if (typeof window !== 'undefined') {
      const target = window as typeof window & { noDataLoads?: number };
      target.noDataLoads = (target.noDataLoads || 0) + 1;
    }
    return import('library/NoData');
  },
  loading,
  fallback,
});
export const Reload = getInstance()!.createLazyComponent({
  noSSR: true,
  loader: () =>
    requiredRemote<{
      default: (props: {
        mfData?: { requestCount: number };
      }) => React.JSX.Element;
    }>('library/Reload'),
  loading,
  fallback,
});
