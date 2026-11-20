const name = 'weather_next_rsc';

export default {
  assetPrefix: process.env.NEXT_SERVICE_ASSET_ORIGIN || '',
  webpack(config, { isServer, webpack }) {
    if (!isServer) {
      config.module.rules.push({
        test: /service-client\.jsx$/,
        layer: 'app-pages-browser',
      });
      config.plugins.push({
        apply(compiler) {
          compiler.hooks.thisCompilation.tap('NextServiceRuntime', compilation => {
            compilation.hooks.additionalTreeRuntimeRequirements.tap(
              'NextServiceRuntime',
              (chunk, requirements) => {
                if (chunk.name === name) requirements.add(webpack.RuntimeGlobals.onChunksLoaded);
              },
            );
          });
        },
      }, new webpack.container.ModuleFederationPlugin({
        name,
        filename: 'static/service-remote.js',
        runtime: false,
        exposes: { './client': './service-client.jsx' },
        shared: {},
      }));
    }
    return config;
  },
};
