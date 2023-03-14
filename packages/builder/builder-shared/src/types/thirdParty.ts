import type {
  Options as SassOptions,
  LegacyOptions as LegacySassOptions,
} from '../../compiled/sass';
import type * as SassLoader from '../../compiled/sass-loader';
import type Less from '../../compiled/less';
import type { LoaderContext } from 'webpack';

export type { BabelTransformOptions } from '@modern-js/types';
export type {
  BabelConfigUtils,
  BabelOptions,
} from '@modern-js/babel-preset-app';
export { applyUserBabelConfig } from '@modern-js/babel-preset-app';

export type AutoprefixerOptions = {
  /** environment for `Browserslist` */
  env?: string;

  /** should Autoprefixer use Visual Cascade, if CSS is uncompressed */
  cascade?: boolean;

  /** should Autoprefixer add prefixes. */
  add?: boolean;

  /** should Autoprefixer [remove outdated] prefixes */
  remove?: boolean;

  /** should Autoprefixer add prefixes for @supports parameters. */
  supports?: boolean;

  /** should Autoprefixer add prefixes for flexbox properties */
  flexbox?: boolean | 'no-2009';

  /** should Autoprefixer add IE 10-11 prefixes for Grid Layout properties */
  grid?: boolean | 'autoplace' | 'no-autoplace';

  /**
   * list of queries for target browsers.
   * Try to not use it.
   * The best practice is to use `.browserslistrc` config or `browserslist` key in `package.json`
   * to share target browsers with Babel, ESLint and Stylelint
   */
  overrideBrowserslist?: string | string[];

  /** do not raise error on unknown browser version in `Browserslist` config. */
  ignoreUnknownVersions?: boolean;
};

export type SassLoaderOptions = Omit<SassLoader.Options, 'sassOptions'> &
  (
    | {
        api?: 'legacy';
        sassOptions?: Partial<LegacySassOptions<'async'>>;
      }
    | {
        api: 'modern';
        sassOptions?: SassOptions<'async'>;
      }
  );

export type LessLoaderOptions = {
  lessOptions?: Less.Options;
  additionalData?:
    | string
    | ((
        content: string,
        loaderContext: LoaderContext<LessLoaderOptions>,
      ) => string);
  sourceMap?: boolean;
  webpackImporter?: boolean;
  implementation?: unknown;
};
