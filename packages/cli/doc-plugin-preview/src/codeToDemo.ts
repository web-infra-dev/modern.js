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
  [
    {
      isMobile: boolean;
      getRouteMeta: () => RouteMeta[];
      iframePosition: 'fixed' | 'follow';
    },
  ],
  Root
> = ({ isMobile, getRouteMeta, iframePosition }) => {
  const routeMeta = getRouteMeta();

  return (tree, vfile) => {
    const demos: MdxjsEsm[] = [];
    const route = routeMeta.find(
      meta => meta.absolutePath === (vfile.path || vfile.history[0]),
    );
    if (!route) {
      return;
    }
    const { pageName } = route;
    let index = 1;
    let externalDemoIndex = 0;

    function constructDemoNode(
      demoId: string,
      demoPath: string,
      currentNode: any,
      isMobileMode: boolean,
      // Only for external demo
      externalDemoIndex?: number,
    ) {
      const demoRoute = `/~demo/${demoId}`;
      if (isMobileMode) {
        // only add demoRoutes in mobile mode
        demoRoutes.push({
          path: demoRoute,
        });
      } else {
        demos.push(getASTNodeImport(`Demo${demoId}`, demoPath));
      }

      // get external demo content
      const tempVar = `externalDemoContent${externalDemoIndex}`;
      if (externalDemoIndex !== undefined) {
        demos.push(getASTNodeImport(tempVar, `${demoPath}?raw`));
      }

      if (isMobileMode && iframePosition === 'fixed') {
        // Only show the code block
        externalDemoIndex !== undefined &&
          Object.assign(currentNode, getExternalDemoContent(tempVar));
      } else {
        // Use container to show the code and view
        Object.assign(currentNode, {
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
            externalDemoIndex === undefined
              ? {
                  ...currentNode,
                  hasVisited: true,
                }
              : getExternalDemoContent(tempVar),
            isMobileMode
              ? {
                  type: 'mdxJsxFlowElement',
                  name: null,
                }
              : {
                  type: 'mdxJsxFlowElement',
                  name: `Demo${demoId}`,
                },
          ],
        });
      }
    }

    // 1. External demo , use <code src="xxx" /> to declare demo
    tree.children.forEach((node: any) => {
      if (node.type === 'mdxJsxFlowElement' && node.name === 'code') {
        const src = node.attributes.find(
          (attr: { name: string; value: string }) => attr.name === 'src',
        )?.value;
        const isMobileMode =
          node.attributes.find(
            (attr: { name: string; value: boolean }) =>
              attr.name === 'isMobile',
          )?.value ?? isMobile;
        if (!src) {
          return;
        }
        const id = `${toValidVarName(pageName)}_${index++}`;
        constructDemoNode(id, src, node, isMobileMode, externalDemoIndex++);
      }
    });

    // 2. Internal demo, use ```j/tsx to declare demo
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

        const demoDir = join(
          process.cwd(),
          'node_modules',
          '.modern-doc',
          `virtual-demo`,
        );
        const id = `${toValidVarName(pageName)}_${index++}`;
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
        constructDemoNode(id, virtualModulePath, node, isMobileMode);
      }
    });

    tree.children.unshift(...demos);
  };
};

const getASTNodeImport = (name: string, from: string) =>
  ({
    type: 'mdxjsEsm',
    value: `import ${name} from ${JSON.stringify(from)}`,
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
              raw: `${JSON.stringify(from)}`,
            },
          },
        ],
      },
    },
  } as MdxjsEsm);

const getExternalDemoContent = (tempVar: string) => ({
  type: 'mdxJsxFlowElement',
  name: 'pre',
  children: [
    {
      type: 'mdxJsxFlowElement',
      name: 'code',
      attributes: [
        {
          type: 'mdxJsxAttribute',
          name: 'className',
          value: 'language-tsx',
        },
        {
          type: 'mdxJsxAttribute',
          name: 'children',
          value: {
            type: 'mdxJsxExpressionAttribute',
            value: tempVar,
            data: {
              estree: {
                type: 'Program',
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
        },
      ],
    },
  ],
});
