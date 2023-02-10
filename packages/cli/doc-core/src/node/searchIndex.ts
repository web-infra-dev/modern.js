import path, { join, resolve } from 'path';
import fs from '@modern-js/utils/fs-extra';
import chalk from '@modern-js/utils/chalk';
import { RequestHandler } from '@modern-js/types';
import fetch from 'node-fetch';
import { isProduction, OUTPUT_DIR, PUBLIC_DIR } from './constants';
import { UserConfig } from '@/shared/types';
import { addLeadingSlash, SEARCH_INDEX_JSON } from '@/shared/utils';

export async function writeSearchIndex(rootDir: string, config: UserConfig) {
  const userRoot = resolve(rootDir || config.doc?.root || process.cwd());
  const cwd = process.cwd();
  const source = join(userRoot, PUBLIC_DIR, SEARCH_INDEX_JSON);
  const target = join(cwd, OUTPUT_DIR, 'static', SEARCH_INDEX_JSON);
  if (await fs.pathExists(source)) {
    await fs.move(source, target, { overwrite: true });
    if (isProduction() && config.doc?.search?.mode === 'remote') {
      const { apiUrl, indexName } = config.doc.search;
      const indexData = await fs.readFile(target);
      try {
        await fetch(`${apiUrl}?index=${indexName}`, {
          method: 'PUT',
          body: indexData,
          headers: { 'Content-Type': 'application/json' },
        });
        // eslint-disable-next-line no-console
        console.log(
          chalk.green(
            `[doc-tools] Search index uploaded to ${apiUrl}, indexName: ${indexName}`,
          ),
        );
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log(
          chalk.red(
            `[doc-tools] Upload search index \`${indexName}\` failed:\n ${e}`,
          ),
        );
      }
    }
  }
}

export function serveSearchIndexMiddleware(config: UserConfig): RequestHandler {
  return (req, res, next) => {
    const searchIndexRequestPath = addLeadingSlash(
      path.join(config.doc?.base || '', SEARCH_INDEX_JSON),
    );

    if (req.url === searchIndexRequestPath) {
      res.setHeader('Content-Type', 'application/json');
      const searchIndex = fs.readFileSync(
        path.join(process.cwd(), OUTPUT_DIR, 'static', SEARCH_INDEX_JSON),
        'utf-8',
      );
      res.end(searchIndex);
    } else {
      next?.();
    }
  };
}
