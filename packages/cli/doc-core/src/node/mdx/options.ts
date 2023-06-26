import path from 'path';
import remarkGFM from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutoLink from 'rehype-autolink-headings';
import { Options } from '@mdx-js/loader';
import { UserConfig } from 'shared/types/index';
import { PluggableList } from 'unified';
import rehypePluginExternalLinks from 'rehype-external-links';
import { remarkPluginContainer } from '@modern-js/remark-container';
import type { RouteService } from '../route/RouteService';
import { remarkPluginToc } from './remarkPlugins/toc';
import { rehypePluginCodeMeta } from './rehypePlugins/codeMeta';
import { remarkPluginNormalizeLink } from './remarkPlugins/normalizeLink';
import { remarkCheckDeadLinks } from './remarkPlugins/checkDeadLink';
import { remarkBuiltin } from './remarkPlugins/builtin';

export async function createMDXOptions(
  docDirectory: string,
  config: UserConfig,
  checkDeadLinks: boolean,
  routeService: RouteService,
  filepath: string,
): Promise<Options> {
  const {
    remarkPlugins: remarkPluginsFromConfig = [],
    rehypePlugins: rehypePluginsFromConfig = [],
    globalComponents: globalComponentsFromConfig = [],
  } = config.doc?.markdown || {};
  const docPlugins = config.doc?.plugins || [];
  const remarkPluginsFromPlugins = docPlugins.flatMap(
    plugin => plugin.markdown?.remarkPlugins || [],
  ) as PluggableList;
  const rehypePluginsFromPlugins = docPlugins.flatMap(
    plugin => plugin.markdown?.rehypePlugins || [],
  ) as PluggableList;
  const globalComponents = [
    ...docPlugins.flatMap(plugin => plugin.markdown?.globalComponents || []),
    ...globalComponentsFromConfig,
  ];
  const defaultLang = config.doc?.lang || '';
  return {
    providerImportSource: '@mdx-js/react',
    jsx: true,
    format: path.extname(filepath).slice(1) as 'mdx' | 'md',
    remarkPlugins: [
      remarkPluginContainer,
      remarkGFM,
      remarkPluginToc,
      [
        remarkPluginNormalizeLink,
        {
          base: config.doc?.base || '',
          defaultLang,
          root: docDirectory,
        },
      ],
      checkDeadLinks && [
        remarkCheckDeadLinks,
        {
          root: docDirectory,
          base: config.doc?.base || '',
          routeService,
        },
      ],
      globalComponents.length && [
        remarkBuiltin,
        {
          globalComponents,
        },
      ],
      ...remarkPluginsFromConfig,
      ...remarkPluginsFromPlugins,
    ].filter(Boolean) as PluggableList,
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeAutoLink,
        {
          properties: {
            class: 'header-anchor',
            ariaHidden: 'true',
          },
          content: {
            type: 'text',
            value: '#',
          },
        },
      ],
      rehypePluginCodeMeta,
      [
        rehypePluginExternalLinks,
        {
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      ],
      ...rehypePluginsFromConfig,
      ...rehypePluginsFromPlugins,
    ],
  };
}
