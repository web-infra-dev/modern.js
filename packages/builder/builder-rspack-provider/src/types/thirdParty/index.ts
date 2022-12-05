import type Less from '../../../compiled/less';

export type { Options as AutoprefixerOptions } from 'autoprefixer';
export type { PostCSSLoaderOptions, PostCSSPlugin } from './css';

export interface LessLoaderOptions {
  implementation?: string;
  lessOptions?: Less.Options;
  sourceMap?: boolean;
  additionalData?:
    | string
    | ((content: string, loaderContext: any) => string)
    | ((content: string, loaderContext: any) => Promise<string>);
}
