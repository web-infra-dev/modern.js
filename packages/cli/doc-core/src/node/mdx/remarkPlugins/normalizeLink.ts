import path from 'path';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';
import fs from '@modern-js/utils/fs-extra';
import type { Root } from 'mdast';
import type { MdxjsEsm } from 'mdast-util-mdxjs-esm';
import { slug } from 'github-slugger';
import {
  addLeadingSlash,
  normalizeHref,
  parseUrl,
  externalLinkRE,
} from '@/shared/utils';
import { PUBLIC_DIR } from '@/node/constants';

interface LinkNode {
  type: string;
  url?: string;
}

// Construct import statement for AST
// Such as: import image1 from './test.png'
const getASTNodeImport = (name: string, from: string) =>
  ({
    type: 'mdxjsEsm',
    value: `import ${name} from "${from}"`,
    data: {
      estree: {
        type: 'Program',
        sourceType: 'module',
        body: [
          {
            type: 'ImportDeclaration',
            specifiers: [
              {
                type: 'ImportDefaultSpecifier',
                local: { type: 'Identifier', name },
              },
            ],
            source: {
              type: 'Literal',
              value: from,
              raw: `"${from}"`,
            },
          },
        ],
      },
    },
  } as MdxjsEsm);

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
          node.url = `#${slug(node.url.slice(1))}`;
          return;
        }

        // eslint-disable-next-line prefer-const
        let { url, hash } = parseUrl(node.url);

        if (externalLinkRE.test(url)) {
          node.url = url + (hash ? `#${slug(hash)}` : '');
          return;
        }

        const extname = path.extname(url);

        if (extname === '.md' || extname === '.mdx') {
          url = url.replace(extname, '');
        }

        const lang = extractLangFromFilePath(file.path, root);
        url = normalizeLangPrefix(normalizeHref(url), lang, defaultLang);

        if (hash) {
          url += `#${slug(hash)}`;
        }
        node.url = path.join(base, url);
      },
    );

    visit(tree, 'image', node => {
      const { url } = node;
      if (!url) {
        return;
      }
      if (externalLinkRE.test(url)) {
        return;
      }

      if (url.startsWith('/')) {
        const publicDir = path.join(root, PUBLIC_DIR);
        const imagePath = path.join(publicDir, url);
        if (!fs.existsSync(imagePath)) {
          console.error(`Image not found: ${imagePath}`);
          return;
        }
        node.url = imagePath;
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
          {
            type: 'mdxJsxAttribute',
            name: 'src',
            value: {
              type: 'mdxJsxAttributeValueExpression',
              value: tempVariableName,
              data: {
                estree: {
                  type: 'Program',
                  sourceType: 'module',
                  body: [
                    {
                      type: 'ExpressionStatement',
                      expression: {
                        type: 'Identifier',
                        name: tempVariableName,
                      },
                    },
                  ],
                },
              },
            },
          },
        ].filter(Boolean),
      });

      images.push(getASTNodeImport(tempVariableName, node.url));
    });

    tree.children.unshift(...images);
  };
