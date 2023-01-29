import { join } from 'path';
import {
  BuilderPlugin,
  BuilderTarget,
  mergeBuilderConfig,
} from '@modern-js/builder-shared';
import type {
  WebpackChain,
  NormalizedConfig,
  BuilderPluginAPI,
} from '@modern-js/builder-webpack-provider';
import { template as lodashTemplate } from '@modern-js/utils/lodash';
import HtmlWebpackPlugin from '@modern-js/builder-webpack-provider/html-webpack-plugin';
import { getEntryOptions, ChainIdentifier } from '@modern-js/utils';
import { BuilderOptions, createCopyPattern } from '../../../shared';
import {
  HtmlAsyncChunkPlugin,
  BottomTemplatePlugin,
  RouterPlugin,
} from '../webpack';
import type {
  IAppContext,
  SSGMultiEntryOptions,
  ServerUserConfig,
  AppNormalizedConfig,
} from '@/types';

type Parameter<T extends (arg: any) => void> = Parameters<T>[0];
type FnParameter<
  T extends {
    [p: string]: (arg: any) => void;
  },
> = {
  [P in keyof T]: Parameter<T[P]>;
};

export type PluginCompatModernOptions = FnParameter<
  Partial<
    Pick<
      BuilderPluginAPI,
      | 'onAfterBuild'
      | 'onAfterCreateCompiler'
      | 'onAfterStartDevServer'
      | 'onBeforeBuild'
      | 'onBeforeCreateCompiler'
      | 'onBeforeStartDevServer'
      | 'onDevCompileDone'
      | 'onExit'
    >
  >
>;

/**
 * Provides default configuration consistent with modern.js v1
 */
export const PluginCompatModern = (
  options: BuilderOptions<'webpack'>,
): BuilderPlugin<BuilderPluginAPI> => ({
  name: 'builder-plugin-compat-modern',

  setup(api) {
    const { normalizedConfig: modernConfig, appContext } = options;
    api.modifyBuilderConfig(config => {
      if (isStreamingSSR(modernConfig)) {
        return mergeBuilderConfig(config, {
          html: {
            inject: 'body',
          },
        });
      }
      return config;
    });

    api.modifyWebpackChain((chain, { target, CHAIN_ID, isProd }) => {
      const builderNormalizedConfig = api.getNormalizedConfig();
      // set webpack config name
      if (target === 'node') {
        chain.name('server');
      } else if (target === 'modern-web') {
        chain.name('modern');
      } else {
        chain.name('client');
      }

      // compat modern-js v1
      chain.resolve.modules
        .add('node_modules')
        .add(join(api.context.rootPath, 'node_modules'));

      // apply node compat
      if (target === 'node') {
        applyNodeCompat(chain, modernConfig, isProd);
      }

      if (isHtmlEnabled(builderNormalizedConfig, target)) {
        applyBottomHtmlWebpackPlugin({
          api,
          chain,
          CHAIN_ID,
          appContext,
          modernConfig,
        });
        applyAsyncChunkHtmlPlugin({
          chain,
          CHAIN_ID,
          modernConfig,
        });
      }

      // apply copy plugin
      if (chain.plugins.has(CHAIN_ID.PLUGIN.COPY)) {
        const defaultCopyPattern = createCopyPattern(
          appContext,
          modernConfig,
          'public',
          chain,
        );
        chain.plugin(CHAIN_ID.PLUGIN.COPY).tap(args => [
          {
            patterns: [...(args[0]?.patterns || []), defaultCopyPattern],
          },
        ]);
      }

      const { entrypoints } = appContext;
      const existNestedRoutes = entrypoints.some(
        entrypoint => entrypoint.nestedRoutesEntry,
      );

      const routerConfig: any = modernConfig?.runtime?.router;
      const routerManifest = Boolean(routerConfig?.manifest);
      if (existNestedRoutes || routerManifest) {
        chain.plugin('route-plugin').use(RouterPlugin);
      }
      if (target !== 'node') {
        const bareServerModuleReg = /\.(server|node)\.[tj]sx?$/;
        chain.module.rule(CHAIN_ID.RULE.JS).exclude.add(bareServerModuleReg);
        chain.module
          .rule('bare-server-module')
          .test(bareServerModuleReg)
          .use('server-module-loader')
          .loader(require.resolve('../loaders/serverModuleLoader'));
      }

      function isHtmlEnabled(config: NormalizedConfig, target: BuilderTarget) {
        return (
          config.tools?.htmlPlugin !== false &&
          target !== 'node' &&
          target !== 'web-worker'
        );
      }
    });

    if (options) {
      applyCallbacks(api, options);
    }
  },
});

/**
 * register builder hooks callback
 */
function applyCallbacks(
  api: BuilderPluginAPI,
  options: PluginCompatModernOptions,
) {
  options.onAfterBuild && api.onAfterBuild(options.onAfterBuild);
  options.onAfterCreateCompiler &&
    api.onAfterCreateCompiler(options.onAfterCreateCompiler);
  options.onAfterStartDevServer &&
    api.onAfterStartDevServer(options.onAfterStartDevServer);
  options.onBeforeBuild && api.onBeforeBuild(options.onBeforeBuild);
  options.onBeforeCreateCompiler &&
    api.onBeforeCreateCompiler(options.onBeforeCreateCompiler);
  options.onBeforeStartDevServer &&
    api.onBeforeStartDevServer(options.onBeforeStartDevServer);
  options.onDevCompileDone && api.onDevCompileDone(options.onDevCompileDone);
  options.onExit && api.onExit(options.onExit);
}

/**
 * compat some config, if target is `node`
 */
function applyNodeCompat(
  chain: WebpackChain,
  modernConfig: AppNormalizedConfig,
  isProd: boolean,
) {
  // apply node resolve extensions
  for (const ext of [
    '.node.js',
    '.node.jsx',
    '.node.ts',
    '.node.tsx',
    '.server.js',
    '.server.ts',
    '.server.ts',
    '.server.tsx',
  ]) {
    chain.resolve.extensions.prepend(ext);
  }

  // apply filterEntriesBySSRConfig
  filterEntriesBySSRConfig(
    isProd,
    chain,
    modernConfig.server,
    modernConfig.output,
  );

  function filterEntriesBySSRConfig(
    isProd: boolean,
    chain: WebpackChain,
    serverConfig?: AppNormalizedConfig['server'],
    outputConfig?: AppNormalizedConfig['output'],
  ) {
    const entries = chain.entryPoints.entries();
    // if prod and ssg config is true or function
    if (
      isProd &&
      (outputConfig?.ssg === true ||
        typeof (outputConfig?.ssg as Array<unknown>)?.[0] === 'function')
    ) {
      return;
    }

    if (typeof entries === 'undefined') {
      throw new Error(
        'No entry found, one of src/routes/layout.tsx, src/App.tsx, src/index.tsx is required',
      );
    }

    // if single entry has ssg config
    // `ssg: {}` is not allowed if multi entry
    const entryNames = Object.keys(entries);
    if (isProd && entryNames.length === 1 && outputConfig?.ssg) {
      return;
    }

    // collect all ssg entries
    const ssgEntries: string[] = [];
    if (isProd && outputConfig?.ssg) {
      const { ssg } = outputConfig;
      entryNames.forEach(name => {
        if ((ssg as SSGMultiEntryOptions)[name]) {
          ssgEntries.push(name);
        }
      });
    }

    const { ssr, ssrByEntries } = serverConfig || {};
    entryNames.forEach(name => {
      if (
        !ssgEntries.includes(name) &&
        ((ssr && ssrByEntries?.[name] === false) ||
          (!ssr && !ssrByEntries?.[name]))
      ) {
        chain.entryPoints.delete(name);
      }
    });
  }
}

/**
 * inject bottom template
 */
function applyBottomHtmlWebpackPlugin({
  api,
  chain,
  modernConfig,
  appContext,
  CHAIN_ID,
}: {
  api: BuilderPluginAPI;
  chain: WebpackChain;
  modernConfig: AppNormalizedConfig;
  appContext: IAppContext;
  CHAIN_ID: ChainIdentifier;
}) {
  // inject bottomTemplate into html-webpack-plugin
  for (const entryName of Object.keys(api.context.entry)) {
    // FIXME: the only need necessary
    const baseTemplateParams = {
      entryName,
      title: getEntryOptions<string | undefined>(
        entryName,
        modernConfig.html.title,
        modernConfig.html.titleByEntries,
        appContext.packageName,
      ),
      mountId: modernConfig.html.mountId,
      ...getEntryOptions<any>(
        entryName,
        modernConfig.html.templateParameters,
        modernConfig.html.templateParametersByEntries,
        appContext.packageName,
      ),
    };
    chain.plugin(`${CHAIN_ID.PLUGIN.HTML}-${entryName}`).tap(args => [
      {
        ...(args[0] || {}),
        __internal__: true,
        bottomTemplate:
          appContext.htmlTemplates[`__${entryName}-bottom__`] &&
          lodashTemplate(appContext.htmlTemplates[`__${entryName}-bottom__`])(
            baseTemplateParams,
          ),
      },
    ]);
  }
  chain
    .plugin(CHAIN_ID.PLUGIN.BOTTOM_TEMPLATE)
    .use(BottomTemplatePlugin, [HtmlWebpackPlugin]);
}

const isStreamingSSR = (userConfig: AppNormalizedConfig): boolean => {
  const isStreaming = (ssr: ServerUserConfig['ssr']) =>
    ssr && typeof ssr === 'object' && ssr.mode === 'stream';

  const { server } = userConfig;

  if (isStreaming(server.ssr)) {
    return true;
  }

  // Since we cannot apply different plugins for different entries,
  // we regard the whole app as streaming ssr only if one entry meets the requirement.
  if (server?.ssrByEntries && typeof server.ssrByEntries === 'object') {
    for (const name of Object.keys(server.ssrByEntries)) {
      if (isStreaming(server.ssrByEntries[name])) {
        return true;
      }
    }
  }

  return false;
};

function applyAsyncChunkHtmlPlugin({
  chain,
  modernConfig,
  CHAIN_ID,
}: {
  chain: WebpackChain;
  modernConfig: AppNormalizedConfig;
  CHAIN_ID: ChainIdentifier;
}) {
  if (isStreamingSSR(modernConfig)) {
    chain
      .plugin(CHAIN_ID.PLUGIN.HTML_ASYNC_CHUNK)
      .use(HtmlAsyncChunkPlugin, [HtmlWebpackPlugin]);
  }
}
