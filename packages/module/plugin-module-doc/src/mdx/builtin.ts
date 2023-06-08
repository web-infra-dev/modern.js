import { join } from 'path';
import type { Plugin } from 'unified';
import type { Root } from 'mdast';
import { visit } from 'unist-util-visit';
import type { MdxjsEsm } from 'mdast-util-mdxjs-esm';
import { PACKAGE_ROOT, PropsMarkdownMap } from '../constants';
import { ModuleDocgenLanguage } from '../types';

// FIXME: import type from third-party package
type MDXJsxFlowElement = {
  type: string;
  name: string;
  attributes: Array<MDXJsxAttribute>;
};
type MDXJsxAttribute = {
  type: string;
  name: string;

  // not right
  value: string;
};

/**
 * remark plugin to transform code to jsx
 */
export const remarkBuiltIn: Plugin<
  [{ _appDir: string; defaultLang: ModuleDocgenLanguage }],
  Root
> = ({ _appDir, defaultLang }) => {
  return tree => {
    const demos: MdxjsEsm[] = [];

    visit(tree, 'mdxJsxFlowElement', (node: MDXJsxFlowElement) => {
      if (node.name === 'API') {
        demos.push(getASTNodeImport(`API`, join(PACKAGE_ROOT, 'dist/api.js')));
        let lang = defaultLang;
        node.attributes.forEach(attr => {
          if (attr.name === 'zh' || attr.name === 'en') {
            lang = attr.name;
          }
        });
        const suffix = lang === defaultLang ? '' : `-${lang}`;
        node.attributes.forEach(attr => {
          if (attr.name === 'moduleName') {
            const { value } = attr;
            const str = PropsMarkdownMap.get(`${value}${suffix}`);
            attr.value = str ?? '';
          }
        });
      }
      if (node.name === 'Overview') {
        demos.push(
          getASTNodeImport(`Overview`, join(PACKAGE_ROOT, 'dist/overview.js')),
        );
      }
    });
    tree.children.unshift(...demos);
  };
};

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
