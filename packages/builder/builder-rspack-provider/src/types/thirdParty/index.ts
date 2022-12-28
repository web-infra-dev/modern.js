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

// todo: get SassLoaderOptions from rspack
export interface SassLoaderOptions {
  sassOptions?: {
    charset?: boolean;
    indentedSyntax?: boolean;
    indentWidth?: number;
    includePaths?: string[];
    quietDeps?: boolean;
    verbose?: boolean;
  };
  sourceMap?: boolean;
  additionalData?: string;
  rspackImporter: boolean;
}
