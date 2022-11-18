import { join } from 'path';
import {
  BuilderPlugin,
  BuilderTarget,
  mergeBuilderConfig,
} from '@modern-js/builder-shared';
import type {
  BuilderPluginAPI,
  WebpackChain,
} from '@modern-js/builder-webpack-provider';
import type { IAppContext, CliNormalizedConfig } from '@modern-js/core';
import { template as lodashTemplate } from '@modern-js/utils/lodash';
import HtmlWebpackPlugin from '@modern-js/builder-webpack-provider/html-webpack-plugin';
import { getEntryOptions, ChainIdentifier } from '@modern-js/utils';
import { BuilderConfig } from '@modern-js/builder-webpack-provider';
import {
  SSGMultiEntryOptions,
  LegacyAppTools,
  ServerUserConfig,
} from '../../types';
import { BottomTemplatePlugin } from '../webpackPlugins/htmlBottomTemplate';
import { HtmlAsyncChunkPlugin } from '../webpackPlugins/htmlAsyncChunkPlugin';
import { createCopyPattern } from '../share';
import RouterPlugin from '../webpackPlugins/routerPlugin';

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
 * Provides default configuration consistent with `@modern-js/webpack`
 */
export const PluginCompatModern = (
  appContext: IAppContext,
  modernConfig: CliNormalizedConfig<LegacyAppTools>,
  options?: PluginCompatModernOptions,
): BuilderPlugin<BuilderPluginAPI> => ({
  name: 'builder-plugin-compat-modern',

  setup(api) {
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
      // const copyPatterns = createCopyPatterns(chain, appContext, modernConfig);
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

      const { entrypoints } = appContext;
      const existNestedRoutes = entrypoints.some(
        entrypoint => entrypoint.nestedRoutesEntry,
      );
      chain.plugin('route-plugin').use(RouterPlugin, [
        {
          existNestedRoutes,
        },
      ]);

      function isHtmlEnabled(config: BuilderConfig, target: BuilderTarget) {
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
  modernConfig: CliNormalizedConfig<LegacyAppTools>,
  isProd: boolean,
) {
  // apply node resolve extensions
  for (const ext of ['.node.js', '.node.jsx', '.node.ts', '.node.tsx']) {
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
    serverConfig?: CliNormalizedConfig<LegacyAppTools>['server'],
    outputConfig?: CliNormalizedConfig<LegacyAppTools>['output'],
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
  modernConfig: CliNormalizedConfig<LegacyAppTools>;
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
        modernConfig.output.title,
        modernConfig.output.titleByEntries,
        appContext.packageName,
      ),
      mountId: modernConfig.output.mountId!,
      ...getEntryOptions<Record<string, unknown> | undefined>(
        entryName,
        modernConfig.output.templateParameters,
        modernConfig.output.templateParametersByEntries,
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

const isStreamingSSR = (
  userConfig: CliNormalizedConfig<LegacyAppTools>,
): boolean => {
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
  modernConfig: CliNormalizedConfig<LegacyAppTools>;
  CHAIN_ID: ChainIdentifier;
}) {
  if (isStreamingSSR(modernConfig)) {
    chain
      .plugin(CHAIN_ID.PLUGIN.HTML_ASYNC_CHUNK)
      .use(HtmlAsyncChunkPlugin, [HtmlWebpackPlugin]);
  }
}
