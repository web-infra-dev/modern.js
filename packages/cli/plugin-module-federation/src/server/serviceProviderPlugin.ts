import path from 'node:path';
import { readFile, stat } from 'node:fs/promises';
import type {
  MiddlewareHandler,
  ServerPlugin,
} from '@modern-js/server-runtime';
import type { Manifest } from '@module-federation/sdk';
import type { BridgeServiceCacheOptions } from '@module-federation/bridge-react/service-node';
import { serviceProviderRoutes } from '../serviceProvider';
import type { createBridgeServiceMiddleware } from './service';

interface Options {
  manifestFileName: string;
  basePaths: string[];
  cache?: BridgeServiceCacheOptions;
}

/** Only serializable deployment policy enters generated server bootstrap code. */
export default (options: Options): ServerPlugin => ({
  name: '@modern-js/module-federation/service-provider',
  setup(api) {
    api.onPrepare(() => {
      const context = api.getServerContext();
      const filename = path.resolve(
        context.distDirectory!,
        options.manifestFileName,
      );
      if (
        !filename.startsWith(
          `${path.resolve(context.distDirectory!)}${path.sep}`,
        )
      )
        throw Error(
          'Service provider manifest must be inside the build output directory.',
        );
      let modified: number | undefined;
      let handlers = new Map<
        string,
        ReturnType<typeof createBridgeServiceMiddleware>
      >();
      let loading: Promise<void> | undefined;
      const managed = () =>
        Boolean((api.getServerContext() as any).ssrUpdateManager);
      const prepare = () =>
        (loading ||= (async () => {
          // Production output is immutable for the lifetime of this process.
          // Ordinary MF producers pay no file I/O after discovering no Services.
          if (modified !== undefined && process.env.NODE_ENV === 'production')
            return;
          const file = await stat(filename).catch(error => {
            if (error.code === 'ENOENT') return undefined;
            throw error;
          });
          if (!file) return;
          if (modified === file.mtimeMs) return;
          const manifest: Manifest = JSON.parse(
            await readFile(filename, 'utf8'),
          );
          const routes = serviceProviderRoutes(manifest, options.basePaths);
          const nextHandlers = new Map<
            string,
            ReturnType<typeof createBridgeServiceMiddleware>
          >();
          if (routes.length) {
            const { createBridgeServiceMiddleware } = await import('./service');
            // The scoped runtime receives a snapshot of the local artifact.
            // Its manifest URL only supplies the base for `publicPath: auto`.
            const origin = new URL(manifest.metaData.serviceBaseUrl!).origin;
            const publicPath =
              'publicPath' in manifest.metaData &&
              manifest.metaData.publicPath &&
              manifest.metaData.publicPath !== 'auto'
                ? manifest.metaData.publicPath
                : '/';
            const assetBase = new URL(
              publicPath.endsWith('/') ? publicPath : `${publicPath}/`,
              `${origin}/`,
            );
            const manifestUrl = new URL(options.manifestFileName, assetBase)
              .href;
            for (const route of routes)
              nextHandlers.set(
                route.path,
                createBridgeServiceMiddleware({
                  ...route,
                  manifest: { url: manifestUrl, data: manifest },
                  cache: options.cache,
                }),
              );
          }
          handlers = nextHandlers;
          modified = file.mtimeMs;
        })().finally(() => {
          loading = undefined;
        }));
      const dispose = async () => {
        await loading;
        await Promise.all(
          [...handlers.values()].map(handler => handler.dispose()),
        );
        handlers.clear();
        modified = undefined;
      };
      const participants = (context as any).ssrUpdateParticipants || [];
      api.updateServerContext({ ssrUpdateParticipants: participants });
      participants.push({
        dispose,
        invalidate: dispose,
        prepare,
      });
      const handler: MiddlewareHandler = async (context, next) => {
        if (context.req.raw.method !== 'POST') return next();
        // The server is already listening and dev compilation has completed.
        // No startup-time fetch to the producer's own public origin is needed.
        if (!managed() || modified === undefined) await prepare();
        const handler = handlers.get(new URL(context.req.raw.url).pathname);
        return handler ? handler(context, next) : next();
      };
      context.middlewares.push({
        name: 'mf-service-provider',
        handler,
      });
    });
  },
});
