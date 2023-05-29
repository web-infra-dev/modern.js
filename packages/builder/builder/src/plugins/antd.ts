import { getAntdMajorVersion } from '@modern-js/utils';
import type {
  BuilderTarget,
  DefaultBuilderPlugin,
} from '@modern-js/builder-shared';

export const builderPluginAntd = (): DefaultBuilderPlugin => ({
  name: `builder-plugin-antd`,

  setup(api) {
    api.modifyBuilderConfig(builderConfig => {
      builderConfig.source ??= {};

      if (
        builderConfig.source.transformImport === false ||
        builderConfig.source.transformImport?.some(
          item => item.libraryName === 'antd',
        )
      ) {
        return;
      }

      const antdMajorVersion = getAntdMajorVersion(api.context.rootPath);
      // antd >= v5 no longer need babel-plugin-import
      // see: https://ant.design/docs/react/migration-v5#remove-babel-plugin-import
      if (antdMajorVersion && antdMajorVersion < 5) {
        builderConfig.source ??= {};
        builderConfig.source.transformImport = [
          ...(builderConfig.source.transformImport || []),
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
