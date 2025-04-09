import type { RequestHandler, RsbuildPlugin } from '@rsbuild/core';
import type { IPX, IPXOptions, createIPXNodeServer } from 'ipx';
import { logger } from './logger';
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
        const ipxModule = options?.ipx && (await loadIPXModule());

        return mergeRsbuildConfig(config, {
          source: {
            define: {
              __INTERNAL_MODERNJS_IMAGE_OPTIONS__: JSON.stringify(options),
            },
          },
          resolve: {
            alias: aliases => {
              if (options?.loader) {
                aliases.__INTERNAL_MODERNJS_IMAGE_LOADER__ = options.loader;
              }
              return aliases;
            },
          },
          dev: {
            setupMiddlewares: [
              middlewares => {
                if (!options?.ipx || !ipxModule) return;
                const { distPath } = api.context;
                invariant(distPath, 'distPath is required');
                const { createIPX, createIPXNodeServer, ipxFSStorage } =
                  ipxModule;
                const {
                  storage = ipxFSStorage({ dir: distPath }),
                  basename = '/_modern_js/image',
                  ...rest
                } = options.ipx;
                const ipx = createIPX({ storage, ...rest });
                logger.debug(`Created IPX with local storage from ${distPath}`);
                logger.debug(`Created IPX with basename ${basename}`);
                const originalMiddleware = createIPXNodeServer(ipx);
                middlewares.push((req, res, next) => {
                  logger.debug(
                    `Incoming request to the IPX middleware: ${req.url}`,
                  );
                  if (req.url?.startsWith(basename)) {
                    req.url = req.url.slice(basename.length);
                    return originalMiddleware(req, res);
                  }
                  return next();
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
