import { join } from 'path';
import { SiteData, UserConfig } from 'shared/types';
import VirtualModulesPlugin from 'webpack-virtual-modules';
import { remark } from 'remark';
import yamlFront from 'yaml-front-matter';
import type { Root } from 'hast';
import { parseToc } from '../mdx/remarkPlugins/toc';
import { PACKAGE_ROOT } from '../constants';
import { routeService } from './routeData';

export async function createSiteDataVirtualModulePlugin(
  userRoot: string,
  config: UserConfig,
) {
  const entryPath = join(PACKAGE_ROOT, 'node_modules', 'virtual-site-data');
  const { default: fs } = await import('@modern-js/utils/fs-extra');
  const userConfig = config.doc;
  const pages = await Promise.all(
    routeService.getRoutes().map(async route => {
      const content = await fs.readFile(route.absolutePath, 'utf8');
      // eslint-disable-next-line import/no-named-as-default-member
      const frontmatter = yamlFront.loadFront(content);
      const pureContent = frontmatter.__content;
      const ast = remark.parse({ value: pureContent });
      const { title, toc } = parseToc(ast as Root);
      return {
        title: frontmatter.title || title,
        routePath: route.routePath,
        toc,
        // Stripped frontmatter content
        content: pureContent,
        frontmatter: {
          ...frontmatter,
          __content: '',
        },
      };
    }),
  );
  const siteData: SiteData = {
    title: userConfig?.title || 'Doc Tools',
    description: userConfig?.description || '',
    icon: userConfig?.icon || '',
    themeConfig: userConfig?.themeConfig || {},
    base: userConfig?.base || '/',
    root: userRoot,
    lang: userConfig?.lang || 'zh',
    logo: userConfig?.logo || '',
    pages,
  };
  const plugin = new VirtualModulesPlugin({
    [entryPath]: `export default ${JSON.stringify(siteData)}`,
  });
  return plugin;
}
