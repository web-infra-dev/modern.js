import path, { join, resolve } from 'path';
import fs from '@modern-js/utils/fs-extra';
import { RequestHandler } from '@modern-js/types';
import { OUTPUT_DIR, PUBLIC_DIR } from './constants';
import { UserConfig } from '@/shared/types';
import { addLeadingSlash, SEARCH_INDEX_JSON } from '@/shared/utils';

export async function writeSearchIndex(rootDir: string, config: UserConfig) {
  const userRoot = resolve(rootDir || config.doc?.root || process.cwd());
  const cwd = process.cwd();
  const source = join(userRoot, PUBLIC_DIR, SEARCH_INDEX_JSON);
  const target = join(cwd, OUTPUT_DIR, 'static', SEARCH_INDEX_JSON);
  await fs.move(source, target, { overwrite: true });
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
