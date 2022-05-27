import path from 'path';
import { logger, PLUGIN_SCHEMAS } from '@modern-js/utils';
import type { CliPlugin } from '@modern-js/core';
import { generatePath } from 'react-router-dom';
import {
  AgreedRoute,
  AgreedRouteMap,
  EntryPoint,
  SSGConfig,
  SsgRoute,
} from './types';
import {
  formatOutput,
  isDynamicUrl,
  readJSONSpec,
  standardOptions,
  writeJSONSpec,
} from './libs/util';
import { createServer } from './server';
import { writeHtmlFile } from './libs/output';
import { replaceRoute } from './libs/replace';
import { makeRoute } from './libs/make';

export default (): CliPlugin => ({
  name: '@modern-js/plugin-ssg',

  setup: api => {
    const agreedRouteMap: AgreedRouteMap = {};

    return {
      validateSchema() {
        return PLUGIN_SCHEMAS['@modern-js/plugin-ssg'];
      },
      modifyFileSystemRoutes({
        entrypoint,
        routes,
      }: {
        entrypoint: EntryPoint;
        routes: AgreedRoute[];
      }) {
        const { entryName } = entrypoint;
        agreedRouteMap[entryName] = routes;

        return { entrypoint, routes };
      },
      async afterBuild() {
        const resolvedConfig = api.useResolvedConfigContext();
        const appContext = api.useAppContext();

        const { appDirectory, entrypoints } = appContext;
        const { output } = resolvedConfig;
        const { ssg, path: outputPath } = output;

        const ssgOptions: SSGConfig = Array.isArray(ssg) ? ssg.pop() : ssg;
        // no ssg configuration, skip ssg render.
        if (!ssgOptions) {
          return;
        }

        const buildDir = path.join(appDirectory, outputPath as string);
        const routes = readJSONSpec(buildDir);

        // filter all routes not web
        const pageRoutes = routes.filter(route => !route.isApi);
        const apiRoutes = routes.filter(route => route.isApi);

        // if no web page route, skip ssg render
        if (pageRoutes.length === 0) {
          return;
        }

        const intermediateOptions = standardOptions(ssgOptions, entrypoints);

        if (!intermediateOptions) {
          return;
        }

        const ssgRoutes: SsgRoute[] = [];
        // each route will try to match the configuration
        pageRoutes.forEach(pageRoute => {
          const { entryName, entryPath } = pageRoute;
          const agreedRoutes = agreedRouteMap[entryName as string];
          let entryOptions = intermediateOptions[entryName as string];

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
              enrtyRoutes.forEach(route => {
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
              entryOptions = { preventDefault: [], routes: [], headers: {} };
            }

            const {
              preventDefault = [],
              routes: userRoutes = [],
              headers,
            } = entryOptions;
            // if the user sets the routes, then only add them
            if (userRoutes.length > 0) {
              userRoutes.forEach(route => {
                if (typeof route === 'string') {
                  ssgRoutes.push(makeRoute(pageRoute, route, headers));
                } else if (Array.isArray(route.params)) {
                  route.params.forEach(param => {
                    ssgRoutes.push(
                      makeRoute(
                        pageRoute,
                        { ...route, url: generatePath(route.url, param) },
                        headers,
                      ),
                    );
                  });
                } else {
                  ssgRoutes.push(makeRoute(pageRoute, route, headers));
                }
              });
            } else {
              // otherwith add all except dynamic routes
              agreedRoutes
                .filter(route => !preventDefault.includes(route.path))
                .forEach(route => {
                  if (!isDynamicUrl(route.path)) {
                    ssgRoutes.push(makeRoute(pageRoute, route.path, headers));
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
          api,
          ssgRoutes,
          pageRoutes,
          apiRoutes,
          resolvedConfig,
          appDirectory,
        );

        // write to dist file
        writeHtmlFile(htmlAry, ssgRoutes, buildDir);

        // format route info, side effect
        replaceRoute(ssgRoutes, pageRoutes);

        // write routes to spec file
        writeJSONSpec(buildDir, pageRoutes.concat(apiRoutes));

        logger.info('ssg Compiled successfully');
      },
    };
  },
});
