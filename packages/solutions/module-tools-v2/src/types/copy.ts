import type { globby } from '@modern-js/utils';

export interface CopyOptions {
  patterns?: {
    from: string;
    to?: string;
    context?: string;
    globOptions?: globby.GlobbyOptions;
  }[];
  options?: {
    concurrency?: number;
  };
}

export type CopyConfig = CopyOptions;
