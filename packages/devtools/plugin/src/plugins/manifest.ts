import path from 'path';
import {
  replacer,
  RouteAsset,
  type ExportedServerState,
  type ServerManifest,
} from '@modern-js/devtools-kit/node';
import { fs, logger, nanoid } from '@modern-js/utils';
import createDeferred from 'p-defer';
import { joinURL } from 'ufo';
import { Plugin } from '../types';

declare global {
  interface DevtoolsPluginVars {
    manifest?: ServerManifest;
    manifestJson?: string;
    useManifest: Promise<ServerManifest>;
    useManifestJson: Promise<string>;
  }
}

export const pluginManifest: Plugin = {
  name: 'manifest',
  async setup(api) {
    const deferredManifest = createDeferred<ServerManifest>();
    const deferredManifestJson = createDeferred<string>();
    api.vars.useManifest = deferredManifest.promise;
    api.vars.useManifestJson = deferredManifestJson.promise;

    api.hooks.hook('settleState', async () => {
      const routesManifestName = require.resolve(
        '@modern-js/devtools-client/manifest',
      );
      const routesManifest: { routeAssets: Record<string, RouteAsset> } =
        await fs.readJSON(routesManifestName);
      const { http } = api.vars;
      if (process.env.NODE_ENV !== 'production' && http) {
        const assetPrefix = `http://localhost:${http.port}`;
        for (const routeAsset of Object.values(routesManifest.routeAssets)) {
          routeAsset.assets = routeAsset.assets?.map(asset =>
            joinURL(assetPrefix, asset),
          );
          routeAsset.referenceCssAssets = routeAsset.referenceCssAssets?.map(
            asset =>
              typeof asset === 'string' ? joinURL(assetPrefix, asset) : asset,
          ) as [];
        }
      }
      const manifest: ServerManifest = {
        ...(api.vars.state as ExportedServerState),
        routeAssets: routesManifest.routeAssets,
        version: require('../../package.json').version,
      };
      const port = api.vars.http?.port;
      if (port) {
        manifest.client = `http://localhost:${port}/static/html/client/index.html`;
        if (process.env.DEVTOOLS_RPC !== 'false') {
          manifest.websocket = `ws://localhost:${port}/rpc`;
        }
      }

      await api.hooks.callHook('createManifest', { manifest });

      api.vars.manifest = manifest;
      deferredManifest.resolve(manifest);

      const stringified = JSON.stringify(manifest, replacer());
      api.vars.manifestJson = stringified;
      deferredManifestJson.resolve(stringified);
    });

    const frameworkApi = await api.setupFramework();
    const outputManifest = async () => {
      const { nodeModulesDirectory } = frameworkApi.useAppContext();
      const name = `.cache/devtools/manifest-${nanoid(6)}.json`;
      const resolvedName = path.resolve(nodeModulesDirectory, name);
      const json = await api.vars.useManifestJson;
      await fs.outputFile(resolvedName, json, 'utf-8');
      if (process.env.NODE_ENV === 'production') {
        logger.info(
          `${api.context.def.name.formalName} DevTools output manifest to node_modules/${name}`,
        );
      }
    };
    api.frameworkHooks.hook('afterDev', outputManifest);
    api.frameworkHooks.hook('afterBuild', outputManifest);
  },
};
