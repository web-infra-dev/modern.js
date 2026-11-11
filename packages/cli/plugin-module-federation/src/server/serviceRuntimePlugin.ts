import bridgeServicePlugin from '@module-federation/bridge-react/service-runtime-plugin.node';
import { getServiceConfig } from './serviceConfig';

export default function serviceRuntimePlugin(options: { name?: string }) {
  // A remote Node container also initializes this plugin in its Host process.
  // Its private server context is needed only when it consumes a Service.
  return bridgeServicePlugin(() =>
    options.name ? getServiceConfig(options.name) : {},
  );
}
