import * as path from 'path';
import {
  type Rspack,
  SERVICE_WORKER_ENVIRONMENT_NAME,
  isHtmlDisabled,
} from '@modern-js/builder';
import { fs, isUseRsc, isUseSSRBundle } from '@modern-js/utils';
import {
  type RsbuildPlugin,
  type RspackChain,
  mergeRsbuildConfig,
} from '@rsbuild/core';
import { getServerCombinedModueFile } from '../../../plugins/analyze/utils';
import type {
  AppNormalizedConfig,
  SSGMultiEntryOptions,
  ServerUserConfig,
} from '../../../types';
import { HtmlAsyncChunkPlugin, RouterPlugin } from '../bundlerPlugins';
import type { BuilderOptions } from '../types';

export const builderPluginAdapterSSR = (
  options: BuilderOptions,
): RsbuildPlugin => ({
  name: 'builder-plugin-adapter-modern-ssr',

  setup(api) {
    const { normalizedConfig } = options;
    api.modifyRsbuildConfig(config => {
      return mergeRsbuildConfig(config, {
        html: {
          inject: isStreamingSSR(normalizedConfig) ? 'head' : undefined,
        },
        server: {
          // the http-compression can't handler stream http.
          // so we disable compress when user use stream ssr temporarily.
          compress:
            isStreamingSSR(normalizedConfig) || isUseRsc(normalizedConfig)
              ? false
              : undefined,
        },
      });
    });

    api.modifyBundlerChain(
      async (
        chain,
        {
          target,
          isProd,
          HtmlPlugin: HtmlBundlerPlugin,
          isServer,
          environment,
        },
      ) => {
        const builderConfig = environment.config;
        const { normalizedConfig } = options;

        applyRouterPlugin(
          chain,
          'route-plugin',
          options,
          HtmlBundlerPlugin as unknown as typeof Rspack.HtmlRspackPlugin,
        );

        const isServiceWorker =
          environment.name === SERVICE_WORKER_ENVIRONMENT_NAME;

        if (target === 'node' || isServiceWorker) {
          applyFilterEntriesBySSRConfig({
            isProd,
            chain,
            appNormalizedConfig: normalizedConfig,
          });
        }

        if (isUseSSRBundle(normalizedConfig) || isUseRsc(normalizedConfig)) {
          await applySSRLoaderEntry(chain, options, isServer);
          applySSRDataLoader(chain, options);
        }

        if (!isHtmlDisabled(builderConfig, target)) {
          applyAsyncChunkHtmlPlugin({
            chain,
            modernConfig: options.normalizedConfig,
            HtmlBundlerPlugin,
          });
        }
      },
    );
  },
});

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
  HtmlBundlerPlugin,
}: {
  chain: RspackChain;
  modernConfig: AppNormalizedConfig;
  HtmlBundlerPlugin: any;
}) {
  if (isStreamingSSR(modernConfig) || isUseRsc(modernConfig)) {
    chain
      .plugin('html-async-chunk')
      .use(HtmlAsyncChunkPlugin, [HtmlBundlerPlugin]);
  }
}

function applyRouterPlugin(
  chain: RspackChain,
  pluginName: string,
  options: Readonly<BuilderOptions>,
  HtmlBundlerPlugin: typeof Rspack.HtmlRspackPlugin,
) {
  const { appContext, normalizedConfig } = options;
  const { entrypoints } = appContext;
  const existNestedRoutes = entrypoints.some(
    entrypoint => entrypoint.nestedRoutesEntry,
  );

  const workerSSR = Boolean(normalizedConfig.deploy.worker?.ssr);

  const { enableInlineRouteManifests, disableInlineRouteManifests } =
    normalizedConfig.output;
  const inlineRouteManifests = disableInlineRouteManifests
    ? !disableInlineRouteManifests
    : enableInlineRouteManifests;

  if (existNestedRoutes || workerSSR) {
    chain.plugin(pluginName).use(RouterPlugin, [
      {
        HtmlBundlerPlugin,
        enableInlineRouteManifests: inlineRouteManifests!,
        staticJsDir: normalizedConfig.output?.distPath?.js,
        disableFilenameHash: normalizedConfig.output?.filenameHash === false,
        scriptLoading: normalizedConfig.html?.scriptLoading,
        nonce: normalizedConfig.security?.nonce,
      },
    ]);
  }
}

function applyFilterEntriesBySSRConfig({
  isProd,
  chain,
  appNormalizedConfig,
}: {
  isProd: boolean;
  chain: RspackChain;
  appNormalizedConfig: AppNormalizedConfig;
}) {
  const { server: serverConfig, output: outputConfig } = appNormalizedConfig;

  const entries = chain.entryPoints.entries();
  // if prod and ssg config is true or function
  if (
    isProd &&
    (outputConfig?.ssg === true || typeof outputConfig?.ssg === 'function')
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
  if (isProd && outputConfig?.ssgByEntries) {
    const { ssgByEntries } = outputConfig;
    entryNames.forEach(name => {
      if (ssgByEntries[name]) {
        ssgEntries.push(name);
      }
    });
  }

  const { ssr, ssrByEntries } = serverConfig || {};
  entryNames.forEach(name => {
    if (
      !serverConfig?.rsc &&
      !ssgEntries.includes(name) &&
      !name.includes('server-loaders') &&
      ((ssr && ssrByEntries?.[name] === false) ||
        (!ssr && !ssrByEntries?.[name]))
    ) {
      chain.entryPoints.delete(name);
    }
  });
}

async function applySSRLoaderEntry(
  chain: RspackChain,
  optinos: BuilderOptions,
  isServer: boolean,
) {
  const { appContext } = optinos;
  const { internalDirectory } = appContext;
  const { entrypoints } = appContext;

  await Promise.all(
    entrypoints.map(async entrypoint => {
      const { entryName } = entrypoint;
      const serverLoadersFile = getServerCombinedModueFile(
        internalDirectory,
        entryName,
      );
      // the Rspack is not support virtualModule
      // so we write the combinedModule in filesystem;
      // then we load it from disk;
      if (isServer) {
        // docs: https://nodejs.org/docs/latest-v16.x/api/fs.html#fsexistspath-callback
        // In node.js docs, fs.access() is recommended instead of fs.exists().
        // the one reason is is will occur a race condition, since other processes may change the file's state between the two calls.
        //
        // > Using fs.exists() to check for the existence of a file before calling fs.open(), fs.readFile(), or fs.writeFile() is not recommended.
        // > Doing so introduces a race condition, since other processes may change the file's state between the two calls.
        // > Instead, user code should open/read/write the file directly and handle the error raised if the file does not exist.
        try {
          await fs.access(serverLoadersFile, fs.constants.F_OK);
          // if here is not occur error, it's means the file exists.
          chain.entry(`${entryName}-server-loaders`).add(serverLoadersFile);
        } catch (err) {
          // ignore the error
        }
      }
    }),
  );
}

function applySSRDataLoader(chain: RspackChain, options: BuilderOptions) {
  const { normalizedConfig, appContext } = options;
  const { appDirectory } = appContext;

  const { entriesDir = './src' } = normalizedConfig.source;

  // Both match in Windows and Unix(Linux, Mac)
  // docs: https://github.com/webpack/webpack/issues/2073
  const absolutePath = path
    .resolve(appDirectory, entriesDir)
    .split(path.sep)
    .join('(\\\\|/)');

  const reg = new RegExp(
    `${absolutePath}.*\\.(loader|data|data.client)\\.[t|j]sx?$`,
  );

  chain.module
    .rule('ssr-data-loader')
    .test(reg)
    .use('data-loader')
    .loader(require.resolve('@modern-js/plugin-data-loader/loader'))
    .end();
}
