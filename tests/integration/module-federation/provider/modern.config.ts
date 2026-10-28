import { appTools, defineConfig } from '@modern-js/app-tools';
import { port, origin } from '../ports';
const name = process.env.MF_LAB_VERSION === 'v2' ? 'providerV2' : 'provider';
export default defineConfig({
  html: { title: 'Federation lab · SSR & data fetching' },
  server: {
    tsconfigPath: './tsconfig.server.json',
    port: port(name, 4301),
    ssr: process.env.MF_LAB_VERSION === 'v2' ? false : { mode: 'stream' },
  },
  output: {
    dataUriLimit: 0,
    distPath: {
      root: process.env.MF_LAB_VERSION === 'v2' ? 'dist-v2' : 'dist',
    },
    assetPrefix: `${origin(name, 4301)}/`,
  },
  dev: { assetPrefix: `${origin(name, 4301)}/`, lazyCompilation: false },
  source: {
    globalVars: {
      'process.env.MF_LAB_API': origin('api', 4306),
      'process.env.MF_LAB_VERSION': process.env.MF_LAB_VERSION || 'v1',
    },
  },
  tools: {
    svgr: false,
    rspack: (config, { rspack }) => {
      config.output = {
        ...config.output,
        uniqueName: `mf-lab-provider-${process.env.MF_LAB_VERSION || 'v1'}`,
        chunkLoadingGlobal: `mf_lab_provider_${process.env.MF_LAB_VERSION || 'v1'}`,
      };
      config.plugins ||= [];
      config.plugins.push({
        apply(compiler: InstanceType<typeof rspack.Compiler>) {
          compiler.hooks.thisCompilation.tap(
            'RouteScopeEvidence',
            compilation => {
              compilation.hooks.processAssets.tap(
                {
                  name: 'RouteScopeEvidence',
                  stage: rspack.Compilation.PROCESS_ASSETS_STAGE_REPORT,
                },
                () => {
                  const roots = [...compilation.modules].filter(module =>
                    /src[/\\]exports[/\\](Weather|Product|Orders)App\.tsx\?modern-mf-root/.test(
                      module.identifier(),
                    ),
                  );
                  const graphs = Object.fromEntries(
                    roots.map(root => {
                      const visited = new Set<typeof root>();
                      const visit = (module: typeof root) => {
                        if (visited.has(module)) return;
                        visited.add(module);
                        for (const connection of compilation.moduleGraph.getOutgoingConnections(
                          module,
                        ))
                          if (connection.module) visit(connection.module);
                      };
                      visit(root);
                      return [
                        root
                          .identifier()
                          .match(/(Weather|Product|Orders)App/)![1],
                        [...visited].map(module => module.identifier()),
                      ];
                    }),
                  );
                  compilation.emitAsset(
                    'static/route-scope-graph.json',
                    new rspack.sources.RawSource(JSON.stringify(graphs)),
                  );
                },
              );
            },
          );
        },
      });
    },
  },
  performance: { buildCache: false },
  plugins: [appTools()],
});
