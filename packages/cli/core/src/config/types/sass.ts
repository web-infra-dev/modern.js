import type { LegacyFileOptions } from 'sass';

export interface SassLoaderOptions {
  sassOptions?: LegacyFileOptions<'sync'>;
  sourceMap?: boolean;
  implementation?: string;
  additionalData?: string | ((content: string, filename: string) => string);
}

export type SassConfig =
  | SassLoaderOptions
  // FIXME: utils type
  | ((options: SassLoaderOptions, utils?: any) => SassLoaderOptions | void);
