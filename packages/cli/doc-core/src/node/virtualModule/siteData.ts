import { join } from 'path';
import { UserConfig } from 'shared/types';
import VirtualModulesPlugin from 'webpack-virtual-modules';
import { PACKAGE_ROOT } from '../constants';

export async function createSiteDataVirtualModulePlugin(config: UserConfig) {
  const entryPath = join(PACKAGE_ROOT, 'node_modules', 'virtual-site-data');
  const plugin = new VirtualModulesPlugin({
    [entryPath]: `export default ${JSON.stringify(config.doc)}`,
  });
  return plugin;
}
