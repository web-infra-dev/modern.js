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
  tsconfigPath,
  compilerOptions,
}) => {
  const { register } = await import('node:module');
  // These can be overridden by ts-node options in the project file
  process.env.TS_NODE_TRANSPILE_ONLY = true;
  if (tsconfigPath) {
    process.env.TS_NODE_PROJECT = tsconfigPath;
  } else {
    // ts-node cannot read this project (an `extends` array in the chain);
    // the caller passes the merged compiler options instead.
    process.env.TS_NODE_SKIP_PROJECT = true;
    process.env.TS_NODE_SCOPE_DIR = appDir;
  }
  process.env.TS_NODE_SCOPE = true;
  process.env.TS_NODE_FILES = true;
  process.env.TS_NODE_IGNORE = `(?:^|/)node_modules/,(?:^|/)${path.relative(
    appDir,
    distDir,
  )}/`;
  // ts-node reads compiler option overrides from this env var.
  if (compilerOptions && Object.keys(compilerOptions).length > 0) {
    process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify(compilerOptions);
  }
  register('./ts-node-loader.mjs', import.meta.url, {
    data: {
      appDir,
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
