import type { moduleFederationPlugin } from '@module-federation/sdk';
import {
  addServiceProviderMetadata,
  type ServiceProviderOptions,
} from '../serviceProvider';

export function configureServiceProvider(
  config: moduleFederationPlugin.ModuleFederationPluginOptions,
  options: ServiceProviderOptions | undefined,
  baseUrl: string | string[] | undefined,
  developmentOrigin: () => string | undefined,
  hasNodeBuild: () => boolean = () => true,
) {
  if (config.manifest === false) {
    if (options)
      throw Error('Service provider requires the Module Federation manifest.');
    return;
  }
  const manifest = typeof config.manifest === 'object' ? config.manifest : {};
  const additionalData = manifest.additionalData;
  config.manifest = {
    ...manifest,
    async additionalData(args) {
      if (
        args.stats.exposes.some(expose => expose.isService) &&
        !hasNodeBuild()
      )
        throw Error(
          'Service App requires a Node provider build. Enable producer SSR and Module Federation SSR before exposing a Service App.',
        );
      const fallbackOrigin =
        !options?.origin && args.stats.exposes.some(expose => expose.isService)
          ? developmentOrigin()
          : undefined;
      const stats = addServiceProviderMetadata(
        args.stats,
        options,
        baseUrl,
        fallbackOrigin,
      );
      return (await additionalData?.({ ...args, stats })) || stats;
    },
  };
}
