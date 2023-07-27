import path from 'path';
// @ts-expect-error
import { RawSource } from 'webpack-sources';
import { logger } from '../logger';
import { withPublicPath } from '../url';
import {
  generateScriptTag,
  getBuilderVersion,
  getPublicPathFromCompiler,
  COMPILATION_PROCESS_STAGE,
} from './util';
import type HtmlWebpackPlugin from 'html-webpack-plugin';
import type { RemOptions } from '../types';
import type { Compiler, Compilation, WebpackPluginInstance } from 'webpack';

type AutoSetRootFontSizeOptions = Omit<
  RemOptions,
  'pxtorem' | 'enableRuntime'
> & {
  /** expose root font size to global */
  rootFontSizeVariableName: string;
};

export async function getRootPixelCode(
  options: Required<AutoSetRootFontSizeOptions>,
  isCompress = false,
) {
  const code = genJSTemplate(options);

  if (!isCompress) {
    return code;
  }

  const { minify } = await import('terser');
  const { code: minifiedRuntimeCode } = await minify(
    {
      RootPixelCode: code,
    },
    {
      ecma: 5,
    },
  );
  return minifiedRuntimeCode;
}

export const DEFAULT_OPTIONS: Required<AutoSetRootFontSizeOptions> = {
  screenWidth: 375,
  rootFontSize: 50,
  maxRootFontSize: 64,
  widthQueryKey: '',
  rootFontSizeVariableName: 'ROOT_FONT_SIZE',
  excludeEntries: [],
  inlineRuntime: true,
  supportLandscape: false,
  useRootFontSizeBeyondMax: false,
};

export class AutoSetRootFontSizePlugin implements WebpackPluginInstance {
  readonly name: string = 'AutoSetRootFontSizePlugin';

  readonly distDir: string;

  options: Required<AutoSetRootFontSizeOptions>;

  webpackEntries: Array<string>;

  scriptPath: string;

  HtmlPlugin: typeof HtmlWebpackPlugin;

  constructor(
    options: RemOptions,
    entries: Array<string>,
    HtmlPlugin: typeof HtmlWebpackPlugin,
    distDir: string,
  ) {
    this.options = { ...DEFAULT_OPTIONS, ...(options || {}) };
    this.scriptPath = '';
    this.distDir = distDir;
    this.webpackEntries = entries;
    this.HtmlPlugin = HtmlPlugin;
  }

  async getScriptPath() {
    if (!this.scriptPath) {
      const version = await getBuilderVersion();
      this.scriptPath = path.join(this.distDir, `convert-rem.${version}.js`);
    }

    return this.scriptPath;
  }

  apply(compiler: Compiler) {
    let runtimeCode: string | undefined;

    const getRuntimeCode = async () => {
      if (!runtimeCode) {
        const isCompress = process.env.NODE_ENV === 'production';
        runtimeCode = await getRootPixelCode(this.options, isCompress);
      }
      return runtimeCode;
    };

    if (!this.options.inlineRuntime) {
      compiler.hooks.thisCompilation.tap(
        this.name,
        (compilation: Compilation) => {
          compilation.hooks.processAssets.tapPromise(
            {
              name: this.name,
              stage: COMPILATION_PROCESS_STAGE.PROCESS_ASSETS_STAGE_PRE_PROCESS,
            },
            async assets => {
              const scriptPath = await this.getScriptPath();
              assets[scriptPath] = new RawSource(await getRuntimeCode(), false);
            },
          );
        },
      );
    }

    compiler.hooks.compilation.tap(this.name, compilation => {
      this.HtmlPlugin.getHooks(compilation).alterAssetTagGroups.tapPromise(
        this.name,
        async data => {
          const isExclude = this.options.excludeEntries.find((item: string) => {
            if (!this.webpackEntries.includes(item)) {
              logger.error(`convertToRem: can't find the entryName: ${item}`);
              return false;
            }

            const reg = new RegExp(
              `(/${item}/index.html)|(/${item}.html)`,
              'gi',
            );
            return reg.test(data.outputName);
          });

          if (isExclude) {
            return data;
          }

          const scriptTag = generateScriptTag();

          if (this.options.inlineRuntime) {
            data.headTags.unshift({
              ...scriptTag,
              innerHTML: await getRuntimeCode(),
            });
          } else {
            const publicPath = getPublicPathFromCompiler(compiler);
            const url = withPublicPath(await this.getScriptPath(), publicPath);
            data.headTags.unshift({
              ...scriptTag,
              attributes: {
                ...scriptTag.attributes,
                src: url,
              },
            });
          }

          return data;
        },
      );
    });
  }
}

export const genJSTemplate = (
  opts: Required<AutoSetRootFontSizeOptions>,
) => `function setRootPixel() {
  function getQuery(name) {
    return (new RegExp('[?&]' + name + '=([^&#\\b]+)').exec(location.search || '') || [])[1];
  }

  function setRootFontSize() {
    var widthQueryKey = '${opts.widthQueryKey}';
    var rem2px = ${opts.rootFontSize};
    var clientWidth;
    var docEl = document.documentElement;
    if (widthQueryKey && (+getQuery(widthQueryKey))) {
      clientWidth = +getQuery(widthQueryKey);
    } else {
      clientWidth = window.innerWidth && docEl.clientWidth ?
        Math.min(window.innerWidth, docEl.clientWidth) :
        (window.innerWidth || docEl.clientWidth || (document.body && document.body.clientWidth) || ${
          opts.screenWidth
        });
        ${
          opts.supportLandscape
            ? `
        var isLandscape = ((screen.orientation && screen.orientation.angle) || window.orientation) / 90 % 2;
        if (isLandscape) {
          var clientHeight = window.innerHeight && docEl.clientHeight ?
          Math.min(window.innerHeight, docEl.clientHeight) :
          (window.innerHeight || docEl.clientHeight || (document.body && document.body.clientHeight) || ${opts.screenWidth});

          clientWidth = Math.max(clientHeight, 350);
        }`
            : ''
        }
    }

    var htmlFontSizePx = (clientWidth * rem2px) / ${opts.screenWidth};
    var maxRootFontSize = ${opts.maxRootFontSize};

    ${
      opts.useRootFontSizeBeyondMax
        ? `htmlFontSizePx = htmlFontSizePx < maxRootFontSize ? htmlFontSizePx : rem2px ;`
        : `htmlFontSizePx = Math.min(htmlFontSizePx, maxRootFontSize);`
    }

    window.${opts.rootFontSizeVariableName} = htmlFontSizePx;
    docEl.style.fontSize = htmlFontSizePx + 'px';
  }

  function adjust(immediate) {
    if (immediate) {
      setRootFontSize();
      return;
    }
    setTimeout(setRootFontSize, 30);
  }

  adjust(true);

  window.addEventListener('resize', adjust, false);

  if ('onorientationchange' in window) {
    window.addEventListener('orientationchange', adjust, false);
  }
}

typeof window !== 'undefined' && setRootPixel();`;
