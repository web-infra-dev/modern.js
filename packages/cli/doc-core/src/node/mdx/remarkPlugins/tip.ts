import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';
import { Root, Node } from 'hast';
import { DIRECTIVE_TYPES } from '../../constants';

interface DirectiveNode {
  type: string;
  name?: string;
  attributes?: {
    title?: string;
  };
  data?: unknown;
  children?: Node[];
}

interface InitialData {
  hName?: string;
  hProperties?: Record<string, string>;
}

export const remarkPluginTip: Plugin<[], Root> = () => {
  return (tree: Root) => {
    visit(tree, (node: DirectiveNode) => {
      if (node.type !== 'containerDirective' || !node.name) {
        return;
      }
      const name = DIRECTIVE_TYPES.includes(node.name)
        ? node.name
        : DIRECTIVE_TYPES[0];
      const customTitle = node.attributes?.title;
      const data: InitialData = node.data || (node.data = {});
      const { children } = node;

      data.hName = 'div';
      data.hProperties = {
        class: `modern-directive ${name}`,
      };

      node.children = [
        {
          type: 'paragraph',
          data: {
            hProperties: {
              class: 'modern-directive-title',
            },
          },
          children: [
            { type: 'text', value: customTitle ?? name.toLocaleUpperCase() },
          ],
        },
        {
          type: 'element',
          data: {
            hProperties: { class: 'modern-directive-content' },
          },
          children,
        },
      ] as unknown as Node[];
    });
  };
};
