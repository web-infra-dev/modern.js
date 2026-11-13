import { randomUUID } from 'node:crypto';
import {
  createInstance,
  ModuleFederation,
} from '@module-federation/enhanced/runtime';
import {
  generateSnapshotFromManifest,
  getResourceUrl,
  getServiceUrl,
} from '@module-federation/sdk';
import {
  createBridgeServiceHandler,
  fetchBridgeService,
  type BridgeServiceCacheOptions,
  type BridgeServices,
} from '@module-federation/bridge-react/service-node';
import type { BridgeProviderInstance } from '@module-federation/bridge-react/ssr';
import type { Manifest } from '@module-federation/sdk';
import type { SSRRequestWork } from '@modern-js/server-core/node';
import ssrOwnership from '../cli/mfRuntimePlugins/ssr-ownership';
import { createSSRUpdateSnapshotPlugin } from './ssrUpdateCandidates';
import { getSSRUpdateOwner, runWithSSRUpdateOwner } from './ssrUpdateOwner';

export interface BridgeServiceMiddlewareOptions {
  ownerId?: string;
  path: string;
  manifest: string | { url: string; data: Manifest };
  module: string;
  cache?: BridgeServiceCacheOptions;
  onError?: (error: Error) => void;
  authorize?: (request: Request) => void | Response | Promise<void | Response>;
}
type Context = {
  req: { raw: Request };
  get(name: 'ssrWork'): SSRRequestWork | undefined;
};

function resolveServiceAssetPrefix(prefix: string, origin: string): string {
  // Keep explicit deployment URLs unchanged, including CDN and signed URLs.
  if (/^[a-z][a-z\d+.-]*:/i.test(prefix)) return prefix;
  return new URL(prefix, origin).href;
}

/** This runtime is producer-only: it loads the real Node application, with no
 * Service short-circuit plugin. The consumer runtime remains independent. */
function deployment(
  manifest: BridgeServiceMiddlewareOptions['manifest'],
  module: string,
) {
  const manifestUrl = typeof manifest === 'string' ? manifest : manifest.url;
  // Independent middleware instances may expose the same remote under several
  // routes. Shared ownership follows the consumer name, not the remote name.
  const owner = randomUUID();
  // A scoped MF name includes one leading slash. Use the final module separator
  // resolved against the manifest's name instead of guessing an expose path.
  let runtime: ReturnType<typeof createInstance> | undefined;
  let match: Awaited<
    ReturnType<
      NonNullable<typeof runtime>['remoteHandler']['getRemoteModuleAndOptions']
    >
  >['remoteMatchInfo'];
  let prepared: Promise<void> | undefined;
  const prepare = () =>
    (prepared ||= (async () => {
      let data: Manifest;
      if (typeof manifest === 'string') {
        const response = await fetch(manifest);
        if (!response.ok)
          throw Error(`Service manifest returned HTTP ${response.status}`);
        data = await response.json();
      } else data = manifest.data;
      const name = data.name;
      if (
        typeof name !== 'string' ||
        (module !== name && !module.startsWith(`${name}/`))
      )
        throw Error('Service module must belong to its configured manifest.');
      runtime = createInstance({
        name: `modern_service_${name}_${owner}`,
        remotes: [{ name, entry: manifestUrl }],
        // The producer's local build snapshot takes precedence over snapshots
        // retained by other runtimes, including after a development rebuild.
        plugins: [
          ssrOwnership(),
          ...(typeof manifest === 'string'
            ? []
            : [
                {
                  name: 'modern-service-local-snapshot',
                  loadSnapshot(args) {
                    if (args.moduleInfo.name !== name) return args;
                    const snapshot = generateSnapshotFromManifest(data, {
                      version: manifestUrl,
                    });
                    // Modern resource prefixes are independent of server.baseUrl.
                    // Resolve each relative prefix from the producer origin, not
                    // from another asset prefix or the manifest's directory.
                    // Absolute CDN prefixes and SDK-resolved `auto` stay intact.
                    const assetOrigin = `${new URL(data.metaData.serviceBaseUrl!).origin}/`;
                    if ('publicPath' in snapshot) {
                      snapshot.publicPath = resolveServiceAssetPrefix(
                        snapshot.publicPath,
                        assetOrigin,
                      );
                      if (typeof snapshot.ssrPublicPath === 'string')
                        snapshot.ssrPublicPath = resolveServiceAssetPrefix(
                          snapshot.ssrPublicPath,
                          assetOrigin,
                        );
                    }
                    return {
                      ...args,
                      remoteSnapshot: snapshot,
                    };
                  },
                } satisfies ModuleFederationRuntimePlugin,
              ]),
        ],
        shared: {},
        shareStrategy: 'loaded-first',
      });
      match = (
        await runtime.remoteHandler.getRemoteModuleAndOptions({ id: module })
      ).remoteMatchInfo;
      const snapshot = match.remoteSnapshot;
      const metadata =
        snapshot && 'modules' in snapshot
          ? snapshot.modules.find(
              item =>
                item.modulePath === match.expose ||
                item.moduleName === match.expose.replace(/^\.\//, ''),
            )
          : undefined;
      if (
        !metadata?.servicePath ||
        !snapshot ||
        !('serviceBaseUrl' in snapshot) ||
        !snapshot.serviceBaseUrl ||
        metadata.render !== 'bridge'
      )
        throw Error(
          'Service deployment requires a Bridge application expose with servicePath and serviceBaseUrl.',
        );
    })().catch(async error => {
      try {
        await runtime?.destroy();
      } catch (disposalError) {
        // Keep this runtime and the rejected preparation reachable for dispose()
        // to retry. A new preparation must not overwrite an uncleared owner.
        throw new AggregateError(
          [error, disposalError],
          'Service preparation and runtime cleanup failed.',
        );
      }
      runtime = undefined;
      prepared = undefined;
      throw error;
    }));
  return {
    async dispose() {
      await prepared?.catch(() => {});
      await runtime?.destroy();
      runtime = undefined;
      prepared = undefined;
    },
    async buildVersion() {
      await prepare();
      const version =
        match.remoteSnapshot?.devRevision || match.remoteSnapshot?.buildVersion;
      if (!version) throw Error('Service manifest has no build identity.');
      return version;
    },
    async render(
      info: Parameters<NonNullable<BridgeProviderInstance['renderStream']>>[0],
    ) {
      await prepare();
      const remote = await runtime!.loadRemote<{
        default: () => BridgeProviderInstance;
      }>(module);
      info.signal.throwIfAborted();
      const provider = remote?.default();
      if (!provider?.renderStream)
        throw Error('Service application has no Node renderStream provider.');
      const result = await provider.renderStream(info);
      const snapshot = match.remoteSnapshot;
      const metadata =
        snapshot && 'modules' in snapshot
          ? snapshot.modules.find(
              item =>
                item.modulePath === match.expose ||
                item.moduleName === match.expose.replace(/^\.\//, ''),
            )
          : undefined;
      const stylesheets =
        snapshot && metadata
          ? metadata.assets.css.sync.map(asset =>
              getResourceUrl(snapshot, asset),
            )
          : [];
      return {
        ...result,
        stylesheets: [
          ...new Set([...(result.stylesheets || []), ...stylesheets]),
        ],
      };
    },
  };
}

/** Low-level middleware for custom deployments. Modern automatically registers
 * ordinary Service producers. Authentication runs before every cache lookup. */
export function createBridgeServiceMiddleware(
  options: BridgeServiceMiddlewareOptions,
) {
  const producer = deployment(options.manifest, options.module);
  const handler = createBridgeServiceHandler({
    ...producer,
    cache: options.cache,
    authorize: options.authorize,
    onError: options.onError || console.error,
  });
  const middleware = async (context: Context, next: () => Promise<void>) => {
    if (new URL(context.req.raw.url).pathname !== options.path) {
      await next();
      return;
    }
    const invoke = () =>
      handler(context.req.raw, { work: context.get('ssrWork') });
    const owner = getSSRUpdateOwner(options.ownerId);
    return owner ? runWithSSRUpdateOwner(owner, invoke) : invoke();
  };
  return Object.assign(middleware, { dispose: producer.dispose });
}

import { SERVICE_INGRESS_PREFIX, serviceIngressPath } from '../servicePath';
import type { ServiceRemote } from '../serviceRemotes';
import type { ModuleFederationRuntimePlugin } from '@module-federation/enhanced/runtime';

/** Resolve only configured remotes through the ordinary Snapshot-first runtime. */
export function createBridgeServiceIngressMiddleware(
  services: BridgeServices,
  options: {
    origin?: string;
    name?: string;
    ownerId?: string;
    remotes?: ServiceRemote[];
    plugins?:
      | ModuleFederationRuntimePlugin[]
      | (() => Promise<ModuleFederationRuntimePlugin[]>);
  } = {},
) {
  const publicOrigin = options.origin ? new URL(options.origin) : undefined;
  const consumerId = `${options.ownerId || 'service'}:${randomUUID()}`;
  if (
    publicOrigin &&
    (!['http:', 'https:'].includes(publicOrigin.protocol) ||
      publicOrigin.origin !== options.origin)
  )
    throw Error('Service ingress origin must be an HTTP or HTTPS origin.');
  let runtime: ModuleFederation | undefined;
  let installedPlugins: ModuleFederationRuntimePlugin[] | undefined;
  const resolve = async (id: string) => {
    const plugins =
      typeof options.plugins === 'function'
        ? await options.plugins()
        : options.plugins;
    if (!runtime || plugins !== installedPlugins) {
      // Scoped discovery does not retain old dev instances in the global registry.
      runtime = new ModuleFederation({
        id: `${consumerId}:${randomUUID()}`,
        name: `${options.name || 'modern'}_service_ingress_${consumerId}`,
        remotes: options.remotes || [],
        plugins: [
          ...(plugins || []),
          createSSRUpdateSnapshotPlugin(
            () => options.ownerId || getSSRUpdateOwner()?.id,
          ),
        ],
        shared: {},
        shareStrategy: 'loaded-first',
      });
      installedPlugins = plugins;
    }
    const selectedRuntime = runtime;
    const { remoteMatchInfo: match } =
      await selectedRuntime.remoteHandler.getRemoteModuleAndOptions({ id });
    const snapshot = match.remoteSnapshot;
    if (!snapshot || !('modules' in snapshot))
      throw Error(`Service '${id}' has no module Snapshot.`);
    const metadata = snapshot.modules.find(
      item =>
        item.modulePath === match.expose ||
        item.moduleName === match.expose.replace(/^\.\//, ''),
    );
    if (
      !metadata ||
      !('servicePath' in metadata) ||
      metadata.render !== 'bridge'
    )
      throw Error(`Module '${id}' is not a Service Bridge application.`);
    if (!snapshot?.buildVersion)
      throw Error(`Service '${id}' has no build identity.`);
    return {
      url: getServiceUrl(snapshot.serviceBaseUrl, metadata.servicePath!),
      buildVersion: snapshot.devRevision || snapshot.buildVersion,
    };
  };
  const middleware = async (context: Context, next: () => Promise<void>) => {
    const request = context.req.raw;
    const url = new URL(request.url);
    if (!url.pathname.startsWith(SERVICE_INGRESS_PREFIX)) {
      await next();
      return;
    }
    let id: string;
    try {
      id = decodeURIComponent(
        url.pathname.slice(SERVICE_INGRESS_PREFIX.length),
      );
      if (serviceIngressPath(id) !== url.pathname)
        throw Error('Invalid module encoding');
    } catch {
      return new Response('Invalid Service module', { status: 400 });
    }
    const expectedOrigin = publicOrigin?.origin || url.origin;
    if (
      request.headers.get('origin') !== expectedOrigin ||
      request.headers.get('sec-fetch-site') === 'cross-site'
    )
      return new Response('Invalid Service request origin', { status: 403 });
    const remote = options.remotes?.find(
      remote =>
        id === remote.name ||
        id.startsWith(`${remote.name}/`) ||
        (remote.alias &&
          (id === remote.alias || id.startsWith(`${remote.alias}/`))),
    );
    if (!remote)
      return new Response('Unconfigured Service remote', { status: 400 });
    const prefix =
      id === remote.name || id.startsWith(`${remote.name}/`)
        ? remote.name
        : remote.alias!;
    const expose = id.slice(prefix.length);
    const policy =
      services[id] ||
      services[remote.name + expose] ||
      (remote.alias && services[remote.alias + expose]) ||
      {};
    let deployment: Awaited<ReturnType<typeof resolve>>;
    const proxy = createBridgeServiceHandler({
      forwardVersionMismatch: true,
      async buildVersion() {
        deployment = await resolve(id);
        return deployment.buildVersion;
      },
      validate(info) {
        if (
          info.moduleName !== id ||
          new URL(info.url).origin !== expectedOrigin
        )
          return new Response('Invalid Service module or page URL', {
            status: 400,
          });
      },
      async render(info) {
        const headers: Record<string, string> = {};
        for (const name of policy.forwardHeaders || []) {
          const value = request.headers.get(name);
          if (value !== null) headers[name.toLowerCase()] = value;
        }
        return fetchBridgeService(
          { ...info, headers },
          { ...policy, ...deployment },
        );
      },
    });
    return proxy(request, { work: context.get('ssrWork') });
  };
  return Object.assign(middleware, {
    async dispose() {
      await runtime?.destroy();
      runtime = undefined;
      installedPlugins = undefined;
    },
  });
}
