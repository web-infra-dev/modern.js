import { createRuntimeExportsUtils, fs } from '@modern-js/utils';
/**
 * Determine if the `runtime` feature is on by the existence of the `node_module/.modern-js/plugins.js` file
 */
export const checkEnableRuntime = async (internalDirectory: string) => {
  const pluginsExportsUtils = createRuntimeExportsUtils(
    internalDirectory,
    'plugins',
  );
  const runtimePath = pluginsExportsUtils.getPath();
  return fs.pathExists(runtimePath);
};
