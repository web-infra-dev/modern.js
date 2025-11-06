import { applyOptionsChain, isProd } from '@modern-js/utils';
import type { PostCSSLoaderOptions, RsbuildPlugin } from '@rsbuild/core';
import type { Options } from 'cssnano';
import { getCssSupport } from '../shared/getCssSupport';
import type { ToolsAutoprefixerConfig } from '../types';

type PostCSSConfig = NonNullable<PostCSSLoaderOptions['postcssOptions']>;
type PostCSSOptions = Exclude<PostCSSConfig, (loader: any) => any>;

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

  const { default: postcssrc } = await import(
    '../../compiled/postcss-load-config'
  );

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

      const enableCssMinify = !enableExtractCSS && isProd;

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

      const plugins = [
        require('postcss-flexbugs-fixes'),
        !cssSupport.customProperties && require('postcss-custom-properties'),
        !cssSupport.initial && require('postcss-initial'),
        !cssSupport.pageBreak && require('postcss-page-break'),
        !cssSupport.fontVariant && require('postcss-font-variant'),
        !cssSupport.mediaMinmax && require('postcss-media-minmax'),
        require('postcss-nesting'),
        enableCssMinify ? require('cssnano')(cssnanoOptions) : false,
        // The last insert autoprefixer
        require('autoprefixer')(
          applyOptionsChain(
            {
              flexbox: 'no-2009',
              overrideBrowserslist: config.output.overrideBrowserslist!,
            },
            autoprefixer,
          ),
        ),
      ].filter(Boolean);

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
