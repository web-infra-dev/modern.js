import path from 'path';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';
import { addLeadingSlash, normalizeHref, parseUrl } from '@/shared/utils';

interface LinkNode {
  type: string;
  url?: string;
}

export function extractLangFromFilePath(filePath: string, root: string) {
  const relativePath = path.relative(root, filePath);
  const [lang] = relativePath.split(path.sep);
  return lang;
}

export function normalizeLangPrefix(
  rawUrl: string,
  lang: string,
  defaultLang: string,
) {
  const url = addLeadingSlash(rawUrl);
  if (url.startsWith(`/${lang}/`) || lang === defaultLang) {
    return url;
  }
  return `/${lang}${url}`;
}

/**
 * Remark plugin to normalize a link href
 */
export const remarkPluginNormalizeLink: Plugin<
  [{ base: string; defaultLang: string; root: string }]
> =
  ({ base, defaultLang, root }) =>
  (tree, file) => {
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

        const lang = extractLangFromFilePath(file.path, root);
        url = normalizeLangPrefix(normalizeHref(url), lang, defaultLang);

        if (hash) {
          url += `#${hash}`;
        }
        node.url = path.join(base, url);
      },
    );
  };
