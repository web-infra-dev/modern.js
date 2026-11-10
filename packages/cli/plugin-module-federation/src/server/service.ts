import { createInstance } from '@module-federation/enhanced/runtime';
import { getResourceUrl } from '@module-federation/sdk';
import {
  createBridgeServiceHandler,
  fetchBridgeService,
  type BridgeServiceCacheOptions,
  type BridgeServices,
} from '@module-federation/bridge-react/service-node';
import type { BridgeProviderInstance } from '@module-federation/bridge-react/ssr';

export interface BridgeServiceMiddlewareOptions {
  path: string;
  manifest: string;
  module: string;
  cache?: BridgeServiceCacheOptions;
  onError?: (error: Error) => void;
  authorize?: (request: Request) => void | Response | Promise<void | Response>;
}
type Context = { req: { raw: Request } };

/** This runtime is producer-only: it loads the real Node application, with no
 * Service short-circuit plugin. The consumer runtime remains independent. */
function deployment(manifest: string, module: string) {
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
      const response = await fetch(manifest);
      if (!response.ok)
        throw Error(`Service manifest returned HTTP ${response.status}`);
      const data = await response.json();
      const name = data.name;
      if (typeof name !== 'string' || !module.startsWith(`${name}/`))
        throw Error('Service module must belong to its configured manifest.');
      runtime = createInstance({
        name: `modern_service_${name}`,
        remotes: [{ name, entry: manifest }],
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
      if (!metadata?.isService || metadata.render !== 'bridge')
        throw Error(
          'Service deployment requires an isService Bridge application expose.',
        );
    })().catch(error => {
      prepared = undefined;
      throw error;
    }));
  return {
    async buildVersion() {
      await prepare();
      const version = match.remoteSnapshot?.buildVersion;
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

/** Register this once in server/modern.server.ts. Authentication runs before
 * every cache lookup. No request can select another producer module or URL. */
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
  return async (context: Context, next: () => Promise<void>) => {
    if (new URL(context.req.raw.url).pathname !== options.path) {
      await next();
      return;
    }
    return handler(context.req.raw);
  };
}

import { serviceIngressPath } from '../servicePath';

/** Trusted upstreams are supplied by deployment configuration, never POST data. */
export function createBridgeServiceIngressMiddleware(
  services: BridgeServices,
  options: { origin?: string } = {},
) {
  const publicOrigin = options.origin ? new URL(options.origin) : undefined;
  if (
    publicOrigin &&
    (!['http:', 'https:'].includes(publicOrigin.protocol) ||
      publicOrigin.origin !== options.origin)
  )
    throw Error('Service ingress origin must be an HTTP or HTTPS origin.');
  return async (context: Context, next: () => Promise<void>) => {
    const request = context.req.raw;
    const url = new URL(request.url);
    const id = Object.keys(services).find(
      id => serviceIngressPath(id) === url.pathname,
    );
    if (!id) {
      await next();
      return;
    }
    const expectedOrigin = publicOrigin?.origin || url.origin;
    if (
      request.headers.get('origin') !== expectedOrigin ||
      request.headers.get('sec-fetch-site') === 'cross-site'
    )
      return new Response('Invalid Service request origin', { status: 403 });
    const binding = services[id];
    let expectedBuild = '';
    const proxy = createBridgeServiceHandler({
      buildVersion: expected => {
        expectedBuild = expected;
        return expected;
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
        for (const name of binding.forwardHeaders || []) {
          const value = request.headers.get(name);
          if (value !== null) headers[name.toLowerCase()] = value;
        }
        return fetchBridgeService(
          { ...info, headers },
          { ...binding, buildVersion: expectedBuild },
        );
      },
    });
    return proxy(request);
  };
}
