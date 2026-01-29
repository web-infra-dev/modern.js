import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { applyOptionsChain, isProd } from '@modern-js/utils';
import type { PostCSSLoaderOptions, RsbuildPlugin } from '@rsbuild/core';
import type { Options } from 'cssnano';
import { getCssSupport } from '../shared/getCssSupport';
import type { ToolsAutoprefixerConfig } from '../types';

type PostCSSConfig = NonNullable<PostCSSLoaderOptions['postcssOptions']>;
type PostCSSOptions = Exclude<PostCSSConfig, (loader: any) => any>;

const require = createRequire(import.meta.url);

const importPostcssPlugin = (name: string) =>
  Promise.resolve(require(name)) as Promise<any>;

const userPostcssrcCache = new Map<
  string,
  PostCSSOptions | Promise<PostCSSOptions>
>();

// Create a new config object,
// ensure isolation of config objects between different builds
const clonePostCSSConfig = (config: PostCSSOptions) => ({
  ...config,
  plugins: config.plugins ? [...config.plugins] : undefined,
});

// copy from rsbuild
async function loadUserPostcssrc(root: string): Promise<PostCSSOptions> {
  const cached = userPostcssrcCache.get(root);

  if (cached) {
    return clonePostCSSConfig(await cached);
  }

  // Use compiled postcss-load-config (copied to dist/compiled during build)
  // From dist/cjs/plugins/ or dist/esm-node/plugins/, go up two levels to dist/, then compiled/
  const compiledPath = require.resolve('../../compiled/postcss-load-config');
  const { default: postcssrc } = await import(pathToFileURL(compiledPath).href);

  const promise = postcssrc({}, root).catch((err: Error) => {
    // ignore the config not found error
    if (err.message?.includes('No PostCSS Config found')) {
      return {};
    }
    throw err;
  });

  userPostcssrcCache.set(root, promise);

  return promise.then((config: PostCSSOptions) => {
    userPostcssrcCache.set(root, config);
    return clonePostCSSConfig(config);
  });
}

export interface PluginPostcssOptions {
  autoprefixer?: ToolsAutoprefixerConfig;
}

// enable autoprefixer and  support compat legacy browsers
export const pluginPostcss = (
  options: PluginPostcssOptions = {},
): RsbuildPlugin => ({
  name: 'builder:postcss-plugins',

  pre: ['builder:environment-defaults-plugin'],

  setup(api) {
    const { autoprefixer } = options;
    api.modifyEnvironmentConfig(async (config, { mergeEnvironmentConfig }) => {
      if (config.output.target !== 'web') {
        return config;
      }

      // only web target provides CSS outputs, so we can ignore other target
      const cssSupport = getCssSupport(config.output.overrideBrowserslist!);
      const enableExtractCSS = !config.output?.injectStyles;

      const enableCssMinify = !enableExtractCSS && isProd();

      const cssnanoOptions: Options = {
        preset: [
          'default',
          {
            // merge longhand will break safe-area-inset-top, so disable it
            // https://github.com/cssnano/cssnano/issues/803
            // https://github.com/cssnano/cssnano/issues/967
            mergeLonghand: false,
            /**
             * normalizeUrl will transform relative url from `./assets/img.svg` to `assets/img.svg`.
             * It may break the behavior of webpack resolver while using style-loader.
             * So disable it while `output.injectStyles = true`
             */
            normalizeUrl: false,
          },
        ],
      };

      const plugins = await Promise.all([
        importPostcssPlugin('postcss-flexbugs-fixes'),
        !cssSupport.customProperties &&
          importPostcssPlugin('postcss-custom-properties'),
        !cssSupport.initial && importPostcssPlugin('postcss-initial'),
        !cssSupport.pageBreak && importPostcssPlugin('postcss-page-break'),
        !cssSupport.fontVariant && importPostcssPlugin('postcss-font-variant'),
        !cssSupport.mediaMinmax && importPostcssPlugin('postcss-media-minmax'),
        importPostcssPlugin('postcss-nesting'),
        enableCssMinify &&
          importPostcssPlugin('cssnano').then(cssnano =>
            cssnano(cssnanoOptions),
          ),
        // The last insert autoprefixer
        importPostcssPlugin('autoprefixer').then(autoprefixerPlugin =>
          autoprefixerPlugin(
            applyOptionsChain(
              {
                flexbox: 'no-2009',
                overrideBrowserslist: config.output.overrideBrowserslist!,
              },
              autoprefixer,
            ),
          ),
        ),
      ]).then(results => results.filter(Boolean));

      const userOptions = await loadUserPostcssrc(api.context.rootPath);

      // 1. Make sure user post.config.* can take effect
      // 2. Make sure user's object config can be merged with the default config, not override (keeps the original behavior even though this is wrong)
      return mergeEnvironmentConfig(
        {
          tools: {
            postcss: {
              postcssOptions: {
                ...userOptions,
                plugins: [...(userOptions.plugins || []), ...plugins],
              },
            },
          },
        },
        // user config has higher priority than builtin config
        config,
      );
    });
  },
});
