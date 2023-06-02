import { join } from 'path';
import fs from '@modern-js/utils/fs-extra';
import { visit } from 'unist-util-visit';

import type { RouteMeta } from '@modern-js/doc-core';
import type { Plugin } from 'unified';
import type { Root } from 'mdast';
import type { MdxjsEsm } from 'mdast-util-mdxjs-esm';
import { demoRoutes } from '.';

/**
 * remark plugin to transform code to demo
 */
export const remarkCodeToDemo: Plugin<
  [{ isMobile: boolean; getRouteMeta: () => RouteMeta[] }],
  Root
> = ({ isMobile, getRouteMeta }) => {
  return (tree, vfile) => {
    const demos: MdxjsEsm[] = [];
    const hasImportContainer = false;
    let index = 1;
    visit(tree, 'code', node => {
      // hasVisited is a custom property
      if ('hasVisited' in node) {
        return;
      }
      !hasImportContainer &&
        demos.push(
          getASTNodeImport(
            `Container`,
            join(__dirname, '..', 'dist/container.js'),
          ),
        );

      if (node.lang === 'jsx' || node.lang === 'tsx') {
        const { value } = node;
        const isPure = node?.meta?.includes('pure');
        // not transform pure code
        if (isPure) {
          return;
        }
        const routeMeta = getRouteMeta();
        const { pageName } = routeMeta.find(
          meta => meta.absolutePath === vfile.path,
        )!;
        const id = `${toValidVarName(pageName)}_${index++}`;
        const demoDir = join(
          process.cwd(),
          'node_modules',
          '.modern-doc',
          `virtual-demo`,
        );
        const virtualModulePath = join(demoDir, `${id}.tsx`);
        if (!isMobile) {
          // only need to write in web mode, in mobile mode, it has been written by addPage.
          fs.ensureDirSync(join(demoDir));
          fs.writeFileSync(virtualModulePath, value);
        }
        demos.push(getASTNodeImport(`Demo${id}`, virtualModulePath));
        const demoRoute = `/~demo/${id}`;
        demoRoutes.push({
          path: demoRoute,
        });
        Object.assign(node, {
          type: 'mdxJsxFlowElement',
          name: 'Container',
          attributes: [
            {
              type: 'mdxJsxAttribute',
              name: 'isMobile',
              value: isMobile,
            },
            {
              type: 'mdxJsxAttribute',
              name: 'url',
              value: demoRoute,
            },
          ],
          children: [
            {
              // if lang not change, this node will be visited again and again
              ...node,
              hasVisited: true,
            },
            {
              type: 'mdxJsxFlowElement',
              name: `Demo${id}`,
            },
          ],
        });
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

/**
 * Converts a string to a valid variable name. If the string is already a valid variable name, returns the original string.
 * @param str - The string to convert.
 * @returns The converted string.
 */
export const toValidVarName = (str: string): string => {
  // Check if the string is a valid variable name
  if (/^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(str)) {
    return str; // If it is a valid variable name, return the original string
  } else {
    // If it is not a valid variable name, convert it to a valid variable name
    return str.replace(/[^0-9a-zA-Z_$]/g, '_').replace(/^([0-9])/, '_$1');
  }
};
