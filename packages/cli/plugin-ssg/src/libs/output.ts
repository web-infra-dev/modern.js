import path from 'path';
import { fs } from '@modern-js/utils';
import { SsgRoute } from '../types';

export function writeHtmlFile(
  htmlAry: string[],
  ssgRoutes: SsgRoute[],
  baseDir: string,
) {
  htmlAry.forEach((html: any, index: number) => {
    const ssgRoute = ssgRoutes[index];
    const filepath = path.join(baseDir, ssgRoute.output!);
    if (!fs.existsSync(path.dirname(filepath))) {
      fs.ensureDirSync(path.dirname(filepath));
    }

    fs.writeFileSync(filepath, html);
  });
}
