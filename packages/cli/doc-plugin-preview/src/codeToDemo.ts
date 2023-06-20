import { join } from 'path';
import fs from '@modern-js/utils/fs-extra';
import { visit } from 'unist-util-visit';

import type { RouteMeta } from '@modern-js/doc-core';
import type { Plugin } from 'unified';
import type { Root } from 'mdast';
import type { MdxjsEsm } from 'mdast-util-mdxjs-esm';
import { toValidVarName } from './utils';
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
        fs.ensureDirSync(join(demoDir));
        // Only when the content of the file changes, the file will be written
        // Avoid to trigger the hmr indefinitely
        if (fs.existsSync(virtualModulePath)) {
          const content = fs.readFileSync(virtualModulePath, 'utf-8');
          if (content !== value) {
            fs.writeFileSync(virtualModulePath, value);
          }
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
