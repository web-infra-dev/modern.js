import qs from 'querystring';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';
import type { Element, Root } from 'hast';

export const rehypePluginPreWrapper: Plugin<[], Root> = () => {
  return tree => {
    visit(tree, 'element', node => {
      // <pre><code>...</code></pre>
      // 1. 找到 pre 元素
      if (
        node.tagName === 'pre' &&
        node.children[0]?.type === 'element' &&
        node.children[0].tagName === 'code' &&
        !node.data?.isVisited
      ) {
        const codeNode = node.children[0];
        const codeClassName =
          codeNode.properties?.className?.toString() || 'language-text';
        // language-xxx
        // const lang = codeClassName.split('-')[1];
        const meta = (codeNode.data?.meta as string) || '';
        const parsedMeta = qs.parse(meta);
        const rawTitle = Array.isArray(parsedMeta.title)
          ? parsedMeta.title.join('')
          : parsedMeta.title;
        const title = rawTitle?.replace(/["'`]/g, '');
        const clonedNode: Element = {
          type: 'element',
          tagName: 'pre',
          children: node.children,
          data: {
            isVisited: true,
          },
        };

        // 修改原来的 pre 标签 -> div 标签
        node.tagName = 'div';
        node.properties = node.properties || {};
        node.properties.className = codeClassName;

        node.children = [
          {
            type: 'element',
            tagName: 'div',
            properties: {
              className: title ? 'modern-code-title' : '',
            },
            children: [
              {
                type: 'text',
                value: title as string,
              },
            ],
          },
          {
            type: 'element',
            tagName: 'div',
            properties: {
              className: 'modern-code-content',
            },
            children: [
              {
                type: 'element',
                tagName: 'button',
                properties: {
                  className: 'copy',
                },
                children: [
                  {
                    type: 'text',
                    value: '',
                  },
                ],
              },
              clonedNode,
            ],
          },
        ];
      }
    });
  };
};
