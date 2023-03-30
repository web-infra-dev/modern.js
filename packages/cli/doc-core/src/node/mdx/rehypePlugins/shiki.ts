import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Text, Root } from 'hast';
import { fromHtml } from 'hast-util-from-html';
import shiki from 'shiki';

interface Options {
  highlighter: shiki.Highlighter;
}

export const rehypePluginShiki: Plugin<[Options], Root> = ({ highlighter }) => {
  return tree => {
    visit(tree, 'element', (node, index, parent) => {
      // <pre><code>...</code></pre>
      if (
        node.tagName === 'pre' &&
        node.children[0]?.type === 'element' &&
        node.children[0].tagName === 'code'
      ) {
        const codeNode = node.children[0];
        const codeContent = (codeNode.children[0] as Text).value;
        const codeClassName = codeNode.properties?.className?.toString() || '';
        const highlightLinesReg = /language-([a-zA-Z]*)\s*({[\d,-]*})?/i;
        const highlightResult = highlightLinesReg.exec(codeClassName);
        let highlightLines: number[] = [];
        if (highlightResult) {
          const highlightMatch = highlightResult[2];
          highlightLines = highlightMatch
            ?.replace(/[{}]/g, '')
            .split(',')
            .map(item => {
              const [start, end] = item.split('-');
              if (end) {
                return Array.from(
                  { length: Number(end) - Number(start) + 1 },
                  (_, i) => i + Number(start),
                );
              }
              return Number(start);
            })
            .flat();
        }

        // for example: language-js {1,2,3-5}
        const lang = codeClassName.split(' ')[0].split('-')[1];
        if (!lang) {
          return;
        }
        const highlightedCode = highlighter.codeToHtml(codeContent, { lang });
        const fragmentAst = fromHtml(highlightedCode, { fragment: true });
        const codeLines = (fragmentAst.children[0] as unknown as any)
          .children[0].children;

        // Take the odd lines as highlighted lines
        codeLines
          ?.filter((_: any, index: number) => index % 2 === 0)
          .forEach((line: any, index: number) => {
            if (highlightLines?.includes(index + 1)) {
              line.properties.className.push('highlighted');
            }
          });

        parent!.children.splice(index!, 1, ...fragmentAst.children);
      }
    });
  };
};
