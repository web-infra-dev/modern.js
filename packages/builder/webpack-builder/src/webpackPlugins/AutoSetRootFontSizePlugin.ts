import { chalk } from '@modern-js/utils';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import type { Compiler, WebpackPluginInstance } from 'webpack';
import { RemOptions } from '../types/config/rem';

type AutoSetRootFontSizeOptions = Omit<
  RemOptions,
  'pxtorem' | 'enableRuntime'
> & { rootFontSizeVariableName: string };

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

export const DEFAULT_OPTIONS = {
  // for iPhone 6
  screenWidth: 375,

  // root font size
  rootFontSize: 50,

  // maximum value of root font size
  maxRootFontSize: 64,

  // 根据 widthQueryKey 的值去 url query 里取屏幕的宽度
  widthQueryKey: '',

  // we will expose root font size to global, this is the variable name
  rootFontSizeVariableName: 'ROOT_FONT_SIZE',

  // 不进行调整的entry
  excludeEntries: [],

  // 横屏时使用 height 计算 rem
  supportLandscape: false,

  // 超过 maxRootFontSize 时，是否使用 rootFontSize。场景：rem 在 pc 上的尺寸计算正常
  useRootFontSizeBeyondMax: false,
};

export class AutoSetRootFontSizePlugin implements WebpackPluginInstance {
  readonly name: string;

  options: Required<AutoSetRootFontSizeOptions>;

  webpackEntries: Array<string>;

  constructor(options: RemOptions, entries: Array<string>) {
    this.name = 'AutoSetRootFontSizePlugin';
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
              console.error(chalk.red(`Can't find the entryName: ${item}`));
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
