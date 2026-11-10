import type { BridgeServices } from '@module-federation/bridge-react/service-node';

// SSR bundles can be publicly served. Only a runtime name crosses that boundary.
// Keep deployment credentials in process memory owned by the server bootstrap.
const key = Symbol.for('@modern-js/module-federation/private-services');
const registry: Map<string, BridgeServices> = ((globalThis as any)[key] ||=
  new Map<string, BridgeServices>());
export function registerServiceConfig(name: string, services: BridgeServices) {
  registry.set(name, services);
}
export function getServiceConfig(name: string): BridgeServices {
  const services = registry.get(name);
  if (!services)
    throw new Error(
      `Service runtime '${name}' has no server configuration. Start the Modern service server plugin before loading the SSR bundle.`,
    );
  return services;
}
