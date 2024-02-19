/* eslint-disable consistent-return */
import path, { dirname, join } from 'path';
import { createRequire } from 'node:module';
import { fs, logger } from '@modern-js/utils';

export const VIRTUAL_MODULE_BASE = '.MODERN_STORYBOOK';

export const STORIES_FILENAME = 'storybook-stories.js';
export const STORYBOOK_CONFIG_ENTRY = 'storybook-config-entry.js';

export const requireResolve = (importer: string, path: string) => {
  const require = createRequire(importer);
  require.resolve(path);
};

// use this instead of virtualModuleWebpackPlugin for rspack compatibility
export async function virtualModule(
  tempDir: string,
  cwd: string,
  virtualModuleMap: Record<string, string>,
): Promise<[Record<string, string>, (p: string, content: string) => void]> {
  fs.ensureDirSync(tempDir);
  const alias: Record<string, string> = {};

  await Promise.all(
    Reflect.ownKeys(virtualModuleMap).map(k => {
      const virtualPath = k as string;
      const relativePath = path.relative(cwd, virtualPath);
      const realPath = path.join(tempDir, relativePath);
      alias[virtualPath] = realPath;
      return fs.writeFile(realPath, virtualModuleMap[virtualPath]);
    }),
  );

  return [
    alias,
    (virtualPath: string, content: string) => {
      const relativePath = path.relative(cwd, virtualPath);
      const realPath = path.join(tempDir, relativePath);
      fs.writeFileSync(realPath, content);
    },
  ];
}

export async function toImportFn(cwd: string, stories: string[]) {
  const objectEntries = stories.map(file => {
    const ext = path.extname(file);
    const relativePath = path.relative(cwd, file);
    if (!['.js', '.jsx', '.ts', '.tsx', '.mdx'].includes(ext)) {
      logger.warn(
        `Cannot process ${ext} file with storyStoreV7: ${relativePath}`,
      );
    }

    return `  '${toImportPath(relativePath)}': async () => import('${file}')`;
  });

  return `
    const importers = {
      ${objectEntries.join(',\n')}
    };

    export async function importFn(path) {
        return importers[path]();
    }
  `;
}

function toImportPath(relativePath: string) {
  return relativePath.startsWith('../') ? relativePath : `./${relativePath}`;
}

export function getAbsolutePath<I extends string>(input: I): I {
  return dirname(require.resolve(join(input, 'package.json'))) as any;
}

export function maybeGetAbsolutePath<I extends string>(input: I): I | false {
  try {
    return getAbsolutePath(input);
  } catch (e) {
    return false;
  }
}

export async function runWithErrorMsg<T>(
  op: () => Promise<T>,
  msg: string,
): Promise<T | undefined> {
  try {
    return await op();
  } catch (e) {
    logger.error(msg);
    console.error(e);
  }
}

export function isDev() {
  return process.env.NODE_ENV === 'development';
}

export function getConfigFileName() {
  return process.env.MODERN_STORYBOOK_CONFIG_FILENAME || 'modern.config.ts';
}
