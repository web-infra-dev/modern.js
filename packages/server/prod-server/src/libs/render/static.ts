import path from 'path';
import { mime } from '@modern-js/utils';
import { RenderResult } from '../../type';
import { ModernServerContext } from '../context';
import { readFile } from './reader';

export async function handleDirectory(
  ctx: ModernServerContext,
  entryPath: string,
  urlPath: string,
): Promise<RenderResult | null> {
  const { path: pathname } = ctx;
  const filepath = path.join(entryPath, trimLeft(pathname, urlPath));

  // If can match accurately, always return the one that matches accurately
  let content = await readFile(filepath);
  let contentType = mime.contentType(path.extname(filepath) || '');

  // automatic addressing
  if (!content) {
    if (pathname.endsWith('/')) {
      content = await readFile(`${filepath}index.html`);
    } else if (!pathname.includes('.')) {
      content = await readFile(`${filepath}.html`);
      if (!content) {
        content = await readFile(`${filepath}/index.html`);
      }
    }

    // set content-type as html
    if (content) {
      contentType = mime.contentType('html');
    }
  }

  if (!content) {
    return null;
  }

  return {
    content,
    contentType: contentType || '',
  };
}

const trimLeft = (str: string, prefix: string): string => {
  if (str.startsWith(prefix)) {
    return str.substring(prefix.length);
  }

  return str;
};
