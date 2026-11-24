/**
 * Register Node.js module hooks that compile the app's TypeScript with swc.
 */
export const registerSwcModuleHooks = async ({
  appDir,
  distDir,
  baseUrl,
  paths,
  swcOptions,
}) => {
  const { register } = await import('node:module');
  register('./swc-loader.mjs', import.meta.url, {
    data: {
      appDir,
      distDir,
      baseUrl,
      paths,
      swcOptions,
    },
  });
};
