import path from 'path';
import type { AppTools, CliPlugin } from '@modern-js/app-tools';
import type {
  NestedRouteForCli,
  PageRoute,
  SSGSingleEntryOptions,
} from '@modern-js/types';
import { filterRoutesForServer, logger } from '@modern-js/utils';
import { makeRoute } from './libs/make';
import { writeHtmlFile } from './libs/output';
import { replaceRoute } from './libs/replace';
import {
  flattenRoutes,
  formatOutput,
  isDynamicUrl,
  readJSONSpec,
  standardOptions,
  writeJSONSpec,
} from './libs/util';
import { createServer } from './server';
import type {
  AgreedRoute,
  AgreedRouteMap,
  SSGConfig,
  SSGRouteOptions,
  SsgRoute,
} from './types';

export const ssgPlugin = (): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-ssg',

  pre: ['@modern-js/plugin-bff'],

  setup: api => {
    const agreedRouteMap: AgreedRouteMap = {};

    api.modifyFileSystemRoutes(async ({ entrypoint, routes }) => {
      const { entryName } = entrypoint;
      const flattedRoutes = flattenRoutes(
        filterRoutesForServer(routes as (NestedRouteForCli | PageRoute)[]),
      );
      agreedRouteMap[entryName] = flattedRoutes;
      return { entrypoint, routes };
    });

    api.onAfterBuild(async () => {
      const resolvedConfig = api.getNormalizedConfig();
      const appContext = api.getAppContext();

      const { appDirectory, entrypoints } = appContext;
      const { output, server } = resolvedConfig;
      const {
        ssg,
        ssgByEntries,
        distPath: { root: outputPath } = {},
      } = output;

      const ssgOptions: SSGConfig =
        (Array.isArray(ssg) ? (ssg as any[]).pop() : (ssg as any)) ?? true;

      const buildDir = path.join(appDirectory, outputPath as string);
      const routes = readJSONSpec(buildDir);

      // filter all routes not web
      const pageRoutes = routes.filter(route => route.isSPA);
      const apiRoutes = routes.filter(route => !route.isSPA);

      // if no web page route, skip ssg render
      if (pageRoutes.length === 0) {
        return;
      }

      const intermediateOptions = standardOptions(
        ssgOptions,
        entrypoints,
        pageRoutes,
        server,
        ssgByEntries,
      );

      if (!intermediateOptions) {
        return;
      }

      const ssgRoutes: SsgRoute[] = [];
      // each route will try to match the configuration
      pageRoutes.forEach(pageRoute => {
        const { entryName, entryPath } = pageRoute;
        const agreedRoutes = agreedRouteMap[entryName as string];
        let entryOptions = (intermediateOptions[entryName as string] ||
          intermediateOptions[pageRoute.urlPath]) as SSGSingleEntryOptions;

        if (!agreedRoutes) {
          // default behavior for non-agreed route
          if (!entryOptions) {
            return;
          }

          // only add entry route if entryOptions is true
          if (entryOptions === true) {
            ssgRoutes.push({ ...pageRoute, output: entryPath });
          } else if (entryOptions.routes && entryOptions.routes.length > 0) {
            // if entryOptions is object and has routes options
            // add every route in options
            const { routes: enrtyRoutes, headers } = entryOptions;
            enrtyRoutes.forEach((route: SSGRouteOptions) => {
              ssgRoutes.push(makeRoute(pageRoute, route, headers));
            });
          }
        } else {
          // Unless entryOptions is set to false
          // the default behavior is to add all file-based routes
          if (!entryOptions) {
            return;
          }

          if (entryOptions === true) {
            entryOptions = { routes: [], headers: {} } as any;
          }

          const { routes: userRoutes = [], headers } =
            (entryOptions as {
              routes?: SSGRouteOptions[];
              headers?: Record<string, any>;
            }) || {};
          // if the user sets the routes, then only add them
          if (userRoutes.length > 0) {
            (userRoutes as SSGRouteOptions[]).forEach(
              (route: SSGRouteOptions) => {
                if (typeof route === 'string') {
                  ssgRoutes.push(makeRoute(pageRoute, route, headers));
                } else {
                  ssgRoutes.push(makeRoute(pageRoute, route, headers));
                }
              },
            );
          } else {
            // default: add all non-dynamic routes
            agreedRoutes.forEach((route: AgreedRoute) => {
              if (!isDynamicUrl(route.path!)) {
                ssgRoutes.push(makeRoute(pageRoute, route.path!, headers));
              }
            });
          }
        }
      });

      if (ssgRoutes.length === 0) {
        return;
      }

      // currently SSG and SSR cannot be turned on at the same time、same route
      ssgRoutes.forEach((ssgRoute: SsgRoute) => {
        if (ssgRoute.isSSR) {
          const isOriginRoute = pageRoutes.some(
            pageRoute =>
              pageRoute.urlPath === ssgRoute.urlPath &&
              pageRoute.entryName === ssgRoute.entryName,
          );

          if (isOriginRoute) {
            throw new Error(
              `ssg can not using with ssr，url - ${
                ssgRoute.urlPath
              }, entry - ${ssgRoute.entryName!} `,
            );
          }

          logger.warn(
            `new ssg route ${
              ssgRoute.urlPath
            } is using ssr now，maybe from parent route ${ssgRoute.entryName!}，close ssr`,
          );
        }
        ssgRoute.isSSR = false;
        ssgRoute.output = formatOutput(ssgRoute.output);
      });

      const htmlAry = await createServer(
        appContext,
        ssgRoutes,
        pageRoutes,
        apiRoutes,
        resolvedConfig,
      );

      // write to dist file
      writeHtmlFile(htmlAry, ssgRoutes, buildDir);

      // format route info, side effect
      replaceRoute(ssgRoutes, pageRoutes);

      // write routes to spec file
      writeJSONSpec(buildDir, pageRoutes.concat(apiRoutes));

      logger.info('ssg Compiled successfully');
    });
  },
});

export default ssgPlugin;
