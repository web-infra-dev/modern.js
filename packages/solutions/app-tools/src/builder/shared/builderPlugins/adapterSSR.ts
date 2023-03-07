import {
  BuilderPlugin,
  BundlerChain,
  mergeBuilderConfig,
} from '@modern-js/builder-shared';
import { ChainIdentifier } from '@modern-js/utils';
import type {
  AppNormalizedConfig,
  Bundler,
  ServerUserConfig,
  SSGMultiEntryOptions,
} from '../../../types';
import { HtmlAsyncChunkPlugin, RouterPlugin } from '../bundlerPlugins';
import type { BuilderOptions, BuilderPluginAPI } from '../types';
import { isHtmlEnabled } from './adapterHtml';

export const builderPluginAdapterSSR = <B extends Bundler>(
  options: BuilderOptions<B>,
): BuilderPlugin<BuilderPluginAPI> => ({
  name: 'builder-plugin-adapter-modern-ssr',

  setup(api) {
    const { normalizedConfig } = options;
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

    api.modifyBundlerChain(
      (chain, { target, CHAIN_ID, isProd, HtmlPlugin: HtmlBundlerPlugin }) => {
        const builderConfig = api.getNormalizedConfig();

        applyRouterPlugin(chain, options);

        if (['node', 'service-worker'].includes(target)) {
          applyFilterEntriesBySSRConfig({
            isProd,
            chain,
            appNormalizedConfig: options.normalizedConfig,
          });
        }

        if (isHtmlEnabled(builderConfig, target)) {
          applyAsyncChunkHtmlPlugin({
            chain,
            modernConfig: options.normalizedConfig,
            CHAIN_ID,
            HtmlBundlerPlugin,
          });
        }
      },
    );
  },
});

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

function applyAsyncChunkHtmlPlugin({
  chain,
  modernConfig,
  CHAIN_ID,
  HtmlBundlerPlugin,
}: {
  chain: BundlerChain;
  modernConfig: AppNormalizedConfig<'shared'>;
  CHAIN_ID: ChainIdentifier;
  HtmlBundlerPlugin: any;
}) {
  if (isStreamingSSR(modernConfig)) {
    chain
      .plugin(CHAIN_ID.PLUGIN.HTML_ASYNC_CHUNK)
      .use(HtmlAsyncChunkPlugin, [HtmlBundlerPlugin]);
  }
}

function applyRouterPlugin<B extends Bundler>(
  chain: BundlerChain,
  options: Readonly<BuilderOptions<B>>,
) {
  const { appContext, normalizedConfig } = options;
  const { entrypoints } = appContext;
  const existNestedRoutes = entrypoints.some(
    entrypoint => entrypoint.nestedRoutesEntry,
  );

  const routerConfig: any = normalizedConfig?.runtime?.router;
  const routerManifest = Boolean(routerConfig?.manifest);

  // for ssr mode
  if (existNestedRoutes || routerManifest) {
    chain.plugin('route-plugin').use(RouterPlugin);
  }
}

function applyFilterEntriesBySSRConfig({
  isProd,
  chain,
  appNormalizedConfig,
}: {
  isProd: boolean;
  chain: BundlerChain;
  appNormalizedConfig: AppNormalizedConfig<'shared'>;
}) {
  const { server: serverConfig, output: outputConfig } = appNormalizedConfig;

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
