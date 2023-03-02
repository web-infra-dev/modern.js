import type Less from '../../../compiled/less';
import type {
  Options as SassOptions,
  LegacyOptions as LegacySassOptions,
} from '../../../compiled/sass';
import type * as SassLoader from '../../../compiled/sass-loader';
import type { LoaderContext } from '@rspack/core';

export type { PostCSSLoaderOptions, PostCSSPlugin } from './css';

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
    | ((content: string, loaderContext: LoaderContext) => string);
  sourceMap?: boolean;
  webpackImporter?: boolean;
  implementation?: unknown;
};
