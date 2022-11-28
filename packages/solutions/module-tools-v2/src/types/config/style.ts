import type { Style } from '@modern-js/libuild';
import type { AcceptedPlugin as PostCSSPlugin } from 'postcss';

export type LessOptions = Required<Style>['less'];
export type SassOptions = Required<Style>['sass'];
export type PostcssOptions = Required<Style>['postcss'];

export type LessConfig =
  | LessOptions
  | ((options: LessOptions) => LessOptions | void);

export type SassConfig =
  | SassOptions
  | ((options: SassOptions) => SassOptions | void);

export type PostCSSConfigUtils = {
  addPlugins: (plugins: PostCSSPlugin | PostCSSPlugin[]) => void;
};
export type PostCSSConfig =
  | PostcssOptions
  | ((
      options: PostcssOptions,
      utils: PostCSSConfigUtils,
    ) => PostcssOptions | void);
