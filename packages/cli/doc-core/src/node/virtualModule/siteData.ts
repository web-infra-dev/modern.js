import { join } from 'path';
import { SiteData, UserConfig } from 'shared/types';
import VirtualModulesPlugin from 'webpack-virtual-modules';
import { PACKAGE_ROOT } from '../constants';

export function createSiteDataVirtualModulePlugin(
  userRoot: string,
  config: UserConfig,
) {
  const entryPath = join(PACKAGE_ROOT, 'node_modules', 'virtual-site-data');
  const userConfig = config.doc;
  const siteData: SiteData = {
    title: userConfig?.title || 'Doc Tools',
    description: userConfig?.description || '',
    icon: userConfig?.icon || '',
    themeConfig: userConfig?.themeConfig || {},
    base: userConfig?.base || '/',
    root: userRoot,
    lang: userConfig?.lang || 'zh',
    logo: userConfig?.logo || '',
  };
  const plugin = new VirtualModulesPlugin({
    [entryPath]: `export default ${JSON.stringify(siteData)}`,
  });
  return plugin;
}
