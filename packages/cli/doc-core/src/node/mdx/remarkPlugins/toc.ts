import type { Plugin } from 'unified';
import { visitChildren } from 'unist-util-visit-children';
import Slugger from 'github-slugger';
import type { Root } from 'hast';
import { Processor } from '@mdx-js/mdx/lib/core';
import { PageMeta } from '../loader';

export interface TocItem {
  id: string;
  text: string;
  depth: number;
}

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
  const toc: TocItem[] = [];
  const slugger = new Slugger();
  visitChildren((node: Heading) => {
    if (node.type !== 'heading' || !node.depth || !node.children) {
      return;
    }

    // Collect h1, use first h1 as title
    if (node.depth === 1 && title.length === 0) {
      title = node.children[0].value;
    }

    // Collect h2 ~ h5
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

export const remarkPluginToc: Plugin<[], Root> = function (this: Processor) {
  const data = this.data() as {
    pageMeta: PageMeta;
  };
  return (tree: Root) => {
    const { toc, title } = parseToc(tree);
    data.pageMeta.toc = toc;
    if (title) {
      data.pageMeta.title = title;
    }
  };
};
