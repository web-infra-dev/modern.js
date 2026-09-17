import { applyBaseConfig } from '../../../../utils/applyBaseConfig';

export default applyBaseConfig({
  builderPlugins: [
    {
      name: 'test:chunk-loading-global',
      setup(api) {
        api.modifyRspackConfig((config, { target }) => {
          if (target !== 'web') {
            return;
          }

          config.plugins ??= [];
          config.plugins.push({
            apply(compiler) {
              compiler.options.output.chunkLoadingGlobal =
                'modernJsLoadableChunks';
            },
          });
        });
      },
    },
  ],
  server: {
    ssr: {
      mode: 'string',
    },
  },
});
