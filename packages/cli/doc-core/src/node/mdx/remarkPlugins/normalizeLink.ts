import path from 'path';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';
import fs from '@modern-js/utils/fs-extra';
import type { Root } from 'mdast';
import type { MdxjsEsm } from 'mdast-util-mdxjs-esm';
import {
  addLeadingSlash,
  normalizeHref,
  parseUrl,
  isExternalUrl,
} from '@/shared/utils';
import { PUBLIC_DIR } from '@/node/constants';
import { getASTNodeImport } from '@/node/utils/getASTNodeImport';

interface LinkNode {
  type: string;
  url?: string;
}

export function extractLangFromFilePath(filePath: string) {
  const [lang] = filePath.split(path.sep);
  return lang;
}

export function normalizeLangPrefix(
  rawUrl: string,
  lang: string,
  defaultLang: string,
) {
  // If the doc needs i18n, then the defaultLang must be not empty
  // So if the defaultLang is empty, we can ignore the lang prefix
  if (!defaultLang) {
    return rawUrl;
  }
  const url = addLeadingSlash(rawUrl);
  const hasLangPrefix = url.startsWith(`/${lang}/`);

  // If the url has a default lang prefix, then remove the lang prefix
  if (hasLangPrefix && lang === defaultLang) {
    return url.replace(`/${lang}`, '');
  }

  if (hasLangPrefix || lang === defaultLang) {
    return url;
  }

  return `/${lang}${url}`;
}

/**
 * Remark plugin to normalize a link href
 */
export const remarkPluginNormalizeLink: Plugin<
  [{ base: string; defaultLang: string; root: string }],
  Root
> =
  ({ base, defaultLang, root }) =>
  (tree, file) => {
    const images: MdxjsEsm[] = [];
    visit(
      tree,
      (node: LinkNode) => node.type === 'link',
      (node: LinkNode) => {
        if (!node.url) {
          return;
        }
        if (node.url.startsWith('#')) {
          node.url = `#${node.url.slice(1)}`;
          return;
        }

        // eslint-disable-next-line prefer-const
        let { url, hash } = parseUrl(node.url);

        if (isExternalUrl(url)) {
          node.url = url + (hash ? `#${hash}` : '');
          return;
        }

        const extname = path.extname(url);

        if (extname === '.md' || extname === '.mdx') {
          url = url.replace(extname, '');
        }

        const relativePath = path.relative(root, file.path);
        if (url.startsWith('.')) {
          url = path.join(path.dirname(relativePath), url);
        }

        const lang = extractLangFromFilePath(relativePath);
        url = normalizeLangPrefix(normalizeHref(url), lang, defaultLang);

        if (hash) {
          url += `#${hash}`;
        }
        node.url = path.posix.join(base, url);
      },
    );

    const normalizeImageUrl = (imageUrl: string): string | undefined => {
      if (imageUrl.startsWith('/')) {
        const publicDir = path.join(root, PUBLIC_DIR);
        const imagePath = path.join(publicDir, imageUrl);
        if (!fs.existsSync(imagePath)) {
          console.error(`Image not found: ${imagePath}`);
          return;
        }
        // eslint-disable-next-line consistent-return
        return imagePath;
      }
    };

    const getMdxSrcAttrbute = (tempVar: string) => {
      return {
        type: 'mdxJsxAttribute',
        name: 'src',
        value: {
          type: 'mdxJsxAttributeValueExpression',
          value: tempVar,
          data: {
            estree: {
              type: 'Program',
              sourceType: 'module',
              body: [
                {
                  type: 'ExpressionStatement',
                  expression: {
                    type: 'Identifier',
                    name: tempVar,
                  },
                },
              ],
            },
          },
        },
      };
    };

    visit(tree, 'image', node => {
      const { url } = node;
      if (!url) {
        return;
      }
      if (isExternalUrl(url)) {
        return;
      }

      const imagePath = normalizeImageUrl(url);
      if (!imagePath) {
        return;
      }
      // relative path
      const tempVariableName = `image${images.length}`;

      Object.assign(node, {
        type: 'mdxJsxFlowElement',
        name: 'img',
        children: [],
        attributes: [
          node.alt && {
            type: 'mdxJsxAttribute',
            name: 'alt',
            value: node.alt,
          },
          getMdxSrcAttrbute(tempVariableName),
        ].filter(Boolean),
      });

      images.push(getASTNodeImport(tempVariableName, imagePath));
    });

    visit(tree, ['mdxJsxFlowElement', 'mdxJsxTextElement'], (node: any) => {
      // get all img src
      if (node.name !== 'img') {
        return;
      }

      const src = node.attributes.find((attr: any) => attr.name === 'src');

      if (!src?.value || typeof src?.value !== 'string') {
        return;
      }

      const imagePath = normalizeImageUrl(src.value);

      if (!imagePath) {
        return;
      }

      const tempVariableName = `image${images.length}`;

      Object.assign(src, getMdxSrcAttrbute(tempVariableName));

      images.push(getASTNodeImport(tempVariableName, imagePath));
    });

    tree.children.unshift(...images);
  };
