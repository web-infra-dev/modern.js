import { getAntdMajorVersion } from '@modern-js/utils';
import type {
  BuilderTarget,
  DefaultBuilderPlugin,
} from '@modern-js/builder-shared';
import { SourceConfig as WebpackSourceConfig } from '@modern-js/builder-webpack-provider';
import { SourceConfig as RspackSourceConfig } from '@modern-js/builder-rspack-provider';

export const builderPluginAntd = (): DefaultBuilderPlugin => ({
  name: `builder-plugin-antd`,

  setup(api) {
    api.modifyBuilderConfig(builderConfig => {
      builderConfig.source ??= {};

      const { transformImport } = builderConfig.source as RspackSourceConfig &
        WebpackSourceConfig;

      if (
        transformImport === false ||
        transformImport?.some(item => item.libraryName === 'antd')
      ) {
        return;
      }

      const antdMajorVersion = getAntdMajorVersion(api.context.rootPath);
      // antd >= v5 no longer need babel-plugin-import
      // see: https://ant.design/docs/react/migration-v5#remove-babel-plugin-import
      if (antdMajorVersion && antdMajorVersion < 5) {
        (builderConfig.source as WebpackSourceConfig).transformImport = [
          ...(transformImport || []),
          {
            libraryName: 'antd',
            libraryDirectory: useSSR(api.context.target) ? 'lib' : 'es',
            style: true,
          },
        ];
      }
    });
  },
});

export function useSSR(target: BuilderTarget | BuilderTarget[]) {
  return (Array.isArray(target) ? target : [target]).some(item =>
    ['node', 'service-worker'].includes(item),
  );
}
