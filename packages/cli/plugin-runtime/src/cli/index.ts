import path from 'path';
import { createPlugin, usePlugins, useAppContext } from '@modern-js/core';
import { PLUGIN_SCHEMAS, createRuntimeExportsUtils } from '@modern-js/utils';

const useInternalDirectory = () => {
  try {
    return useAppContext().value.internalDirectory;
  } catch {
    return path.join(process.cwd(), 'node_modules/.modern-js');
  }
};

// eslint-disable-next-line react-hooks/rules-of-hooks
usePlugins([
  require.resolve('@modern-js/plugin-state/cli'),
  require.resolve('@modern-js/plugin-router/cli'),
  require.resolve('@modern-js/plugin-ssr/cli'),
]);

export default createPlugin(
  () => {
    let runtimeExportsUtils: ReturnType<typeof createRuntimeExportsUtils> =
      {} as any;

    return {
      config() {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const dir = useInternalDirectory();

        runtimeExportsUtils = createRuntimeExportsUtils(dir, 'index');

        return {
          runtime: {},
          runtimeByEntries: {},
          source: {
            alias: {
              '@modern-js/runtime$': runtimeExportsUtils.getPath(),
            },
          },
        };
      },
      validateSchema() {
        return PLUGIN_SCHEMAS['@modern-js/runtime'];
      },
      addRuntimeExports() {
        const runtimePackage = path.resolve(__dirname, '../../../../');

        runtimeExportsUtils.addExport(`export * from '${runtimePackage}'`);
      },
    };
  },
  {
    name: '@modern-js/runtime',
    post: [
      '@modern-js/plugin-router',
      '@modern-js/plugin-ssr',
      '@modern-js/plugin-state',
    ],
  },
) as any;
