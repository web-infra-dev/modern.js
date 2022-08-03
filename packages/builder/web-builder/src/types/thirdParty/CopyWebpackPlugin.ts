/**
 * Ref: https://github.com/webpack-contrib/copy-webpack-plugin/blob/master/types/index.d.ts
 */
import type Buffer from 'buffer';

export type CopyPluginOptions = {
  patterns: Pattern[];
  options?: AdditionalOptions | undefined;
};

type ToFunction = (pathData: {
  context: string;
  absoluteFilename?: string;
}) => string | Promise<string>;

type To = string | ToFunction;

type ToType = 'dir' | 'file' | 'template';

type TransformerFunction = (
  input: Buffer,
  absoluteFilename: string,
) => string | Buffer | Promise<string> | Promise<Buffer>;

type TransformerCacheObject =
  | {
      keys: {
        [key: string]: any;
      };
    }
  | {
      keys: (
        defaultCacheKeys: {
          [key: string]: any;
        },
        absoluteFilename: string,
      ) => Promise<{
        [key: string]: any;
      }>;
    };

type TransformerObject = {
  transformer: TransformerFunction;
  cache?: boolean | TransformerCacheObject | undefined;
};

type Transform = TransformerFunction | TransformerObject;

type Filter = (filepath: string) => boolean | Promise<boolean>;

type TransformAllFunction = (
  data: {
    data: Buffer;
    sourceFilename: string;
    absoluteFilename: string;
  }[],
) => string | Buffer | Promise<string> | Promise<Buffer>;

type Info =
  | Record<string, any>
  | ((item: {
      absoluteFilename: string;
      sourceFilename: string;
      filename: string;
      toType: ToType;
    }) => Record<string, any>);

type ObjectPattern = {
  from: string;
  globOptions?: import('@modern-js/utils/globby').GlobbyOptions | undefined;
  context?: string | undefined;
  to?: To | undefined;
  toType?: ToType | undefined;
  info?: Info | undefined;
  filter?: Filter | undefined;
  transform?: Transform | undefined;
  transformAll?: TransformAllFunction | undefined;
  force?: boolean | undefined;
  priority?: number | undefined;
  noErrorOnMissing?: boolean | undefined;
};

type Pattern = string | ObjectPattern;

type AdditionalOptions = {
  concurrency?: number | undefined;
};
