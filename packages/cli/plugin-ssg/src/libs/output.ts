import path from 'path';
import type { ServerRoute } from '@modern-js/types';
import { fs } from '@modern-js/utils';
import type { SsgRoute } from '../types';

export function writeHtmlFile(
  htmlAry: (string | undefined)[],
  ssgRoutes: SsgRoute[],
  baseDir: string,
  pageRoutes: ServerRoute[] = [],
): SsgRoute[] {
  const renderedRoutes = ssgRoutes.filter(
    (_, index) => htmlAry[index] !== undefined,
  );
  const outputs = new Set(
    renderedRoutes.map(route => path.normalize(route.output)),
  );
  const reservedPaths = new Set([
    ...outputs,
    ...pageRoutes.map(route => path.normalize(route.entryPath)),
  ]);
  const fallbacks = new Map<string, string>();

  // Keep the original entry template before SSG overwrites its output file.
  // The entry still handles requests for pages that were not prerendered.
  for (const route of pageRoutes) {
    const entryPath = path.normalize(route.entryPath);
    if (!outputs.has(entryPath)) {
      continue;
    }
    let fallback = fallbacks.get(entryPath);
    if (!fallback) {
      const { dir, name, ext } = path.parse(entryPath);
      fallback = path.join(dir, `${name}.fallback${ext}`);
      while (reservedPaths.has(fallback)) {
        fallback = path.join(
          path.dirname(fallback),
          `${path.basename(fallback, ext)}.fallback${ext}`,
        );
      }
      fs.copyFileSync(
        path.join(baseDir, entryPath),
        path.join(baseDir, fallback),
      );
      fallbacks.set(entryPath, fallback);
      reservedPaths.add(fallback);
    }
    route.entryPath = fallback;
  }

  htmlAry.forEach((html, index) => {
    if (html === undefined) {
      return;
    }
    const ssgRoute = ssgRoutes[index];
    const filepath = path.join(baseDir, ssgRoute.output);
    fs.ensureDirSync(path.dirname(filepath));
    fs.writeFileSync(filepath, html);
  });
  return renderedRoutes;
}
