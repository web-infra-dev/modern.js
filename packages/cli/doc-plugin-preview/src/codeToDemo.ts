import { basename, join } from 'path';
import type { Plugin } from 'unified';
import type { Root } from 'mdast';
import { visit } from 'unist-util-visit';
import type { MdxjsEsm } from 'mdast-util-mdxjs-esm';

/**
 * remark plugin to transform code to jsx
 */
export const remarkCodeToDemo: Plugin<[{ isMobile: boolean }], Root> = ({
  isMobile,
}) => {
  return (tree, vfile) => {
    const demos: MdxjsEsm[] = [];
    const hasImportCodeContainer = false;
    let index = 1;
    visit(tree, 'code', node => {
      // hasVisited is a custom property
      if ('hasVisited' in node) {
        return;
      }
      !hasImportCodeContainer &&
        demos.push(
          getASTNodeImport(
            `CodeContainer`,
            join(__dirname, '..', 'dist/codeContainer.js'),
          ),
        ) &&
        demos.push(
          getASTNodeImport(`Preview`, join(__dirname, '..', 'dist/preview.js')),
        );
      if (node.lang === 'jsx' || node.lang === 'tsx') {
        // const code = node.value;
        const isPure = node?.meta?.includes('pure');
        if (isPure) {
          // not transform pure code
          return;
        }
        // FIXME: fix id when support i18n
        const id = `${basename(vfile.path)}${index++}`;
        Object.assign(node, {
          type: 'mdxJsxFlowElement',
          name: 'CodeContainer',
          isMobile,
          children: [
            {
              type: 'mdxJsxFlowElement',
              name: `Preview`,
              attributes: {
                name: 'url',
                value: `/~demo/${id}`,
              },
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
