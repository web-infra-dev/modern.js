import bridgeServicePlugin from '@module-federation/bridge-react/service-runtime-plugin.node';
import { getServiceConfig } from './serviceConfig';

export default function serviceRuntimePlugin(options: { name?: string }) {
  return bridgeServicePlugin(
    options.name ? getServiceConfig(options.name) : {},
  );
}
