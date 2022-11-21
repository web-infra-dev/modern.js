import path from 'path';
import {
  fs,
  ROUTE_MANIFEST,
  logger,
  ROUTE_MINIFEST_FILE,
} from '@modern-js/utils';
import type { Compiler } from 'webpack';
import { NESTED_ROUTES_DIR } from '../../analyze/constants';

const PLUGIN_NAME = 'ModernjsRoutePlugin';

interface RouteAssets {
  [routeId: string]: {
    chunkIds?: (string | number)[];
    assets?: string[];
  };
}

interface Options {
  appDirectory: string;
}

export default class RouterPlugin {
  private appDirectory: string;

  constructor(options: Options) {
    this.appDirectory = options.appDirectory;
  }

  apply(compiler: Compiler) {
    const { target, context } = compiler.options;
    if (
      target === 'node' ||
      (Array.isArray(target) && target.includes('node'))
    ) {
      return;
    }

    const appDirectory = this.appDirectory || context;
    const routeDir = path.join(appDirectory!, NESTED_ROUTES_DIR);
    const existNestedRoutes = fs.existsSync(routeDir);

    if (!existNestedRoutes) {
      return;
    }

    const { webpack } = compiler;
    const { Compilation, sources } = webpack;
    const { RawSource } = sources;
    const { PROCESS_ASSETS_STAGE_REPORT } = Compilation;

    const outputPath = compiler.options.output.path!;
    const newAssetsMap = new Map<string, string>();
    compiler.hooks.thisCompilation.tap(PLUGIN_NAME, compilation => {
      compilation.hooks.processAssets.tapPromise(
        {
          name: PLUGIN_NAME,
          stage: PROCESS_ASSETS_STAGE_REPORT,
        },
        async () => {
          const stats = compilation.getStats().toJson({
            chunkGroups: true,
            chunks: true,
          });
          const routeAssets: RouteAssets = {};
          const { namedChunkGroups, assetsByChunkName } = stats;

          if (!namedChunkGroups || !assetsByChunkName) {
            logger.warn(
              'Route manifest does not exist, performance will be affected',
            );
            return;
          }

          for (const [name, chunkGroup] of Object.entries(namedChunkGroups)) {
            routeAssets[name] = {
              chunkIds: chunkGroup.chunks,
              assets: assetsByChunkName[name],
            };
          }

          const manifest = {
            routeAssets,
          };
          const injectedContent = `
            ;(function(){
              window.${ROUTE_MANIFEST} = ${JSON.stringify(manifest)};
            })();
          `;

          const entrypointsArray = Array.from(
            compilation.entrypoints.entries(),
          );
          const entryChunkIds = entrypointsArray.map(
            entrypoint => entrypoint[0],
          );
          const entryChunks = [...compilation.chunks].filter(chunk => {
            return entryChunkIds.includes(chunk.name);
          });
          const entryChunkFiles = entryChunks.map(chunk => [...chunk.files][0]);

          for (const file of entryChunkFiles) {
            const asset = compilation.assets[file];
            const newContent = `${injectedContent}${asset.source().toString()}`;
            newAssetsMap.set(path.join(outputPath, file), newContent);
            compilation.updateAsset(file, new RawSource(newContent));
          }

          const filename = path.join(outputPath, ROUTE_MINIFEST_FILE);
          await fs.ensureFile(filename);
          await fs.writeFile(filename, JSON.stringify(manifest, null, 2));
        },
      );
    });
  }
}
