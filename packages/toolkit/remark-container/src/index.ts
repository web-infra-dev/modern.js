/**
 * 🚀 This plugin is used to support container directive in unified.
 * Taking into account the compatibility of the VuePress/Docusaurus container directive, current remark plugin in unified ecosystem only supports the following syntax:
 * ::: tip {title="xxx"}
 * This is a tip
 * :::
 * But the following syntax is not supported:
 * ::: tip xxx
 * This is a tip
 * :::
 * In fact, the syntax is usually used in SSG Frameworks, such as VuePress/Docusaurus.
 * So the plugin is used to solve the problem and support both syntaxes in above cases.
 */

import type { Plugin } from 'unified';
import {
  Root,
  Content,
  Parent,
  BlockContent,
  PhrasingContent,
  Paragraph,
  Literal,
} from 'mdast';

export const DIRECTIVE_TYPES: string[] = [
  'tip',
  'note',
  'warning',
  'caution',
  'danger',
  'info',
];
export const REGEX_BEGIN = /^\s*:::\s*(\w+)\s*(.*)?/;
export const REGEX_END = /\s*:::$/;
export const TITLE_REGEX_IN_MD = /{\s*title=["']?(.+)}\s*/;
export const TITLE_REGEX_IN_MDX = /\s*title=["']?(.+)\s*/;

const trimTailingQuote = (str: string) => str.replace(/['"]$/g, '');

const parseTitle = (rawTitle = '', isMDX = false) => {
  const matched = rawTitle?.match(
    isMDX ? TITLE_REGEX_IN_MDX : TITLE_REGEX_IN_MD,
  );
  return trimTailingQuote(matched?.[1] || rawTitle);
};

/**
 * Construct the DOM structure of the container directive.
 * For example:
 *
 * ::: tip {title="xxx"}
 * This is a tip
 * :::
 *
 * will be transformed to:
 *
 * <div class="modern-directive tip">
 *   <p class="modern-directive-title">TIP</p>
 *   <div class="modern-directive-content">
 *     <p>This is a tip</p>
 *   </div>
 * </div>
 *
 */
const createContainer = (
  type: string,
  title: string | undefined,
  children: BlockContent[],
): Parent => ({
  type: 'containerDirective',
  data: {
    hName: 'div',
    hProperties: {
      class: `modern-directive ${type}`,
    },
  },
  children: [
    {
      type: 'paragraph',
      data: {
        hProperties: {
          class: 'modern-directive-title',
        },
      },
      children: [{ type: 'text', value: title || type.toUpperCase() }],
    },
    {
      type: 'paragraph',
      data: {
        hName: 'div',
        hProperties: { class: 'modern-directive-content' },
      },
      children: children as PhrasingContent[],
    },
  ],
});

/**
 * How the transformer works:
 * 1. We get the paragraph and check if it is a container directive
 * 2. If it is, crawl the next nodes, if there is a paragraph node, we need to check if it is the end of the container directive. If not, we need to push it to the children of the container directive node.
 * 3. If we find the end of the container directive, we remove the visited node and insert the custom container directive node.
 */
function transformer(tree: Root) {
  let i = 0;
  try {
    while (i < tree.children.length) {
      const node = tree.children[i];
      if (node.type !== 'paragraph') {
        i++;
        continue;
      }
      // 1. We get the paragraph and check if it is a container directive
      if (node.children[0].type !== 'text') {
        i++;
        continue;
      }
      const firstTextNode = node.children[0];
      const text = firstTextNode.value;
      const metaText = text.split('\n')[0];
      const content = text.slice(metaText.length);
      const match = metaText.match(REGEX_BEGIN);
      if (!match) {
        i++;
        continue;
      }
      const [, type, rawTitle] = match;
      // In .md, we can get :::tip{title="xxx"} in the first text node
      // In .mdx, we get :::tip in first node and {title="xxx"} in second node
      let title = parseTitle(rawTitle);
      // :::tip{title="xxx"}
      const titleExpressionNode =
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error mdxTextExpression is not defined in mdast
        node.children[1] && node.children[1].type === 'mdxTextExpression'
          ? node.children[1]
          : null;
      // Handle the case of `::: tip {title="xxx"}`
      if (titleExpressionNode) {
        title = parseTitle((titleExpressionNode as Literal).value, true);
        // {title="xxx"} is not a part of the content, So we need to remove it
        node.children.splice(1, 1);
      }
      if (!DIRECTIVE_TYPES.includes(type)) {
        i++;
        continue;
      }
      // 2. If it is, we remove the paragraph and create a container directive
      const wrappedChildren: BlockContent[] = [];
      // 2.1 case: with no newline between `:::` and `:::`, for example
      // ::: tip
      // This is a tip
      // :::
      // Here the content is `::: tip\nThis is a tip\n:::`
      if (content?.endsWith(':::')) {
        wrappedChildren.push({
          type: 'paragraph',
          children: [
            {
              type: 'text',
              value: content.replace(REGEX_END, ''),
            },
          ],
        });
        const newChild = createContainer(type, title, wrappedChildren);
        tree.children.splice(i, 1, newChild as Content);
      } else {
        // 2.2 case: with newline before the end of container, for example:
        // ::: tip
        // This is a tip
        //
        // :::
        // Here the content is `::: tip\nThis is a tip`
        const paragraphChild: Paragraph = {
          type: 'paragraph',
          children: [] as PhrasingContent[],
        };
        wrappedChildren.push(paragraphChild);
        if (content.length) {
          paragraphChild.children.push({
            type: 'text',
            value: content,
          });
        }
        paragraphChild.children.push(...node.children.slice(1, -1));
        // If the inserted paragraph is empty, we remove it
        if (paragraphChild.children.length === 0) {
          wrappedChildren.pop();
        }
        const lastChildInNode = node.children[node.children.length - 1];
        // We find the end of the container directive in current paragraph
        if (
          lastChildInNode.type === 'text' &&
          REGEX_END.test(lastChildInNode.value)
        ) {
          const lastChildInNodeText = lastChildInNode.value;
          const matchedEndContent = lastChildInNodeText.slice(0, -3).trim();
          // eslint-disable-next-line max-depth
          if (wrappedChildren.length) {
            (wrappedChildren[0] as Paragraph).children.push({
              type: 'text',
              value: matchedEndContent,
            });
          } else if (matchedEndContent) {
            wrappedChildren.push({
              type: 'paragraph',
              children: [
                {
                  type: 'text',
                  value: matchedEndContent,
                },
              ],
            });
          }
          const newChild = createContainer(type, title, wrappedChildren);
          tree.children.splice(i, 1, newChild as Content);
          i++;
          continue;
        } else if (
          lastChildInNode !== firstTextNode &&
          wrappedChildren.length
        ) {
          // We don't find the end of the container directive in current paragraph
          (wrappedChildren[0] as Paragraph).children.push(lastChildInNode);
        }
        // 2.3 The final case: has newline after the start of container, for example:
        // ::: tip
        //
        // This is a tip
        // :::

        // All of the above cases need to crawl the children of the container directive node.
        // In other word, We look for the next paragraph nodes and collect all the content until we find the end of the container directive
        let j = i + 1;
        while (j < tree.children.length) {
          const currentParagraph = tree.children[j];
          if (currentParagraph.type !== 'paragraph') {
            wrappedChildren.push(currentParagraph as BlockContent);
            j++;
            continue;
          }
          const lastChild =
            currentParagraph.children[currentParagraph.children.length - 1];
          // The whole paragrph doesn't arrive at the end of the container directive, we collect the whole paragraph
          if (
            lastChild !== firstTextNode &&
            (lastChild.type !== 'text' || !REGEX_END.test(lastChild.value))
          ) {
            wrappedChildren.push({
              ...currentParagraph,
              children: currentParagraph.children.filter(
                child => child !== firstTextNode,
              ),
            });
            j++;
            continue;
          } else {
            // 3. We find the end of the container directive
            // Then create the container directive, and remove the original paragraphs
            // Finally, we insert the new container directive and break the loop
            const lastChildText = lastChild.value;
            const matchedEndContent = lastChildText.slice(0, -3).trim();
            wrappedChildren.push(
              ...(currentParagraph.children.filter(
                child => child !== firstTextNode && child !== lastChild,
              ) as BlockContent[]),
            );

            if (matchedEndContent) {
              wrappedChildren.push({
                type: 'paragraph',
                children: [
                  {
                    type: 'text',
                    value: matchedEndContent,
                  },
                ],
              });
            }
            const newChild = createContainer(type, title, wrappedChildren);
            tree.children.splice(i, j - i + 1, newChild as Content);
            break;
          }
        }
      }
      i++;
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
    throw e;
  }
}

export const remarkPluginContainer: Plugin<[], Root> = () => {
  return transformer;
};

export default remarkPluginContainer;
