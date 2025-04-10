import type { RsbuildPlugin } from '@rsbuild/core';
import type { IPXOptions } from 'ipx';
import { withoutBase } from 'ufo';
import { logger } from './logger';
import { DEFAULT_IPX_BASENAME } from './shared/constants';
import { invariant, isModuleNotFoundError } from './shared/utils';
import type { ImageSerializableContext } from './types/image';

export interface ExtendedIPXOptions extends Partial<IPXOptions> {
  basename?: string;
}

export interface PluginImageOptions extends ImageSerializableContext {
  ipx?: ExtendedIPXOptions;
}

class IPXNotFoundError extends Error {
  constructor() {
    super(
      'Failed to load ipx module, try to install it by `pnpm add -D ipx` or leave the `ipx` option empty and setup any other image loader.',
    );
    this.name = 'IPXNotFoundError';
  }
}

class LoaderOrIPXRequiredError extends Error {
  constructor() {
    super(
      'You must enable the builtin `ipx` middleware or configure a custom `loader` file to use the image plugin.',
    );
  }
}

async function loadIPXModule() {
  try {
    return await import('ipx');
  } catch (err) {
    if (isModuleNotFoundError(err)) throw new IPXNotFoundError();
    throw err;
  }
}

export const pluginImage = (options?: PluginImageOptions): RsbuildPlugin => {
  return {
    name: '@modern-js/rsbuild-plugin-image',
    async setup(api) {
      // Serialize and inject the options to the runtime context.
      api.modifyRsbuildConfig(async (config, { mergeRsbuildConfig }) => {
        if (!options?.ipx && !options?.loader)
          throw new LoaderOrIPXRequiredError();

        let serializable: ImageSerializableContext | undefined;

        if (options) {
          const { densities, loader, loading, placeholder, quality } = options;
          serializable = { densities, loader, loading, placeholder, quality };
        }

        return mergeRsbuildConfig(config, {
          source: {
            define: {
              __INTERNAL_MODERNJS_IMAGE_OPTIONS__: JSON.stringify(serializable),
            },
          },
          resolve: {
            alias: aliases => {
              if (options?.loader) {
                aliases.__INTERNAL_MODERNJS_IMAGE_LOADER__ = options.loader;
              } else {
                aliases.__INTERNAL_MODERNJS_IMAGE_LOADER__ = require.resolve(
                  './runtime/image/loader',
                );
              }
              return aliases;
            },
          },
        });
      });

      // Setup the IPX middleware.
      api.modifyRsbuildConfig(async (config, { mergeRsbuildConfig }) => {
        if (!options?.ipx) return;
        const { createIPX, createIPXNodeServer, ipxFSStorage } =
          await loadIPXModule();
        const { basename = DEFAULT_IPX_BASENAME, ...ipxOptions } = options.ipx;

        return mergeRsbuildConfig(config, {
          source: {
            define: {
              __INTERNAL_MODERNJS_IMAGE_BASENAME__: JSON.stringify(basename),
            },
          },
          dev: {
            setupMiddlewares: [
              middlewares => {
                const { distPath } = api.context;
                invariant(distPath, 'distPath is required');

                const { storage = ipxFSStorage({ dir: distPath }), ...rest } =
                  ipxOptions;
                const ipx = createIPX({ storage, ...rest });
                logger.debug(`Created IPX with local storage from ${distPath}`);
                logger.debug(`Created IPX with basename ${basename}`);

                const originalMiddleware = createIPXNodeServer(ipx);
                middlewares.push((req, res, _next) => {
                  const next = () => {
                    logger.debug(`IPX middleware incoming request: ${req.url}`);
                    _next();
                  };
                  if (!req.url) return next();
                  const newUrl = withoutBase(req.url, basename);
                  if (newUrl === req.url) return next();
                  req.url = newUrl;

                  logger.debug(
                    `IPX middleware incoming request (accepted): ${req.url}`,
                  );
                  return originalMiddleware(req, res);
                });
              },
            ],
          },
        });
      });

      // Modify the bundler chain to add the image loader.
      api.modifyBundlerChain(chain => {
        chain.module
          .rule('image-component-module')
          .type('javascript/auto')
          .resourceQuery(/\?image$/)
          .use('image-component-loader')
          .loader(require.resolve('./loader.js'));
      });
    },
  };
};

export default pluginImage;
