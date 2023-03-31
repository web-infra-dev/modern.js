import path from 'path';
import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import { logger } from '@modern-js/utils/logger';
import chalk from '@modern-js/utils/chalk';
import { isProduction, withBase } from '@/shared/utils';
import {
  normalizeRoutePath,
  routeService,
} from '@/node/runtimeModule/routeData';

export interface DeadLinkCheckOptions {
  root: string;
  base: string;
}

/**
 * Remark plugin to check dead links
 */
export const remarkCheckDeadLinks: Plugin<
  DeadLinkCheckOptions[]
> = checkLink => {
  const { root, base } = checkLink;

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

    const errorInfos: string[] = [];
    internalLinks.forEach(link => {
      let normalizedRoute = link;
      const relativePath = path.relative(root, vfile.path);
      // Handle relative path
      if (link.startsWith('.')) {
        normalizedRoute = path.join(relativePath, link);
      }
      if (!routeService.isExistRoute(withBase(normalizedRoute, base))) {
        errorInfos.push(
          `Find a broken link ${chalk.yellow(link)} in ${chalk.yellow(
            relativePath,
          )}`,
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
  };
};
