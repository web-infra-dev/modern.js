import type { Plugin } from 'unified';
import {
  Root,
  Content,
  Parent,
  BlockContent,
  PhrasingContent,
  Paragraph,
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

function transformer(tree: Root) {
  let i = 0;
  debugger;
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
    const [, type, title] = match;
    if (!DIRECTIVE_TYPES.includes(type)) {
      i++;
      continue;
    }
    // 2. If it is, we remove the paragraph and create a container directive
    const wrappedChildren: BlockContent[] = [];
    // 2.1 The firstTextNode include `::: type title\n`, content and `:::` in the end
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
      // 2.2 The firstTextNode include `::: type title\n` and some other content
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
        if (matchedEndContent) {
          (wrappedChildren[0] as Paragraph).children.push({
            type: 'text',
            value: matchedEndContent,
          });
        }
        const newChild = createContainer(type, title, wrappedChildren);
        tree.children.splice(i, 1, newChild as Content);
        i++;
        continue;
      } else if (lastChildInNode !== firstTextNode) {
        // We don't find the end of the container directive in current paragraph
        (wrappedChildren[0] as Paragraph).children.push(lastChildInNode);
      }
      // 2.3 The firstTextNode include `::: type title` only
      // We look for the next paragraph node and collect all the content until we find the end of the container directive
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
          // We find the end of the container directive
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
}

export const remarkPluginContainer: Plugin<[], Root> = () => {
  return transformer;
};

export default remarkPluginContainer;
