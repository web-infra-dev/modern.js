import type { Plugin } from 'unified';
import { visitChildren } from 'unist-util-visit-children';
import { parse } from 'acorn';
import Slugger from 'github-slugger';
import type { Root } from 'hast';
import type { MdxjsEsm, Program } from 'mdast-util-mdxjs-esm';
import { Header } from '@/shared/types';

interface ChildNode {
  type: 'link' | 'text' | 'inlineCode';
  value: string;
  children?: ChildNode[];
}

interface Heading {
  type: string;
  depth?: number;
  children?: ChildNode[];
}

export const parseToc = (tree: Root) => {
  let title = '';
  const toc: Header[] = [];
  const slugger = new Slugger();
  visitChildren((node: Heading) => {
    if (node.type !== 'heading' || !node.depth || !node.children) {
      return;
    }
    // Collect h2 ~ h5
    if (node.depth === 1) {
      title = node.children[0].value;
    }

    if (node.depth > 1 && node.depth < 5) {
      const originText = node.children
        .map((child: ChildNode) => {
          if (child.type === 'link') {
            return child.children?.map(item => item.value).join('');
          } else {
            return child.value;
          }
        })
        .join('');
      const id = slugger.slug(originText);

      const { depth } = node;
      toc.push({ id, text: originText, depth });
    }
  })(tree);
  return {
    title,
    toc,
  };
};

export const remarkPluginToc: Plugin<[], Root> = () => {
  return (tree: Root) => {
    const { toc, title } = parseToc(tree);

    const insertedTocCode = `export const toc = ${JSON.stringify(
      toc,
      null,
      2,
    )}`;
    // Add toc ast to current ast tree
    tree.children.push({
      type: 'mdxjsEsm',
      value: insertedTocCode,
      data: {
        estree: parse(insertedTocCode, {
          ecmaVersion: 2020,
          sourceType: 'module',
        }) as unknown as Program,
      },
    } as MdxjsEsm);

    if (title) {
      const insertedTitle = `export const title = "${title}"`;
      tree.children.push({
        type: 'mdxjsEsm',
        value: insertedTitle,
        data: {
          estree: {
            type: 'Program',
            sourceType: 'module',
            body: [
              {
                type: 'ExportNamedDeclaration',
                declaration: {
                  type: 'VariableDeclaration',
                  kind: 'const',
                  declarations: [
                    {
                      type: 'VariableDeclarator',
                      id: {
                        type: 'Identifier',
                        name: 'title',
                      },
                      init: {
                        type: 'Literal',
                        value: title,
                        raw: `\`${title}\``,
                      },
                    },
                  ],
                },
                specifiers: [],
              },
            ],
          },
        },
      } as MdxjsEsm);
    }
  };
};
