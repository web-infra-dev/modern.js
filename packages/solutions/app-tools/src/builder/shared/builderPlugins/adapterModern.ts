import {
  BuilderPlugin,
  mergeBuilderConfig,
  DefaultBuilderPluginAPI,
  BuilderTarget,
  BundlerChain,
} from '@modern-js/builder-shared';
import {
  BuilderConfig as RspackBuilderConfig,
  NormalizedConfig as RspackNormalizedConfig,
} from '@modern-js/builder-rspack-provider';
import {
  BuilderConfig as WebpackBuilderConfig,
  NormalizedConfig as WebpackNormalizedConfig,
} from '@modern-js/builder-webpack-provider';
import { ChainIdentifier, getEntryOptions } from '@modern-js/utils';
import HtmlWebpackPlugin from '@modern-js/builder-webpack-provider/html-webpack-plugin';
import { template as lodashTemplate } from '@modern-js/utils/lodash';
import type { BuilderOptions } from '../types';
import { HtmlAsyncChunkPlugin } from '../bundlerPlugins/HtmlAsyncChunkPlugin';
import { BottomTemplatePlugin } from '../bundlerPlugins/HtmlBottomTemplate';
import type {
  AppNormalizedConfig,
  Bundler,
  IAppContext,
  ServerUserConfig,
  SSGMultiEntryOptions,
} from '../../../types';

type BuilderConfig = RspackBuilderConfig | WebpackBuilderConfig;
type NormalizedConfig = RspackNormalizedConfig | WebpackNormalizedConfig;

const isStreamingSSR = (userConfig: AppNormalizedConfig<'shared'>): boolean => {
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

type BuilderPluginAPI = DefaultBuilderPluginAPI<
  BuilderConfig,
  NormalizedConfig
>;

export const builderPluginAdapterModern = <B extends Bundler>(
  options: BuilderOptions<B>,
): BuilderPlugin<BuilderPluginAPI> => ({
  name: 'builder-plugin-adapter-modern',

  setup(api) {
    const { normalizedConfig, appContext } = options;
    api.modifyBuilderConfig(config => {
      if (isStreamingSSR(normalizedConfig)) {
        return mergeBuilderConfig(config, {
          html: {
            inject: 'body',
          },
        });
      }
      return config;
    });

    api.modifyBundlerChain((chain, { target, CHAIN_ID, isProd }) => {
      const builderConfig = api.getNormalizedConfig();
      // set bundler config name
      if (target === 'node') {
        chain.name('server');
      } else if (target === 'web-worker') {
        chain.name('worker');
      } else if (target === 'modern-web') {
        chain.name('modern');
      } else {
        chain.name('client');
      }

      // apply node compat
      if (target === 'node' || target === 'web-worker') {
        applyNodeCompat(target, chain, normalizedConfig, isProd);
      }

      if (isHtmlEnabled(builderConfig, target)) {
        applyBottomHtmlPlugin({
          api,
          chain,
          modernConfig: normalizedConfig,
          appContext,
          CHAIN_ID,
        });

        applyAsyncChunkHtmlPlugin({
          chain,
          modernConfig: normalizedConfig,
          CHAIN_ID,
        });
      }

      if (target !== 'node' && target !== 'web-worker') {
        const bareServerModuleReg = /\.(server|node)\.[tj]sx?$/;
        chain.module.rule(CHAIN_ID.RULE.JS).exclude.add(bareServerModuleReg);
        chain.module
          .rule('bare-server-module')
          .test(bareServerModuleReg)
          .use('server-module-loader')
          .loader(require.resolve('../loaders/serverModuleLoader'));
      }
    });

    applyCallbacks(api, options);

    function isHtmlEnabled(config: NormalizedConfig, target: BuilderTarget) {
      return (
        config.tools?.htmlPlugin !== false &&
        target !== 'node' &&
        target !== 'web-worker'
      );
    }
  },
});

/** register builder hooks callback */
export function applyCallbacks<B extends Bundler>(
  api: BuilderPluginAPI,
  options: BuilderOptions<B>,
) {
  options.onAfterBuild && api.onAfterBuild(options.onAfterBuild);
  options.onAfterCreateCompiler &&
    api.onAfterCreateCompiler(options.onAfterCreateCompiler as any);
  options.onAfterStartDevServer &&
    api.onAfterStartDevServer(options.onAfterStartDevServer);
  options.onBeforeBuild && api.onBeforeBuild(options.onBeforeBuild as any);
  options.onBeforeCreateCompiler &&
    api.onBeforeCreateCompiler(options.onBeforeCreateCompiler as any);
  options.onBeforeStartDevServer &&
    api.onBeforeStartDevServer(options.onBeforeStartDevServer);
  options.onDevCompileDone && api.onDevCompileDone(options.onDevCompileDone);
  options.onExit && api.onExit(options.onExit);
}

/** inject bottom template */
function applyBottomHtmlPlugin({
  api,
  chain,
  modernConfig,
  appContext,
  CHAIN_ID,
}: {
  api: BuilderPluginAPI;
  chain: BundlerChain;
  modernConfig: AppNormalizedConfig<'shared'>;
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

function applyAsyncChunkHtmlPlugin({
  chain,
  modernConfig,
  CHAIN_ID,
}: {
  chain: BundlerChain;
  modernConfig: AppNormalizedConfig<'shared'>;
  CHAIN_ID: ChainIdentifier;
}) {
  if (isStreamingSSR(modernConfig)) {
    chain
      .plugin(CHAIN_ID.PLUGIN.HTML_ASYNC_CHUNK)
      .use(HtmlAsyncChunkPlugin, [HtmlWebpackPlugin]);
  }
}

/**
 * compat some config, if target is `node` or `worker`
 */
function applyNodeCompat(
  target: 'node' | 'web-worker',
  chain: BundlerChain,
  modernConfig: AppNormalizedConfig<'shared'>,
  isProd: boolean,
) {
  const exts = [
    '.node.js',
    '.node.jsx',
    '.node.ts',
    '.node.tsx',
    '.server.js',
    '.server.ts',
    '.server.ts',
    '.server.tsx',
  ];
  if (target === 'web-worker') {
    exts.unshift('.worker.js', '.worker.jsx', '.worker.ts', '.worker.tsx');
  }
  // apply node resolve extensions
  for (const ext of exts) {
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
    chain: BundlerChain,
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
