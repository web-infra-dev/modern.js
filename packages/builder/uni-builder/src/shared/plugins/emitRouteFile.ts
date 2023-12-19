import { join } from 'path';
import { type RsbuildPlugin, isFileExists } from '@rsbuild/shared';

/**
 * generate a basic route.json for modern.js server
 */
export const pluginEmitRouteFile = (): RsbuildPlugin => ({
  name: 'uni-builder:emit-route-file',

  setup(api) {
    api.onBeforeStartDevServer(async () => {
      const { fs, ROUTE_SPEC_FILE } = await import('@modern-js/utils');
      const routeFilePath = join(api.context.distPath, ROUTE_SPEC_FILE);
      const htmlPaths = api.getHTMLPaths();

      const routesInfo = Object.entries(htmlPaths).map(
        ([entryName, filename], index) => ({
          urlPath: index === 0 ? '/' : `/${entryName}`,
          entryName,
          entryPath: filename,
          isSPA: true,
        }),
      );

      // if the framework has already generate a route.json, do nothing
      if (!(await isFileExists(routeFilePath)) && routesInfo.length) {
        await fs.outputFile(
          routeFilePath,
          JSON.stringify({ routes: routesInfo }, null, 2),
        );
      }
    });
  },
});
