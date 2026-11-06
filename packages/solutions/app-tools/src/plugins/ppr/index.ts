import { fork } from 'node:child_process';
import os from 'node:os';
import path from 'path';
import type { ServerRoute } from '@modern-js/types';
import {
  NESTED_ROUTE_SPEC_FILE,
  PPR_MANIFEST_FILE,
  ROUTE_SPEC_FILE,
  fs,
  logger,
} from '@modern-js/utils';
import type { AppTools, CliPlugin } from '../../types';
import { type PrerenderInput, serializeConfig } from './prerender';
import { getSSRModeOfEntry, getStaticPaths } from './routes';

function runWorker(inputPath: string) {
  const ext = process.env.MODERN_LIB_FORMAT === 'esm' ? 'mjs' : 'js';
  return new Promise<number | null>((resolve, reject) => {
    const child = fork(path.join(__dirname, `worker.${ext}`), [inputPath], {
      stdio: 'inherit',
    });
    child.on('error', reject);
    child.on('exit', resolve);
  });
}

/**
 * Prerenders the static pathnames of entries using `server.ssr.mode: 'ppr'`
 * and writes the results to `ppr-manifest.json` in the output directory.
 */
export default (): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-ppr',

  // Prerender with the compiled server config, e.g. render middlewares.
  pre: ['@modern-js/server-build'],

  setup(api) {
    api.onAfterBuild(async () => {
      const appContext = api.getAppContext();
      const config = api.getNormalizedConfig();
      const { appDirectory, distDirectory, metaName } = appContext;

      const pprEntries = appContext.entrypoints
        .map(entrypoint => entrypoint.entryName)
        .filter(entryName => getSSRModeOfEntry(config, entryName) === 'ppr');

      const manifestPath = path.join(distDirectory, PPR_MANIFEST_FILE);
      // Never serve the prelude of a previous build.
      await fs.remove(manifestPath);

      if (pprEntries.length === 0) {
        return;
      }

      const { routes = [] } = (await fs
        .readJSON(path.join(distDirectory, ROUTE_SPEC_FILE))
        .catch(() => ({}))) as { routes?: ServerRoute[] };
      const nestedRoutes = (await fs
        .readJSON(path.join(distDirectory, NESTED_ROUTE_SPEC_FILE))
        .catch(() => ({}))) as Record<string, any[]>;

      const entries: PrerenderInput['entries'] = [];
      for (const entryName of pprEntries) {
        const pageRoute = routes.find(
          route => route.entryName === entryName && route.isSSR,
        );
        if (!pageRoute) {
          continue;
        }
        const entryRoutes = nestedRoutes[entryName];
        // An entry without file-system routes renders one page.
        entries.push({
          entryName,
          urlPaths: entryRoutes?.length
            ? getStaticPaths(pageRoute.urlPath, entryRoutes)
            : [pageRoute.urlPath],
        });
      }

      const input: PrerenderInput = {
        appDirectory,
        distDirectory,
        metaName,
        serverPlugins: appContext.serverPlugins,
        // The parts of the config the production server reads.
        config: {
          server: config.server,
          output: config.output,
          html: config.html,
          security: config.security,
          bff: config.bff,
          source: config.source,
          deploy: config.deploy,
        },
        routes,
        entries,
      };
      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'modern-ppr-'));
      const inputPath = path.join(tmpDir, 'input.json');
      try {
        await fs.writeFile(inputPath, serializeConfig(input));
        const code = await runWorker(inputPath);
        if (code !== 0) {
          // Without a manifest the entries are served as streaming pages.
          logger.error(
            `[PPR] Prerendering failed (exit code ${code}), entries using partial prerendering are served as streaming pages.`,
          );
        }
      } finally {
        await fs.remove(tmpDir);
      }
    });
  },
});
