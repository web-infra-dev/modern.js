import fs from 'node:fs';
import { join } from 'node:path';
import type { RsbuildPlugin } from '@rsbuild/core';

export async function isFileExists(file: string) {
  return fs.promises
    .access(file, fs.constants.F_OK)
    .then(() => true)
    .catch(() => false);
}

/**
 * generate a basic route.json for modern.js server
 */
export const pluginEmitRouteFile = (): RsbuildPlugin => ({
  name: 'builder:emit-route-file',

  setup(api) {
    api.onBeforeStartDevServer(async ({ environments }) => {
      const { fs, ROUTE_SPEC_FILE } = await import('@modern-js/utils');
      const routeFilePath = join(api.context.distPath, ROUTE_SPEC_FILE);

      const htmlPaths = Object.values(environments).reduce<
        Record<string, string>
      >((prev, curr) => {
        return {
          ...prev,
          ...curr.htmlPaths,
        };
      }, {});

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
