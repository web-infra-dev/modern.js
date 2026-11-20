import bridgeServicePlugin from '@module-federation/bridge-react/service-runtime-plugin.node';
import { getServiceConfig } from './serviceConfig';
import { ownerOfSSRRuntime } from './ssrUpdateOwner';
declare const MODERN_SSR_FEDERATION_REQUIRE: any;

export default function serviceRuntimePlugin(options: { name?: string }) {
  const owner = ownerOfSSRRuntime(
    typeof MODERN_SSR_FEDERATION_REQUIRE === 'undefined'
      ? undefined
      : MODERN_SSR_FEDERATION_REQUIRE,
  );
  const key = owner?.id || options.name;
  // A remote Node container also initializes this plugin in its Host process.
  // Its private server context is needed only when it consumes a Service.
  return bridgeServicePlugin(() => (key ? getServiceConfig(key) : {}));
}
