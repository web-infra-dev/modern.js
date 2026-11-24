import path from 'node:path';
import { createRsbuild, type RsbuildConfig } from '@rsbuild/core';
import type { moduleFederationPlugin } from '@module-federation/sdk';
import { SERVICE_RUNTIME_PLUGINS_FILE } from '../servicePath';
import type { FederationAPI } from '../types/cli';
import { isDev } from './utils';

type RuntimePlugins = NonNullable<
  moduleFederationPlugin.ModuleFederationPluginOptions['runtimePlugins']
>;

/** Bundle the user's plugin module graph, not Modern's automatically added plugins. */
export async function buildServiceRuntimePlugins(options: {
  appDirectory: string;
  distDirectory: string;
  plugins: RuntimePlugins;
  alias?: NonNullable<RsbuildConfig['resolve']>['alias'];
  development?: boolean;
}) {
  const imports: string[] = [];
  const factories = options.plugins.map((entry, index) => {
    const [request, config] =
      typeof entry === 'string' ? [entry, undefined] : entry;
    const specifier = request.startsWith('.')
      ? path.resolve(options.appDirectory, request)
      : request;
    imports.push(`import factory${index} from ${JSON.stringify(specifier)};`);
    return `factory${index}(${JSON.stringify(config) ?? ''})`;
  });
  const source = `${imports.join('\n')}\nexport default () => [${factories.join(',')}];`;
  const build = await createRsbuild({
    cwd: options.appDirectory,
    rsbuildConfig: {
      mode: options.development ? 'development' : 'production',
      source: {
        entry: {
          runtime: `data:text/javascript,${encodeURIComponent(source)}`,
        },
      },
      resolve: { alias: options.alias },
      output: {
        target: 'node',
        distPath: {
          root: path.join(
            options.distDirectory,
            path.dirname(SERVICE_RUNTIME_PLUGINS_FILE),
          ),
          js: '',
        },
        filename: { js: 'runtime.cjs' },
        minify: false,
        sourceMap: false,
        cleanDistPath: true,
      },
      performance: { printFileSize: false },
      tools: {
        rspack(config) {
          config.output ||= {};
          config.output.library = { type: 'commonjs2' };
          config.output.chunkFilename = '[id].[contenthash:8].cjs';
          config.optimization = {
            ...config.optimization,
            splitChunks: false,
            runtimeChunk: false,
          };
          // Plugins that use MF APIs must share the server's runtime globals.
          config.externals = [
            /^@module-federation\/(?:enhanced(?:\/runtime)?|runtime(?:-core)?|sdk)$/,
          ];
          return config;
        },
      },
    },
  });
  await build.build();
}

export function configureServiceRuntimePlugins(
  api: FederationAPI,
  plugins: RuntimePlugins | undefined,
) {
  if (!plugins?.length) return undefined;
  let pending = Promise.resolve();
  const rebuild = () => {
    const next = pending
      .catch(() => {})
      .then(() => {
        const { appDirectory, distDirectory } = api.getAppContext();
        const config = api.getConfig();
        return buildServiceRuntimePlugins({
          appDirectory,
          distDirectory,
          plugins,
          development: isDev(),
          alias: ([] as unknown[])
            .concat(config.source?.alias ?? [])
            .concat(config.resolve?.alias ?? []) as Parameters<
            typeof buildServiceRuntimePlugins
          >[0]['alias'],
        });
      });
    pending = next;
    return next;
  };
  const builds = new WeakMap<object, Promise<void>>();
  const buildForCompilation = (compilation: object) => {
    let built = builds.get(compilation);
    if (!built) {
      built = rebuild();
      builds.set(compilation, built);
    }
    return built;
  };
  // CSR-only Hosts have no Node page bundle. This private build is independent.
  api.onAfterBuild(async () => {
    if (!isDev()) await rebuild();
  });
  api.onDevCompileDone(async ({ stats }) => {
    if (isDev() && !stats.hasErrors()) await buildForCompilation(stats);
  });
  // Dev starts its server plugins before the first page compilation completes.
  api._internalServerPlugins(async ({ plugins: serverPlugins }) => {
    if (isDev()) await rebuild();
    return { plugins: serverPlugins };
  });
  return {
    filename: SERVICE_RUNTIME_PLUGINS_FILE,
    ...(isDev() && {
      // Manifest publication and this hook share the same compilation barrier,
      // regardless of their registration order.
      waitForBuild: (compilation?: object) =>
        compilation ? buildForCompilation(compilation) : pending,
    }),
  };
}
