import HtmlWebpackPlugin from 'html-webpack-plugin';
import type { Compiler, WebpackPluginInstance } from 'webpack';
import { error } from '../shared';
import type { RemOptions } from '../types';

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
    return `<script type="text/javascript">${code}</script>`;
  }

  const { default: TerserPlugin } = await import('terser-webpack-plugin');

  const { code: minifiedRuntimeCode } = await TerserPlugin.terserMinify(
    {
      RootPixelCode: code,
    },
    undefined,
    {
      ecma: 5,
    },
    undefined,
  );

  return `<script type="text/javascript">${minifiedRuntimeCode}</script>`;
}

export const DEFAULT_OPTIONS: Required<AutoSetRootFontSizeOptions> = {
  screenWidth: 375,
  rootFontSize: 50,
  maxRootFontSize: 64,
  widthQueryKey: '',
  rootFontSizeVariableName: 'ROOT_FONT_SIZE',
  excludeEntries: [],
  supportLandscape: false,
  useRootFontSizeBeyondMax: false,
};

export class AutoSetRootFontSizePlugin implements WebpackPluginInstance {
  readonly name: string = 'AutoSetRootFontSizePlugin';

  options: Required<AutoSetRootFontSizeOptions>;

  webpackEntries: Array<string>;

  constructor(options: RemOptions, entries: Array<string>) {
    this.options = { ...DEFAULT_OPTIONS, ...(options || {}) };
    this.webpackEntries = entries;
  }

  apply(complier: Compiler) {
    const isCompress = process.env.NODE_ENV === 'production';

    const rootPixelCode = getRootPixelCode(this.options, isCompress);

    complier.hooks.compilation.tap(this.name, compilation => {
      HtmlWebpackPlugin.getHooks(compilation).beforeEmit.tapAsync(
        this.name,
        (htmlPluginData, callback) => {
          const isExclude = this.options.excludeEntries.find((item: string) => {
            if (!this.webpackEntries.includes(item)) {
              error(`Can't find the entryName: ${item}`);
              return false;
            }
            const reg = new RegExp(
              `(/${item}/index.html)|(/${item}.html)`,
              'gi',
            );

            return reg.test(htmlPluginData.outputName);
          });

          if (!isExclude) {
            htmlPluginData.html = htmlPluginData.html.replace(
              /(<body[^>]*>)/i,
              `$1${rootPixelCode}`,
            );
          }

          callback(null, htmlPluginData);
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
