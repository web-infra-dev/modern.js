import path from 'node:path';
import { fs } from '@modern-js/utils';

const checkDepExist = async dep => {
  try {
    await import(dep);
    return true;
  } catch {
    return false;
  }
};

/**
 * Register Node.js module hooks for TypeScript support.
 * Uses node:module register API to enable ts-node loader.
 */
export const registerModuleHooks = async ({ appDir, distDir, alias }) => {
  const TS_CONFIG_FILENAME = `tsconfig.json`;
  const tsconfigPath = path.resolve(appDir, TS_CONFIG_FILENAME);
  const hasTsconfig = await fs.pathExists(tsconfigPath);
  const hasTsNode = await checkDepExist('ts-node');

  if (!hasTsconfig || !hasTsNode) {
    return;
  }

  const { register } = await import('node:module');
  // These can be overridden by ts-node options in tsconfig.json
  process.env.TS_NODE_TRANSPILE_ONLY = true;
  process.env.TS_NODE_PROJECT = tsconfigPath;
  process.env.TS_NODE_SCOPE = true;
  process.env.TS_NODE_FILES = true;
  process.env.TS_NODE_IGNORE = `(?:^|/)node_modules/,(?:^|/)${path.relative(
    appDir,
    distDir,
  )}/`;
  register('./ts-node-loader.mjs', import.meta.url, {
    data: {
      appDir,
      distDir,
      alias,
      tsconfigPath,
    },
  });
};

/**
 * Register alias resolver hooks for Node.js 22+ native TypeScript support.
 * Used when ts-node is not available but Node has native TypeScript strip-types.
 * Handles tsconfig path aliases and extensionless imports.
 */
export const registerAliasResolver = async ({ absoluteBaseUrl, paths }) => {
  const { register } = await import('node:module');
  register('./alias-resolver.mjs', import.meta.url, {
    data: {
      absoluteBaseUrl,
      paths,
    },
  });
};
