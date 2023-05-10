import { join } from 'path';
import { createHash as createHashFunc } from 'crypto';
import type { Plugin } from 'unified';
import type { Root } from 'mdast';
import { visit } from 'unist-util-visit';
import type { MdxjsEsm } from 'mdast-util-mdxjs-esm';
import { demoRuntimeModules } from '../runtimeModule';
import { PACKAGE_ROOT, PropsMarkdownMap } from '../constants';
import { ModuleDocgenLanguage } from '../types';

// FIXME: import type from third party package
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

function createHash(str: string) {
  return createHashFunc('sha256').update(str).digest('hex').slice(0, 8);
}

/**
 * remark plugin to transform code to jsx
 */
export const remarkTsxToReact: Plugin<
  [{ appDir: string; defaultLang: ModuleDocgenLanguage }],
  Root
> = ({ appDir, defaultLang }) => {
  return tree => {
    const demos: MdxjsEsm[] = [];
    let hasImportCodeContainer = false;
    visit(tree, 'code', node => {
      // hasVisited is a custom property
      if ('hasVisited' in node) {
        return;
      }
      !hasImportCodeContainer &&
        demos.push(
          getASTNodeImport(
            `CodeContainer`,
            join(PACKAGE_ROOT, 'dist/codeContainer.js'),
          ),
        );
      hasImportCodeContainer = true;
      if (node.lang === 'jsx' || node.lang === 'tsx') {
        const code = node.value;
        const isPure = node?.meta?.includes('pure');
        if (isPure) {
          // not transform pure code
          return;
        }
        const codeHash = createHash(code);
        const virtualModulePath = join(
          appDir,
          'node_modules',
          '.modern-doc',
          `virtual-demo${codeHash}.tsx`,
        );
        demoRuntimeModules.writeModule(virtualModulePath, code);
        demos.push(getASTNodeImport(`Demo${codeHash}`, virtualModulePath));
        Object.assign(node, {
          type: 'mdxJsxFlowElement',
          name: 'CodeContainer',
          children: [
            {
              type: 'mdxJsxFlowElement',
              name: `Demo${codeHash}`,
            },
            {
              // if lang not change, this node will be visited again and again
              ...node,
              hasVisited: true,
            },
          ],
        });
      }
    });
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
