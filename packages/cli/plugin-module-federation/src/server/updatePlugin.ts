import { helpers } from '@module-federation/enhanced/runtime';
import { getSSRUpdateOwner } from './ssrUpdateOwner';
import {
  collectSSRRuntimeGraph,
  collectSSRRemoteRegistrations,
} from './ssrRuntimeGraph';
import {
  DEV_SSR_CHECK_PATH,
  devSSRRefreshScript,
} from '../ssr-runtime/devRefresh';
import { createSSRUpdateServerPlugin } from './ssrUpdate';
import {
  startDevRemoteUpdates,
  DevRemoteUnavailableError,
} from './devRemoteUpdates';
import { createMFSSRLogger } from './ssrLogger';

/** Development subscriptions and request fallback share the production update owner. */
export default function updatePlugin(
  options: Parameters<typeof createSSRUpdateServerPlugin>[0] & {
    canPrepareSSRResources?: (stats: unknown) => boolean;
    devCheckPaths?: string[];
    devBuild?: {
      publisher(): { name: string; entry: string };
      setReady?(ready: boolean): void;
      registerRecover?(recover: (() => Promise<void>) | undefined): void;
    };
  },
) {
  const checkPaths = (options.devCheckPaths || ['/']).map(
    base => `${base.replace(/\/$/, '')}${DEV_SSR_CHECK_PATH}`,
  );
  let watcher: ReturnType<typeof startDevRemoteUpdates> | undefined;
  const plugin = createSSRUpdateServerPlugin({
    ...options,
    onAvailabilityChange: ready => options.devBuild?.setReady?.(ready),
    beforeRequest: async request => {
      try {
        if (watcher && checkPaths.includes(new URL(request.url).pathname)) {
          if (request.method !== 'POST')
            return new Response(null, { status: 405 });
          const origin = request.headers.get('origin');
          if (origin && origin !== new URL(request.url).origin)
            return new Response(null, { status: 403 });
          await watcher.notify('hmr-check');
          return new Response(null, {
            status: 204,
            headers: { 'Cache-Control': 'no-store' },
          });
        }
        await watcher?.check(request);
      } catch (error) {
        if (!(error instanceof DevRemoteUnavailableError)) throw error;
        return new Response(error.message, {
          status: 503,
          headers: { 'Cache-Control': 'no-store' },
        });
      }
    },
    transformTemplates: templates =>
      Object.fromEntries(
        Object.entries(templates).map(([name, template]) => [
          name,
          template.replace(
            '</head>',
            `${devSSRRefreshScript(checkPaths)}</head>`,
          ),
        ]),
      ),
    onReady(manager, context) {
      if (!context.dev) return;
      const ssrLog = createMFSSRLogger({
        app: options.name,
        mode: 'dev',
        logger: options.logger,
      });
      const owner = getSSRUpdateOwner(context.ssrUpdateOwnerId)!;
      const remotes = () => {
        const registered = [...owner.instances].flatMap(
          instance => instance.options.remotes,
        );
        const localServices = [...owner.serviceInstances].flatMap(scope =>
          [...scope.moduleCache.values()].flatMap((module: any) => {
            const provider = helpers.global.getRemoteFederationInstance(
              module.remoteInfo,
            );
            return provider?.options.remotes || [];
          }),
        );
        const result = new Map<string, any>();
        for (const remote of [
          ...(options.remotes || []),
          ...(owner.registrations || []),
          ...registered,
          ...localServices,
        ])
          if (typeof remote.entry === 'string') {
            const {
              manifest: _manifest,
              moduleInfo: _moduleInfo,
              ...descriptor
            } = remote;
            result.set(remote.name, descriptor);
          }
        return [...result.values()];
      };
      watcher = startDevRemoteUpdates({
        self: options.devBuild?.publisher(),
        requestTimeoutMs: options.application?.requestTimeoutMs,
        remotes,
        dependencies(remote) {
          const providers = [
            ...collectSSRRuntimeGraph([
              ...owner.instances,
              ...owner.serviceInstances,
            ]),
          ].flatMap(instance => {
            const registered = instance.options.remotes.find(
              (item: any) =>
                item.name === remote.name && item.entry === remote.entry,
            );
            const info =
              registered &&
              instance.moduleCache.get(registered.name)?.remoteInfo;
            const provider =
              info && helpers.global.getRemoteFederationInstance(info);
            return provider ? [provider] : [];
          });
          return collectSSRRemoteRegistrations(providers).flatMap(
            ({ remote }) =>
              'entry' in remote && typeof remote.entry === 'string'
                ? [{ ...remote, entry: remote.entry }]
                : [],
          );
        },
        shouldUpdateRemote: (remote, input) =>
          manager.shouldUpdateRemote(remote, input),
        updateRemotes: (remotes, input) =>
          manager.updateRemotes(remotes, input),
        onError: (error, phase) => {
          if (phase === 'update') return;
          ssrLog.updateFailed({
            mode: 'dev',
            stage: 'check',
            error,
          });
        },
      });
      options.devBuild?.registerRecover?.(async () => {
        await watcher?.notify('recover');
      });
      return () => {
        options.devBuild?.registerRecover?.(undefined);
        watcher!.close();
      };
    },
  });
  return {
    ...plugin,
    setup(api: Parameters<NonNullable<typeof plugin.setup>>[0]) {
      api.onPrepare(() => {
        if (api.getServerContext().dev && options.canPrepareSSRResources)
          api.updateServerContext({
            canPrepareSSRResources: options.canPrepareSSRResources,
          });
      });
      plugin.setup!(api);
    },
  };
}
