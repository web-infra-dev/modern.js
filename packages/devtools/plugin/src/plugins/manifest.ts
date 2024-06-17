import path from 'path';
import {
  replacer,
  type ExportedServerState,
  type ServerManifest,
} from '@modern-js/devtools-kit/node';
import { fs, logger, nanoid } from '@modern-js/utils';
import createDeferred from 'p-defer';
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
  async setup(api) {
    const deferredManifest = createDeferred<ServerManifest>();
    const deferredManifestJson = createDeferred<string>();
    api.vars.useManifest = deferredManifest.promise;
    api.vars.useManifestJson = deferredManifestJson.promise;

    api.hooks.hook('settleState', async () => {
      const routesManifestName = require.resolve(
        '@modern-js/devtools-client/manifest',
      );
      const routesManifest = await fs.readJSON(routesManifestName);
      const manifest: ServerManifest = {
        ...(api.vars.state as ExportedServerState),
        client: '/__devtools',
        websocket: '/__devtools/rpc',
        routeAssets: routesManifest.routeAssets,
      };
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
