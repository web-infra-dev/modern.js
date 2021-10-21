import {
  path,
  INTERNAL_SRC_ALIAS,
  logger,
  upath,
  PLUGIN_SCHEMAS,
} from '@modern-js/utils';
import {
  createPlugin,
  useAppContext,
  useResolvedConfigContext,
} from '@modern-js/core';
import { BabelChain } from '@modern-js/babel-chain';
import { LoaderManifest } from './manifest-op';
import {
  AgreedRoute,
  AgreedRouteMap,
  CreatePageListener,
  EntryPoint,
  ExtendOutputConfig,
  HookContext,
  SsgRoute,
} from './types';
import {
  formatOutput,
  getOutput,
  getSSGRenderLevel,
  getUrlPrefix,
  parsedSSGConfig,
  readJSONSpec,
  replaceWithAlias,
  writeJSONSpec,
} from './libs/util';
import { invoker } from './libs/invoker';
import { createServer } from './server';
import { writeHtmlFile } from './libs/output';
import { replaceRoute } from './libs/replace';

const listStaticFiles = (
  pwd: string,
  entriesDir: string,
  useSSG: string | boolean,
) => {
  const absEntriesDir = path.join(pwd, entriesDir);

  const staticRenderLevel = getSSGRenderLevel(useSSG);

  const staticFiles = new LoaderManifest().get(
    absEntriesDir,
    staticRenderLevel,
  );

  // 将绝对路径转换成 alias，因为获取到的约定路由也是使用别名的
  const staticAlias = staticFiles.map(filepath =>
    replaceWithAlias(path.join(pwd, 'src'), filepath, INTERNAL_SRC_ALIAS),
  );
  return staticAlias;
};

export default createPlugin(
  (() => {
    const agreedRouteMap: AgreedRouteMap = {};

    return {
      config() {
        return {
          tools: {
            babel(config: any, { chain }: { chain: BabelChain }) {
              chain.plugin('./loader').use(upath.normalizeSafe(require.resolve('./loader')));
            },
          },
        };
      },
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
      // eslint-disable-next-line max-statements
      async afterBuild() {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const resolvedConfig = useResolvedConfigContext();
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const appContext = useAppContext();

        const { appDirectory } = appContext;
        const {
          output,
          server: { baseUrl },
          source: { entriesDir },
        } = resolvedConfig;
        const { ssg, path: outputPath } = output as typeof output &
          ExtendOutputConfig;

        const ssgOptions = Array.isArray(ssg) ? ssg.pop() : ssg;
        // no ssg configuration, skip ssg render.
        if (!ssgOptions) {
          return;
        }

        const { useSSG, userHook } = parsedSSGConfig(ssgOptions);
        const buildDir = path.join(appDirectory, outputPath as string);
        const routes = readJSONSpec(buildDir);
        const staticAlias = listStaticFiles(appDirectory, entriesDir!, useSSG);

        // filter all routes not web
        const pageRoutes = routes.filter(route => !route.isApi);
        const apiRoutes = routes.filter(route => route.isApi);

        // if no web page route, skip ssg render
        if (pageRoutes.length === 0) {
          return;
        }

        const ssgRoutes: SsgRoute[] = [];

        // callback of context.createPage, to format output, collect page route
        const listener: CreatePageListener = (
          route: SsgRoute,
          agreed?: boolean,
        ) => {
          const urlPrefix = getUrlPrefix(route, baseUrl!);
          const ssgOutput = getOutput(route, urlPrefix, agreed);
          route.output = formatOutput(route.entryPath, ssgOutput);
          ssgRoutes.push(route);
        };

        // check if every allowed agreed route was collected
        const autoAddAgreed = (
          context: HookContext & {
            component: string;
          },
        ) => {
          // if not exist in allowed list, return false
          if (!staticAlias.includes(context.component)) {
            return false;
          }
          // if allowed, return collection state
          return !ssgRoutes.some(
            ssgRoute => ssgRoute.urlPath === context.route.path,
          );
        };

        await invoker(
          pageRoutes,
          agreedRouteMap,
          userHook,
          autoAddAgreed,
          listener,
        );

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
                `ssg can not using with ssr，url - ${ssgRoute.urlPath}, entry - ${ssgRoute.entryName} `,
              );
            }

            logger.warn(
              `new ssg route ${ssgRoute.urlPath} is using ssr now，maybe from parent route ${ssgRoute.entryName}，close ssr`,
            );
          }
          ssgRoute.isSSR = false;
        });

        const htmlAry = await createServer(
          ssgRoutes,
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
  }) as any,
  { name: '@modern-js/plugin-ssg' },
) as any;
