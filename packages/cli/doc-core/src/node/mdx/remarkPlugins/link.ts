import path from 'path';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';
import { normalizeHref, parseUrl } from '@/shared/utils';

interface LinkNode {
  type: string;
  url?: string;
}

/**
 * Remark plugin to normalize a link href
 */
export const remarkPluginNormalizeLink: Plugin<
  [{ base: string; defaultLang: string }]
> =
  ({ base, defaultLang }) =>
  tree => {
    visit(
      tree,
      (node: LinkNode) => node.type === 'link',
      (node: LinkNode) => {
        if (
          !node.url ||
          node.url.startsWith('http') ||
          node.url.startsWith('#')
        ) {
          return;
        }
        // eslint-disable-next-line prefer-const
        let { url, hash } = parseUrl(node.url);
        const extname = path.extname(url);

        if (extname === '.md' || extname === '.mdx') {
          url = url.replace(extname, '');
        }
        if (hash) {
          url += `#${hash}`;
        }
        url = normalizeHref(url).replace(new RegExp(`^/${defaultLang}`), '');
        node.url = path.join(base, url);
      },
    );
  };
