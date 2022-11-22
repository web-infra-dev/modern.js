import type { globby } from '@modern-js/utils';

export interface CopyPattern {
  from: string;
  to?: string;
  context?: string;
  globOptions?: globby.GlobbyOptions;
}

export interface CopyOptions {
  patterns?: CopyPattern[];
  options?: {
    concurrency?: number;
    enableCopySync?: boolean;
  };
}

export type CopyConfig = CopyOptions;
