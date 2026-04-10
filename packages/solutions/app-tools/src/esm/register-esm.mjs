import path from 'node:path';

/**
 * Register Node.js module hooks for TypeScript support.
 * Uses node:module register API to enable ts-node loader.
 */
export const registerModuleHooks = async ({
  appDir,
  distDir,
  baseUrl,
  paths,
}) => {
  const TS_CONFIG_FILENAME = `tsconfig.json`;
  const tsconfigPath = path.resolve(appDir, TS_CONFIG_FILENAME);

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
      baseUrl,
      paths,
    },
  });
};

export const registerPathsLoader = async ({ appDir, baseUrl, paths }) => {
  const { register } = await import('node:module');
  register('./ts-paths-loader.mjs', import.meta.url, {
    data: {
      appDir,
      baseUrl,
      paths,
    },
  });
};
