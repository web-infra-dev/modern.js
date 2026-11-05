import path from 'path';
import { fs } from '@modern-js/utils';
import type { SsgRoute } from '../types';

export function writeHtmlFile(
  htmlAry: (string | undefined)[],
  ssgRoutes: SsgRoute[],
  baseDir: string,
) {
  htmlAry.forEach((html, index) => {
    if (html === undefined) {
      return;
    }
    const ssgRoute = ssgRoutes[index];
    const filepath = path.join(baseDir, ssgRoute.output);
    if (!fs.existsSync(path.dirname(filepath))) {
      fs.ensureDirSync(path.dirname(filepath));
    }

    fs.writeFileSync(filepath, html);
  });
}
