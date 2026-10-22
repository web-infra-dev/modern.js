import { labComponent } from '../failure/components';
import {
  getInstance,
  loadRemote,
  registerRemotes,
} from '@module-federation/enhanced/runtime';
import { lazyLoadComponentPlugin } from '@module-federation/bridge-react';
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
export const DynamicSignal = labComponent(
  {
    loader: () =>
      requiredRemote<{
        default: (props: { id?: string }) => React.JSX.Element;
      }>('dynamic/Signal'),
    loading,
    fallback,
  },
  'dynamic/Signal',
);
export const DynamicForecast = labComponent(
  {
    loader: () =>
      requiredRemote<{
        default: (props: { id?: string }) => React.JSX.Element;
      }>('dynamic/Forecast'),
    loading,
    fallback,
  },
  'dynamic/Forecast',
);
export const DynamicNested = labComponent(
  {
    loader: () =>
      requiredRemote<{ default: () => React.JSX.Element }>(
        'dynamicNested/DynamicRelay',
      ),
    loading,
    fallback,
  },
  'dynamicNested/DynamicRelay',
);
export const Forecast = labComponent(
  {
    loader: () => import('provider/Forecast'),
    loading,
    fallback,
  },
  'provider/Forecast',
);
export const ClientForecast = labComponent(
  {
    noSSR: true,
    loader: () => import('library/Forecast'),
    loading,
    fallback,
  },
  'library/Forecast',
);
export const ClientRecovery = labComponent(
  {
    loader: () => import('provider/ClientRecovery'),
    loading,
    fallback,
  },
  'provider/ClientRecovery',
);
export const ServerRecovery = labComponent(
  {
    loader: () => import('provider/ServerRecovery'),
    loading,
    fallback,
  },
  'provider/ServerRecovery',
);
export const NoData = labComponent(
  {
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
  },
  'library/NoData',
);
export const Reload = labComponent(
  {
    noSSR: true,
    loader: () =>
      requiredRemote<{
        default: (props: {
          mfData?: { requestCount: number };
        }) => React.JSX.Element;
      }>('library/Reload'),
    loading,
    fallback,
  },
  'library/Reload',
);
