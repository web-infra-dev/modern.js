import { join } from 'path';
import { visit } from 'unist-util-visit';
import fs from '@modern-js/utils/fs-extra';
import type { RouteMeta } from '@modern-js/doc-core';
import type { Plugin } from 'unified';
import type { Root } from 'mdast';
import type { MdxjsEsm } from 'mdast-util-mdxjs-esm';
import { injectDemoBlockImport, toValidVarName } from './utils';
import { demoBlockComponentPath } from './constant';
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
    let index = 1;
    visit(tree, 'code', node => {
      // hasVisited is a custom property
      if ('hasVisited' in node) {
        return;
      }

      if (node.lang === 'jsx' || node.lang === 'tsx') {
        const value = injectDemoBlockImport(node.value, demoBlockComponentPath);

        const isPure = node?.meta?.includes('pure');

        // do nothing for pure mode
        if (isPure) {
          return;
        }

        // every code block can change their preview mode by meta
        const isMobileMode =
          node?.meta?.includes('mobile') ||
          (!node?.meta?.includes('web') && isMobile);

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

        if (isMobileMode) {
          // only add demoRoutes in mobile mode
          demoRoutes.push({
            path: demoRoute,
          });
        } else {
          demos.push(getASTNodeImport(`Demo${id}`, virtualModulePath));
        }
        Object.assign(node, {
          type: 'mdxJsxFlowElement',
          name: 'Container',
          attributes: [
            {
              type: 'mdxJsxAttribute',
              name: 'isMobile',
              value: isMobileMode,
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
            isMobileMode
              ? {
                  type: 'mdxJsxFlowElement',
                  name: null,
                }
              : {
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
