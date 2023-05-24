import path from 'path';
import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import { logger } from '../../utils';
import { isProduction } from '@/shared/utils';
import { normalizeRoutePath } from '@/node/runtimeModule/routeData';
import { routeService } from '@/node/route/init';

export interface DeadLinkCheckOptions {
  root: string;
  base: string;
}

const IGNORE_REGEXP = /^(https?)|(mailto)|(tel)|(#)/;

export function checkLinks(links: string[], filepath: string, root: string) {
  const errorInfos: string[] = [];
  links
    .filter(link => !IGNORE_REGEXP.test(link))
    .forEach(link => {
      const relativePath = path.relative(root, filepath);

      if (!routeService.isExistRoute(link)) {
        errorInfos.push(
          `Internal link to ${link} is dead, check it in ${relativePath}`,
        );
      }
    });
  // output error info
  if (errorInfos.length > 0) {
    errorInfos?.forEach(err => {
      logger.error(err);
    });
    if (isProduction()) {
      throw new Error('Dead link found');
    }
  }
}

/**
 * Remark plugin to check dead links
 */
export const remarkCheckDeadLinks: Plugin<
  DeadLinkCheckOptions[]
> = checkLink => {
  const { root } = checkLink;

  return (tree, vfile) => {
    const internalLinks = new Set<string>();

    visit(tree, 'link', (node: { url: string }) => {
      const { url } = node;
      if (!url) {
        return;
      }
      if (internalLinks.has(url)) {
        return;
      }

      if (!url.startsWith('http') && !url.startsWith('https')) {
        const normalizeUrl = normalizeRoutePath(
          // fix: windows path
          url?.split(path.sep).join('/')?.split('#')[0],
        );
        internalLinks.add(normalizeUrl);
      }
    });

    checkLinks(Array.from(internalLinks), vfile.path, root);
  };
};
