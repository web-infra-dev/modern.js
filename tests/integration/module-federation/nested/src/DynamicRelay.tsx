import RelayTools from './RelayTools';
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
  { name: 'dynamic', entry: `${process.env.MF_LAB_LIBRARY}/mf-manifest.json` },
]);
const Signal = getInstance()!.createLazyComponent({
  loader: () =>
    requiredRemote<{ default: (props: { id?: string }) => React.JSX.Element }>(
      'dynamic/Signal',
    ),
  loading: 'Relaying signal…',
  fallback: <p>Relay unavailable.</p>,
});
export default function DynamicRelay() {
  return (
    <section data-testid="dynamic-nested">
      <p className="relay-label">Dynamic nested remote → Rslib remote</p>
      <Signal id="dynamic-nested-signal" />
      <RelayTools />
    </section>
  );
}
