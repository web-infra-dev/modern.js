import type { RsbuildPlugin, SourceConfig } from '@rsbuild/core';
import { isServerEnvironment } from '../utils';

const getAntdMajorVersion = (appDirectory: string) => {
  try {
    const pkgJsonPath = require.resolve('antd/package.json', {
      paths: [appDirectory],
    });

    const { version } = require(pkgJsonPath);
    return Number(version.split('.')[0]);
  } catch (err) {
    return null;
  }
};

export const pluginAntd = (
  imports?: SourceConfig['transformImport'] | false,
): RsbuildPlugin => ({
  name: 'uni-builder:antd',
  setup(api) {
    api.modifyEnvironmentConfig(
      (rsbuildConfig, { name, mergeEnvironmentConfig }) => {
        if (
          imports === false ||
          (Array.isArray(imports) &&
            imports?.some(
              item => typeof item === 'object' && item.libraryName === 'antd',
            ))
        ) {
          return;
        }

        const useServerEnvironment = isServerEnvironment(
          rsbuildConfig.output.target,
          name,
        );

        const antdMajorVersion = getAntdMajorVersion(api.context.rootPath);
        // antd >= v5 no longer need babel-plugin-import
        // see: https://ant.design/docs/react/migration-v5#remove-babel-plugin-import
        if (antdMajorVersion && antdMajorVersion < 5) {
          return mergeEnvironmentConfig(
            {
              source: {
                transformImport: [
                  {
                    libraryName: 'antd',
                    libraryDirectory: useServerEnvironment ? 'lib' : 'es',
                    style: true,
                  },
                ],
              },
            },
            rsbuildConfig,
          );
        }

        return rsbuildConfig;
      },
    );
  },
});
